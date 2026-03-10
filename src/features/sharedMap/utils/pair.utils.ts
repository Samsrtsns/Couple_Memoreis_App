/**
 * Pair Utilities
 *
 * All pair/ownership logic lives here. This keeps query and access-control
 * logic consistent across service calls.
 *
 * NOTE: Supabase RLS is the authoritative security layer.
 * These helpers are an additional frontend guard — never rely on them alone.
 */

import type { PairUsers, PlaceComment, SharedPlace } from '../types/sharedPlace.types';

// ─────────────────────────────────────────────
// UUID normalization helpers
// ─────────────────────────────────────────────

/**
 * Normalizes two user IDs into a consistent {userAId, userBId} pair.
 * Always stores the lexicographically smaller UUID as userAId.
 * This ensures pair queries are deterministic regardless of order.
 */
export function getPairUserIds(currentUserId: string, partnerId: string): PairUsers {
    const [userAId, userBId] =
        currentUserId < partnerId
            ? [currentUserId, partnerId]
            : [partnerId, currentUserId];

    return {
        userAId,
        userBId,
        currentUserId,
        partnerId,
    };
}

// ─────────────────────────────────────────────
// Access check helpers
// ─────────────────────────────────────────────

/**
 * Returns true if the given place belongs to the current user's pair.
 * Checks both orientations of the pair (A/B or B/A).
 */
export function isUserPartOfPair(
    place: Pick<SharedPlace, 'user_a_id' | 'user_b_id'>,
    currentUserId: string,
    partnerId: string
): boolean {
    const { userAId, userBId } = getPairUserIds(currentUserId, partnerId);
    return place.user_a_id === userAId && place.user_b_id === userBId;
}

/**
 * Alias for isUserPartOfPair — used when checking whether a user
 * is allowed to read a given place.
 */
export function canAccessPlace(
    place: Pick<SharedPlace, 'user_a_id' | 'user_b_id'>,
    currentUserId: string,
    partnerId: string
): boolean {
    return isUserPartOfPair(place, currentUserId, partnerId);
}

/**
 * Returns true if the current user created the given place
 * and is therefore allowed to delete or edit it.
 */
export function canDeletePlace(
    place: Pick<SharedPlace, 'created_by'>,
    currentUserId: string
): boolean {
    return place.created_by === currentUserId;
}

/**
 * Returns true if the current user owns the comment and can edit or delete it.
 */
export function canEditComment(
    comment: Pick<PlaceComment, 'user_id'>,
    currentUserId: string
): boolean {
    return comment.user_id === currentUserId;
}

// Alias for semantic clarity
export const canDeleteComment = canEditComment;

// ─────────────────────────────────────────────
// Pair filter for Supabase queries
// ─────────────────────────────────────────────

/**
 * Returns a Supabase-compatible pair filter object.
 * Use these as arguments to .eq() / .or() calls in the service layer.
 *
 * Example usage:
 *   const { userAId, userBId } = getPairFilterArgs(currentUserId, partnerId);
 *   .eq('user_a_id', userAId).eq('user_b_id', userBId)
 */
export function getPairFilterArgs(currentUserId: string, partnerId: string) {
    const { userAId, userBId } = getPairUserIds(currentUserId, partnerId);
    return { userAId, userBId };
}
