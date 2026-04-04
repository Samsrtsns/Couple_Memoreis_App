/**
 * Memories Timeline — Type Definitions
 *
 * Mirrors the Supabase schema for memories,
 * providing strict compile-time safety.
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

    /** Author profile – populated from the profiles join */
    creator_profile?: AuthorProfile;
};

// ─────────────────────────────────────────────
// Payloads for creating/updating records
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

// ─────────────────────────────────────────────
// Raw Supabase row shapes (for type assertions)
// ─────────────────────────────────────────────

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
    profiles: AuthorProfile | null; // creator profile join
};

// ─────────────────────────────────────────────
// Async state helpers
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
