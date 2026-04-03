/**
 * Memories Timeline — Type Definitions
 *
 * Mirrors the Supabase schema for memories, memory_comments,
 * and memory_likes, providing strict compile-time safety.
 */

// ─────────────────────────────────────────────
// Author profile (lightweight shape used in joins)
// ─────────────────────────────────────────────
export type AuthorProfile = {
    id: string;
    first_name: string;
    last_name: string;
};

// ─────────────────────────────────────────────
// Memory Like (matches the `memory_likes` table)
// ─────────────────────────────────────────────
export type MemoryLike = {
    id: string;
    memory_id: string;
    user_id: string;
    created_at: string;
};

// ─────────────────────────────────────────────
// Memory Comment (matches the `memory_comments` table)
// with an optional embedded author profile
// ─────────────────────────────────────────────
export type MemoryComment = {
    id: string;
    memory_id: string;
    user_id: string;
    comment: string;
    created_at: string;
    updated_at: string;
    /** Populated via join when fetching; not stored in DB column */
    author?: AuthorProfile;
};

// ─────────────────────────────────────────────
// Memory (matches the `memories` table)
// ─────────────────────────────────────────────
export type Memory = {
    id: string;
    created_by: string;
    user_a_id: string;
    user_b_id: string;
    title: string;
    description: string | null;
    photo_url: string | null;
    memory_date: string; // ISO date string "YYYY-MM-DD"
    created_at: string;
    updated_at: string;

    // Client-side derived fields (computed after fetch)
    comments: MemoryComment[];
    likes: MemoryLike[];
    isLikedByCurrentUser: boolean;
    likeCount: number;
    commentCount: number;
    /** Author profile – populated from the profiles join */
    creator_profile?: AuthorProfile;
};

// ─────────────────────────────────────────────
// Payloads for creating records
// ─────────────────────────────────────────────
export type CreateMemoryPayload = {
    title: string;
    description?: string;
    memory_date: string; // "YYYY-MM-DD"
    /** Local file URI — will be uploaded to Supabase Storage */
    photoUri: string;
};

export type UpdateMemoryPayload = {
    memoryId: string;
    title?: string;
    description?: string;
    memory_date?: string; // "YYYY-MM-DD"
    /** If provided, a new local file URI to upload and replace the old photo */
    photoUri?: string;
};

export type CreateCommentPayload = {
    memory_id: string;
    comment: string;
};

// ─────────────────────────────────────────────
// Raw Supabase row shapes (for type assertions)
// ─────────────────────────────────────────────

/** Raw memory_comments row returned by Supabase with profiles join */
export type MemoryCommentRow = {
    id: string;
    memory_id: string;
    user_id: string;
    comment: string;
    created_at: string;
    updated_at: string;
    profiles: AuthorProfile | null;
};

/** Raw memories row returned by Supabase with nested relations */
export type MemoryRow = {
    id: string;
    created_by: string;
    user_a_id: string;
    user_b_id: string;
    title: string;
    description: string | null;
    photo_url: string | null;
    memory_date: string;
    created_at: string;
    updated_at: string;
    memory_comments: MemoryCommentRow[];
    memory_likes: MemoryLike[];
    profiles: AuthorProfile | null; // creator profile join
};

// ─────────────────────────────────────────────
// Async state helpers (reused pattern from sharedMap)
// ─────────────────────────────────────────────
export type AsyncState<T> = {
    data: T | null;
    loading: boolean;
    error: string | null;
};

export type MutationState = {
    loading: boolean;
    error: string | null;
};
