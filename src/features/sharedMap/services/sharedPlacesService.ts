/**
 * Shared Places Service
 *
 * All Supabase operations for the `shared_places` table.
 * Every query enforces pair membership to ensure users can only
 * access places that belong to their matched pair.
 *
 * Security note:
 * - Frontend guards verify pair membership before making requests.
 * - Supabase RLS policies are the authoritative backend enforcement.
 *   Even if this service is bypassed, the RLS policies must reject
 *   unauthorized reads/writes at the database level.
 */

import { supabase } from '@/src/lib/supabase';
import type {
    CreateSharedPlacePayload,
    SharedPlace,
    UpdateSharedPlacePayload,
} from '../types/sharedPlace.types';
import { getPairFilterArgs } from '../utils/pair.utils';

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

/**
 * Fetches all shared places that belong to the given user pair.
 * Results are ordered by visited_at descending, then created_at descending.
 */
export async function getSharedPlacesForPair(
    currentUserId: string,
    partnerId: string
): Promise<SharedPlace[]> {
    const { userAId, userBId } = getPairFilterArgs(currentUserId, partnerId);

    const { data, error } = await supabase
        .from('shared_places')
        .select('*')
        .eq('user_a_id', userAId)
        .eq('user_b_id', userBId)
        .order('visited_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch shared places: ${error.message}`);

    return (data ?? []) as SharedPlace[];
}

/**
 * Fetches a single shared place by ID.
 * Also verifies that it belongs to the current pair as a frontend guard.
 * (Supabase RLS is the real enforcement.)
 */
export async function getSharedPlaceById(
    placeId: string,
    currentUserId: string,
    partnerId: string
): Promise<SharedPlace> {
    const { userAId, userBId } = getPairFilterArgs(currentUserId, partnerId);

    const { data, error } = await supabase
        .from('shared_places')
        .select('*')
        .eq('id', placeId)
        .eq('user_a_id', userAId)
        .eq('user_b_id', userBId)
        .single();

    if (error) throw new Error(`Place not found or access denied: ${error.message}`);

    return data as SharedPlace;
}

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

/**
 * Creates a new shared place for the current pair.
 * Automatically assigns:
 *   - `created_by` = currentUserId
 *   - `user_a_id` / `user_b_id` normalized by UUID sort order
 */
export async function createSharedPlace(
    payload: CreateSharedPlacePayload,
    currentUserId: string,
    partnerId: string
): Promise<SharedPlace> {
    const { userAId, userBId } = getPairFilterArgs(currentUserId, partnerId);

    const insert = {
        created_by: currentUserId,
        user_a_id: userAId,
        user_b_id: userBId,
        title: payload.title.trim(),
        description: payload.description?.trim() ?? null,
        latitude: payload.latitude,
        longitude: payload.longitude,
        address: payload.address?.trim() ?? null,
        google_place_id: payload.google_place_id ?? null,
        visited_at: payload.visited_at ?? null,
        photo_url: payload.photo_url ?? null,
    };

    const { data, error } = await supabase
        .from('shared_places')
        .insert(insert)
        .select()
        .single();

    if (error) throw new Error(`Failed to create shared place: ${error.message}`);

    return data as SharedPlace;
}

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

/**
 * Updates an existing shared place.
 * Only the creator (`created_by`) may edit a place — enforced by RLS
 * and verified here as an additional frontend guard.
 */
export async function updateSharedPlace(
    placeId: string,
    payload: UpdateSharedPlacePayload,
    currentUserId: string
): Promise<SharedPlace> {
    const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };

    if (payload.title !== undefined) updates.title = payload.title.trim();
    if (payload.description !== undefined) updates.description = payload.description?.trim() ?? null;
    if (payload.address !== undefined) updates.address = payload.address?.trim() ?? null;
    if (payload.visited_at !== undefined) updates.visited_at = payload.visited_at ?? null;
    if (payload.photo_url !== undefined) updates.photo_url = payload.photo_url ?? null;

    const { data, error } = await supabase
        .from('shared_places')
        .update(updates)
        .eq('id', placeId)
        .eq('created_by', currentUserId) // frontend guard: only creator can update
        .select()
        .single();

    if (error) throw new Error(`Failed to update shared place: ${error.message}`);

    return data as SharedPlace;
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

/**
 * Deletes a shared place. Only the `created_by` user may delete it.
 * Both frontend + RLS enforce this.
 */
export async function deleteSharedPlace(
    placeId: string,
    currentUserId: string
): Promise<void> {
    const { error } = await supabase
        .from('shared_places')
        .delete()
        .eq('id', placeId)
        .eq('created_by', currentUserId);

    if (error) throw new Error(`Failed to delete shared place: ${error.message}`);
}

// ─────────────────────────────────────────────
// REALTIME (optional subscription)
// ─────────────────────────────────────────────

/**
 * Subscribes to realtime inserts on shared_places for the current pair.
 * Call the returned unsubscribe function in useEffect cleanup.
 *
 * NOTE: Supabase realtime requires RLS to be set up for the table
 * and the channel to be correctly scoped.
 *
 * Usage:
 *   const unsubscribe = subscribeToSharedPlaces(userId, partnerId, (place) => {
 *     setPlaces(prev => [place, ...prev]);
 *   });
 *   return () => unsubscribe();
 */
export function subscribeToSharedPlaces(
    currentUserId: string,
    partnerId: string,
    onInsert: (place: SharedPlace) => void,
    onDelete?: (placeId: string) => void
): () => void {
    const { userAId, userBId } = getPairFilterArgs(currentUserId, partnerId);

    const channel = supabase
        .channel(`shared_places:${userAId}:${userBId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'shared_places',
                filter: `user_a_id=eq.${userAId}`,
            },
            (payload) => {
                const place = payload.new as SharedPlace;
                // Extra guard: confirm user_b_id matches
                if (place.user_b_id === userBId) {
                    onInsert(place);
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'DELETE',
                schema: 'public',
                table: 'shared_places',
                filter: `user_a_id=eq.${userAId}`,
            },
            (payload) => {
                if (onDelete) {
                    onDelete((payload.old as SharedPlace).id);
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}
