/**
 * Memories Service
 *
 * All Supabase operations for the memories feature.
 * DB logic is fully isolated from UI components.
 *
 * Tables used:
 *   - memories
 *   - memory_comments
 *   - memory_likes
 *   - profiles
 *
 * Storage bucket: `memories`
 */

import { supabase } from '@/src/lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import type {
    CreateCommentPayload,
    Memory,
    MemoryComment,
    MemoryCommentRow,
    MemoryLike,
    MemoryRow,
} from '../types/memory.types';
import { getPairUserIds } from '../utils/pair.utils';

// ─────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────

export type ProfileResult = {
    id: string;
    first_name: string;
    last_name: string;
    partner_id: string | null;
};

/**
 * Gets the current authenticated user's profile from Supabase.
 * Throws if there is no active session or no profile row.
 */
export async function getCurrentProfile(): Promise<ProfileResult> {
    const {
        data: { user },
        error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) throw new Error('No active session.');

    const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, partner_id')
        .eq('id', user.id)
        .single();

    if (error || !data) throw new Error('Could not load profile.');
    return data as ProfileResult;
}

// ─────────────────────────────────────────────
// Normalize helpers
// ─────────────────────────────────────────────

function normalizeComment(row: MemoryCommentRow): MemoryComment {
    return {
        id: row.id,
        memory_id: row.memory_id,
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

function normalizeMemory(row: MemoryRow, currentUserId: string): Memory {
    const likes: MemoryLike[] = (row.memory_likes ?? []) as MemoryLike[];
    const comments: MemoryComment[] = (row.memory_comments ?? []).map((c) =>
        normalizeComment(c as unknown as MemoryCommentRow)
    );

    return {
        id: row.id,
        created_by: row.created_by,
        user_a_id: row.user_a_id,
        user_b_id: row.user_b_id,
        title: row.title,
        description: row.description,
        photo_url: row.photo_url,
        memory_date: row.memory_date,
        created_at: row.created_at,
        updated_at: row.updated_at,
        comments,
        likes,
        isLikedByCurrentUser: likes.some((l) => l.user_id === currentUserId),
        likeCount: likes.length,
        commentCount: comments.length,
        creator_profile: row.profiles ?? undefined,
    };
}

// ─────────────────────────────────────────────
// FETCH
// ─────────────────────────────────────────────

/**
 * Fetches all memories for the current couple, sorted by memory_date DESC.
 * Includes nested comments (with author profile) and likes.
 */
export async function fetchMemoriesForCurrentUser(
    currentUserId: string,
    partnerId: string
): Promise<Memory[]> {
    const { userAId, userBId } = getPairUserIds(currentUserId, partnerId);

    const { data, error } = await supabase
        .from('memories')
        .select(`
            id,
            created_by,
            user_a_id,
            user_b_id,
            title,
            description,
            photo_url,
            memory_date,
            created_at,
            updated_at,
            memory_comments (
                id,
                memory_id,
                user_id,
                comment,
                created_at,
                updated_at
            ),
            memory_likes (
                id,
                memory_id,
                user_id,
                created_at
            )
        `)
        .eq('user_a_id', userAId)
        .eq('user_b_id', userBId)
        .order('memory_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch memories: ${error.message}`);
    const rawMemories = data ?? [];

    // Collect all unique user IDs to fetch their profiles
    const userIdsToFetch = new Set<string>();
    rawMemories.forEach((m: any) => {
        if (m.created_by) userIdsToFetch.add(m.created_by);
        if (m.memory_comments) {
            m.memory_comments.forEach((c: any) => {
                if (c.user_id) userIdsToFetch.add(c.user_id);
            });
        }
    });

    const profilesMap: Record<string, { id: string; first_name: string; last_name: string }> = {};

    if (userIdsToFetch.size > 0) {
        const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', Array.from(userIdsToFetch));

        if (profilesData) {
            profilesData.forEach(p => {
                profilesMap[p.id] = p;
            });
        }
    }

    // Attach profiles before normalizing
    const enrichedMemories = rawMemories.map((m: any) => {
        return {
            ...m,
            profiles: profilesMap[m.created_by],
            memory_comments: m.memory_comments?.map((c: any) => ({
                ...c,
                profiles: profilesMap[c.user_id]
            }))
        };
    });

    return enrichedMemories.map((row) =>
        normalizeMemory(row as unknown as MemoryRow, currentUserId)
    );
}

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

export type CreateMemoryArgs = {
    title: string;
    description?: string;
    memory_date: string;
    photo_url: string;
    currentUserId: string;
    partnerId: string;
};

/**
 * Inserts a new memory row into the database.
 * `user_a_id` and `user_b_id` are derived deterministically from the pair.
 */
export async function createMemory({
    title,
    description,
    memory_date,
    photo_url,
    currentUserId,
    partnerId,
}: CreateMemoryArgs): Promise<Memory> {
    console.log('[createMemory] Starting with args:', { title, memory_date, photo_url, currentUserId, partnerId });
    const { userAId, userBId } = getPairUserIds(currentUserId, partnerId);

    const { data, error } = await supabase
        .from('memories')
        .insert({
            created_by: currentUserId,
            user_a_id: userAId,
            user_b_id: userBId,
            title: title.trim(),
            description: description?.trim() ?? null,
            photo_url,
            memory_date,
        })
        .select(`
            id,
            created_by,
            user_a_id,
            user_b_id,
            title,
            description,
            photo_url,
            memory_date,
            created_at,
            updated_at
        `)
        .single();

    console.log('[createMemory] Supabase query result:', { data, error });

    if (error) throw new Error(`Failed to create memory: ${error.message}`);

    // Fetch the creator's profile since we can't join it automatically
    const { data: profileData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', currentUserId)
        .single();
    
    const memoryWithProfile = {
        ...(data as any),
        profiles: profileData
    };

    return normalizeMemory(
        { ...memoryWithProfile, memory_comments: [], memory_likes: [] } as unknown as MemoryRow,
        currentUserId
    );
}

// ─────────────────────────────────────────────
// PHOTO UPLOAD
// ─────────────────────────────────────────────

/**
 * Uploads a local photo URI to Supabase Storage bucket `memories`.
 * Returns the public URL of the uploaded file.
 *
 * Storage path: memories/{userId}/{timestamp}.jpg
 */
export async function uploadMemoryPhoto(
    localUri: string,
    currentUserId: string
): Promise<string> {
    // Read the file as base64 instead of blob (fixes 0 bytes upload issue in React Native)
    const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: 'base64',
    });
    console.log('[uploadMemoryPhoto] Read file as base64, length:', base64.length);

    const timestamp = Date.now();
    const path = `${currentUserId}/${timestamp}.jpg`;

    // Decode base64 to ArrayBuffer for Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(path, decode(base64), {
            contentType: 'image/jpeg',
            upsert: false,
        });

    console.log('[uploadMemoryPhoto] Upload result:', { path, uploadError });

    if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage
        .from('memories')
        .getPublicUrl(path);

    if (!urlData?.publicUrl) throw new Error('Could not get public URL for uploaded photo.');
    console.log('[uploadMemoryPhoto] Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
}

/**
 * Extracts the storage path from a Supabase public URL.
 * e.g. ".../memories/userId/12345.jpg" → "userId/12345.jpg"
 */
function extractStoragePath(publicUrl: string): string | null {
    try {
        const marker = '/object/public/memories/';
        const idx = publicUrl.indexOf(marker);
        if (idx === -1) return null;
        return publicUrl.substring(idx + marker.length);
    } catch {
        return null;
    }
}

/**
 * Deletes a photo from the `memories` storage bucket (best-effort).
 */
async function deletePhotoFromStorage(publicUrl: string): Promise<void> {
    const path = extractStoragePath(publicUrl);
    if (!path) return;
    const { error } = await supabase.storage.from('memories').remove([path]);
    if (error) console.warn('[deletePhotoFromStorage] Failed:', error.message);
}

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

export type UpdateMemoryArgs = {
    memoryId: string;
    title?: string;
    description?: string;
    memory_date?: string;
    photo_url?: string;
    currentUserId: string;
};

/**
 * Updates a memory row in the database.
 * Only the creator of the memory can update it.
 * If `photo_url` changes, the old photo is optionally deleted from storage.
 */
export async function updateMemory({
    memoryId,
    title,
    description,
    memory_date,
    photo_url,
    currentUserId,
}: UpdateMemoryArgs): Promise<Memory> {
    // Build partial update object (only include changed fields)
    const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim() || null;
    if (memory_date !== undefined) updates.memory_date = memory_date;
    if (photo_url !== undefined) updates.photo_url = photo_url;

    // Fetch old photo_url before updating (for cleanup)
    let oldPhotoUrl: string | null = null;
    if (photo_url !== undefined) {
        const { data: oldRow } = await supabase
            .from('memories')
            .select('photo_url')
            .eq('id', memoryId)
            .single();
        oldPhotoUrl = oldRow?.photo_url ?? null;
    }

    const { data, error } = await supabase
        .from('memories')
        .update(updates)
        .eq('id', memoryId)
        .eq('created_by', currentUserId) // Auth guard: only creator can update
        .select(`
            id, created_by, user_a_id, user_b_id,
            title, description, photo_url, memory_date,
            created_at, updated_at,
            memory_comments (
                id, memory_id, user_id, comment, created_at, updated_at
            ),
            memory_likes (
                id, memory_id, user_id, created_at
            )
        `)
        .single();

    if (error) throw new Error(`Failed to update memory: ${error.message}`);

    // Delete old photo from storage if it changed
    if (oldPhotoUrl && photo_url && oldPhotoUrl !== photo_url) {
        deletePhotoFromStorage(oldPhotoUrl).catch(() => {});
    }

    // Fetch creator profile
    const { data: profileData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', currentUserId)
        .single();

    const enriched = { ...(data as any), profiles: profileData };
    return normalizeMemory(enriched as unknown as MemoryRow, currentUserId);
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

/**
 * Deletes a memory row and optionally removes its photo from storage.
 * Only the creator of the memory can delete it.
 */
export async function deleteMemory(
    memoryId: string,
    currentUserId: string
): Promise<void> {
    // Fetch photo_url for cleanup before deleting
    const { data: memRow } = await supabase
        .from('memories')
        .select('photo_url')
        .eq('id', memoryId)
        .single();

    const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', memoryId)
        .eq('created_by', currentUserId); // Auth guard: only creator can delete

    if (error) throw new Error(`Failed to delete memory: ${error.message}`);

    // Clean up photo from storage (best-effort)
    if (memRow?.photo_url) {
        deletePhotoFromStorage(memRow.photo_url).catch(() => {});
    }
}

// ─────────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────────

/**
 * Adds a new comment to a memory.
 */
export async function addMemoryComment(
    payload: CreateCommentPayload,
    currentUserId: string
): Promise<MemoryComment> {
    const { data, error } = await supabase
        .from('memory_comments')
        .insert({
            memory_id: payload.memory_id,
            user_id: currentUserId,
            comment: payload.comment.trim(),
        })
        .select(`
            id,
            memory_id,
            user_id,
            comment,
            created_at,
            updated_at
        `)
        .single();

    if (error) throw new Error(`Failed to add comment: ${error.message}`);

    // Fetch profile manually
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', currentUserId)
        .single();
    
    const enrichedComment = {
        ...(data as any),
        profiles: profile
    };

    return normalizeComment(enrichedComment as unknown as MemoryCommentRow);
}

/**
 * Deletes a comment. Only the comment owner can delete.
 */
export async function deleteMemoryComment(
    commentId: string,
    currentUserId: string
): Promise<void> {
    const { error } = await supabase
        .from('memory_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUserId);

    if (error) throw new Error(`Failed to delete comment: ${error.message}`);
}

// ─────────────────────────────────────────────
// LIKES
// ─────────────────────────────────────────────

/**
 * Toggles a like on a memory.
 * If the current user already liked it → deletes the like.
 * If not → inserts a like.
 * Returns true if liked, false if unliked.
 */
export async function toggleMemoryLike(
    memoryId: string,
    currentUserId: string
): Promise<boolean> {
    // Check for existing like
    const { data: existing, error: checkError } = await supabase
        .from('memory_likes')
        .select('id')
        .eq('memory_id', memoryId)
        .eq('user_id', currentUserId)
        .maybeSingle();

    if (checkError) throw new Error(`Failed to check like status: ${checkError.message}`);

    if (existing) {
        // Unlike
        const { error } = await supabase
            .from('memory_likes')
            .delete()
            .eq('id', existing.id);
        if (error) throw new Error(`Failed to unlike: ${error.message}`);
        return false;
    } else {
        // Like
        const { error } = await supabase
            .from('memory_likes')
            .insert({ memory_id: memoryId, user_id: currentUserId });
        if (error) throw new Error(`Failed to like: ${error.message}`);
        return true;
    }
}

// ─────────────────────────────────────────────
// REALTIME SUBSCRIPTIONS
// ─────────────────────────────────────────────

type RealtimeMemoryCallbacks = {
    onInsert?: (row: MemoryRow) => void;
    onUpdate?: (row: MemoryRow) => void;
    onDelete?: (id: string) => void;
};

/**
 * Subscribes to realtime events on the `memories` table.
 * Filters by the couple's pair (user_a_id).
 * Returns an unsubscribe function.
 */
export function subscribeToMemories(
    userAId: string,
    callbacks: RealtimeMemoryCallbacks
): () => void {
    const uid = Math.random().toString(36).slice(2, 8);
    const channel = supabase
        .channel(`memories:pair:${userAId}:${uid}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'memories', filter: `user_a_id=eq.${userAId}` },
            (payload) => callbacks.onInsert?.(payload.new as MemoryRow)
        )
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'memories', filter: `user_a_id=eq.${userAId}` },
            (payload) => callbacks.onUpdate?.(payload.new as MemoryRow)
        )
        .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'memories', filter: `user_a_id=eq.${userAId}` },
            (payload) => callbacks.onDelete?.((payload.old as { id: string }).id)
        )
        .subscribe();

    return () => { supabase.removeChannel(channel); };
}

type RealtimeCommentCallbacks = {
    onInsert?: (row: MemoryCommentRow) => void;
    onDelete?: (id: string) => void;
};

/**
 * Subscribes to realtime events on `memory_comments`.
 * Returns an unsubscribe function.
 */
export function subscribeToMemoryComments(
    callbacks: RealtimeCommentCallbacks
): () => void {
    const uid = Math.random().toString(36).slice(2, 8);
    const channel = supabase
        .channel(`memory_comments:all:${uid}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'memory_comments' },
            (payload) => callbacks.onInsert?.(payload.new as MemoryCommentRow)
        )
        .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'memory_comments' },
            (payload) => callbacks.onDelete?.((payload.old as { id: string }).id)
        )
        .subscribe();

    return () => { supabase.removeChannel(channel); };
}

type RealtimeLikeCallbacks = {
    onInsert?: (row: MemoryLike) => void;
    onDelete?: (id: string) => void;
};

/**
 * Subscribes to realtime events on `memory_likes`.
 * Returns an unsubscribe function.
 */
export function subscribeToMemoryLikes(
    callbacks: RealtimeLikeCallbacks
): () => void {
    const uid = Math.random().toString(36).slice(2, 8);
    const channel = supabase
        .channel(`memory_likes:all:${uid}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'memory_likes' },
            (payload) => callbacks.onInsert?.(payload.new as MemoryLike)
        )
        .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'memory_likes' },
            (payload) => callbacks.onDelete?.((payload.old as { id: string }).id)
        )
        .subscribe();

    return () => { supabase.removeChannel(channel); };
}
