/**
 * Shared Places Map — Type Definitions
 *
 * These types mirror the Supabase schema and provide strict
 * compile-time safety across the entire sharedMap feature.
 */

// ─────────────────────────────────────────────
// Profile (matches the `profiles` Supabase table)
// ─────────────────────────────────────────────
export type Profile = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    match_code: string | null;
    partner_id: string | null;
    matched_at: string | null;
    birth_date: string | null;
    relationship_start_date: string | null;
};

// ─────────────────────────────────────────────
// Shared Place (matches the `shared_places` Supabase table)
// ─────────────────────────────────────────────
export type SharedPlace = {
    id: string;
    created_by: string;
    user_a_id: string;
    user_b_id: string;
    title: string;
    description: string | null;
    latitude: number;
    longitude: number;
    address: string | null;
    google_place_id: string | null;
    visited_at: string | null;       // ISO 8601 timestamp
    photo_url: string | null;
    created_at: string;
    updated_at: string;
};

// ─────────────────────────────────────────────
// Place Comment (matches the `place_comments` Supabase table)
// with an optional embedded author profile for display purposes
// ─────────────────────────────────────────────
export type PlaceComment = {
    id: string;
    place_id: string;
    user_id: string;
    comment: string;
    created_at: string;
    updated_at: string;
    // Populated via join when fetching; not stored in DB column
    author?: Pick<Profile, 'id' | 'first_name' | 'last_name'>;
};

// ─────────────────────────────────────────────
// Payloads for creating records
// ─────────────────────────────────────────────
export type CreateSharedPlacePayload = {
    title: string;
    description?: string;
    latitude: number;
    longitude: number;
    address?: string;
    google_place_id?: string;
    visited_at?: string;
    photo_url?: string;
};

export type CreateCommentPayload = {
    place_id: string;
    comment: string;
};

export type UpdateSharedPlacePayload = Partial<
    Pick<SharedPlace, 'title' | 'description' | 'address' | 'visited_at' | 'photo_url'>
>;

export type UpdateCommentPayload = {
    comment: string;
};

// ─────────────────────────────────────────────
// Pair helper type
// ─────────────────────────────────────────────
export type PairUsers = {
    /** The smaller UUID (used as user_a_id) */
    userAId: string;
    /** The larger UUID (used as user_b_id) */
    userBId: string;
    /** The current user's UUID */
    currentUserId: string;
    /** The partner's UUID */
    partnerId: string;
};

// ─────────────────────────────────────────────
// Map region type (matches react-native-maps Region)
// ─────────────────────────────────────────────
export type MapRegion = {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
};

// ─────────────────────────────────────────────
// Marker data (derived from SharedPlace for map rendering)
// ─────────────────────────────────────────────
export type PlaceMarkerData = {
    id: string;
    title: string;
    coordinate: {
        latitude: number;
        longitude: number;
    };
};

// ─────────────────────────────────────────────
// Supabase response mapping helpers
// ─────────────────────────────────────────────

/**
 * Raw row returned by Supabase when fetching shared places.
 * This matches the actual column names from Supabase.
 */
export type SharedPlaceRow = SharedPlace;

/**
 * Raw row returned by Supabase when fetching comments.
 * Author is embedded via Supabase foreign key join syntax.
 */
export type PlaceCommentRow = {
    id: string;
    place_id: string;
    user_id: string;
    comment: string;
    created_at: string;
    updated_at: string;
    profiles: Pick<Profile, 'id' | 'first_name' | 'last_name'> | null;
};

// ─────────────────────────────────────────────
// State types used in hooks
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
