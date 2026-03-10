/**
 * Pair Utilities — Memories Feature
 *
 * Replicates the pair normalization logic from sharedMap
 * for the memories domain. Keeps user_a_id / user_b_id deterministic.
 */

// ─────────────────────────────────────────────
// UUID normalization
// ─────────────────────────────────────────────

/**
 * Normalizes two user IDs into a deterministic {userAId, userBId} pair.
 * Always stores the lexicographically smaller UUID as userAId.
 */
export function getPairUserIds(
    currentUserId: string,
    partnerId: string
): { userAId: string; userBId: string } {
    const [userAId, userBId] =
        currentUserId < partnerId
            ? [currentUserId, partnerId]
            : [partnerId, currentUserId];
    return { userAId, userBId };
}
