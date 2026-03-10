/**
 * Place Comments Service
 *
 * All Supabase operations for the `place_comments` table.
 *
 * Security design:
 * - Before fetching/creating comments, the service verifies the place
 *   belongs to the current pair (frontend guard).
 * - Supabase RLS is the authoritative enforcement layer.
 */

import { supabase } from '@/src/lib/supabase';
import type {
    CreateCommentPayload,
    PlaceComment,
    PlaceCommentRow,
    UpdateCommentPayload,
} from '../types/sharedPlace.types';
import { getPairFilterArgs } from '../utils/pair.utils';

// ─────────────────────────────────────────────
// Helper: check that a place belongs to the pair
// ─────────────────────────────────────────────

/**
 * Verifies that the given placeId belongs to the current user's pair.
 * Throws if the place does not exist or is not accessible.
 */
async function assertPlaceBelongsToPair(
    placeId: string,
    currentUserId: string,
    partnerId: string
): Promise<void> {
    const { userAId, userBId } = getPairFilterArgs(currentUserId, partnerId);

    const { data, error } = await supabase
        .from('shared_places')
        .select('id')
        .eq('id', placeId)
        .eq('user_a_id', userAId)
        .eq('user_b_id', userBId)
        .maybeSingle();

    if (error) throw new Error(`Could not verify place access: ${error.message}`);
    if (!data) throw new Error('Place not found or access denied.');
}

// ─────────────────────────────────────────────
// Helper: normalize raw Supabase row into PlaceComment
// ─────────────────────────────────────────────

function normalizeComment(row: PlaceCommentRow): PlaceComment {
    return {
        id: row.id,
        place_id: row.place_id,
        user_id: row.user_id,
        comment: row.comment,
        created_at: row.created_at,
        updated_at: row.updated_at,
        author: row.profiles
            ? {
                id: row.profiles.id,
                first_name: row.profiles.first_name,
                last_name: row.profiles.last_name,
            }
            : undefined,
    };
}

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

/**
 * Fetches all comments for a given place.
 * Includes the author's first and last name via a profiles join.
 * Only accessible if the place belongs to the current pair.
 */
export async function getCommentsByPlace(
    placeId: string,
    currentUserId: string,
    partnerId: string
): Promise<PlaceComment[]> {
    // Frontend security guard
    await assertPlaceBelongsToPair(placeId, currentUserId, partnerId);

    const { data, error } = await supabase
        .from('place_comments')
        .select(`
      id,
      place_id,
      user_id,
      comment,
      created_at,
      updated_at,
      profiles:user_id (
        id,
        first_name,
        last_name
      )
    `)
        .eq('place_id', placeId)
        .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch comments: ${error.message}`);

    return (data ?? []).map((row) => normalizeComment(row as unknown as PlaceCommentRow));
}

// ─────────────────────────────────────────────
// CHECK: has user already commented?
// ─────────────────────────────────────────────

/**
 * Returns true if the current user already has a comment on this place.
 * Used to enforce the 1-comment-per-user-per-place rule.
 */
export async function hasUserCommented(
    placeId: string,
    currentUserId: string
): Promise<boolean> {
    const { data, error } = await supabase
        .from('place_comments')
        .select('id')
        .eq('place_id', placeId)
        .eq('user_id', currentUserId)
        .maybeSingle();

    if (error) return false;
    return data !== null;
}

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

/**
 * Creates a new comment on a shared place.
 * Guards:
 *   1. Place must belong to current pair.
 *   2. `user_id` is always set to currentUserId (never trusted from payload).
 *   3. Each user can only post ONE comment per place.
 */
export async function createComment(
    payload: CreateCommentPayload,
    currentUserId: string,
    partnerId: string
): Promise<PlaceComment> {
    // Security guard: confirm the place is part of this pair
    await assertPlaceBelongsToPair(payload.place_id, currentUserId, partnerId);

    // Enforce 1 comment per user per place
    const alreadyCommented = await hasUserCommented(payload.place_id, currentUserId);
    if (alreadyCommented) {
        throw new Error('You have already added a memory note to this place.');
    }

    const { data, error } = await supabase
        .from('place_comments')
        .insert({
            place_id: payload.place_id,
            user_id: currentUserId, // always use server-side auth user id
            comment: payload.comment.trim(),
        })
        .select(`
      id,
      place_id,
      user_id,
      comment,
      created_at,
      updated_at,
      profiles:user_id (
        id,
        first_name,
        last_name
      )
    `)
        .single();

    if (error) throw new Error(`Failed to create comment: ${error.message}`);

    return normalizeComment(data as unknown as PlaceCommentRow);
}

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

/**
 * Updates the text of an existing comment.
 * Only the owner (`user_id`) may update their comment — enforced by RLS
 * and the `.eq('user_id', currentUserId)` guard here.
 */
export async function updateComment(
    commentId: string,
    payload: UpdateCommentPayload,
    currentUserId: string
): Promise<PlaceComment> {
    const { data, error } = await supabase
        .from('place_comments')
        .update({
            comment: payload.comment.trim(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .eq('user_id', currentUserId) // frontend ownership guard
        .select(`
      id,
      place_id,
      user_id,
      comment,
      created_at,
      updated_at,
      profiles:user_id (
        id,
        first_name,
        last_name
      )
    `)
        .single();

    if (error) throw new Error(`Failed to update comment: ${error.message}`);

    return normalizeComment(data as unknown as PlaceCommentRow);
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

/**
 * Deletes a comment. Only the comment owner may delete it.
 */
export async function deleteComment(
    commentId: string,
    currentUserId: string
): Promise<void> {
    const { error } = await supabase
        .from('place_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUserId);

    if (error) throw new Error(`Failed to delete comment: ${error.message}`);
}

// ─────────────────────────────────────────────
// REALTIME (optional subscription)
// ─────────────────────────────────────────────

/**
 * Subscribes to realtime comment events for a given place.
 * Returns an unsubscribe function to call on cleanup.
 *
 * Usage:
 *   const unsubscribe = subscribeToPlaceComments(placeId, onInsert, onDelete);
 *   return () => unsubscribe();
 */
export function subscribeToPlaceComments(
    placeId: string,
    onInsert: (comment: PlaceCommentRow) => void,
    onDelete?: (commentId: string) => void
): () => void {
    const channel = supabase
        .channel(`place_comments:${placeId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'place_comments',
                filter: `place_id=eq.${placeId}`,
            },
            (payload) => {
                onInsert(payload.new as PlaceCommentRow);
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'DELETE',
                schema: 'public',
                table: 'place_comments',
                filter: `place_id=eq.${placeId}`,
            },
            (payload) => {
                if (onDelete) {
                    onDelete((payload.old as PlaceCommentRow).id);
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}
