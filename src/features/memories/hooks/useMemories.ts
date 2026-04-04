/**
 * useMemories Hook
 *
 * Manages the memories list state, realtime subscriptions,
 * and exposes actions (add memory, toggle like, add comment).
 *
 * This hook is the single source of truth for the MemoriesScreen.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    createMemory,
    deleteMemory as deleteMemoryService,
    fetchMemoriesForCurrentUser,
    getCurrentProfile,
    subscribeToMemories,
    updateMemory as updateMemoryService,
    uploadMemoryPhoto,
    type CreateMemoryArgs,
    type UpdateMemoryArgs,
} from '../services/memoriesService';
import type {
    CreateMemoryPayload,
    Memory,
    MemoryRow,
    UpdateMemoryPayload,
} from '../types/memory.types';
import { getPairUserIds } from '../utils/pair.utils';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Inserts `newMemory` into `list` at the correct position,
 * maintaining memory_date DESC → created_at DESC sort order.
 * This avoids always prepending to the top (which caused scroll gaps
 * when the new photo's date is older than existing ones).
 */
function sortedInsertMemory(list: Memory[], newMemory: Memory): Memory[] {
    // Find the first item that is "older" than the new memory
    const insertIndex = list.findIndex((m) => {
        // Primary: compare by memory_date
        if (m.memory_date < newMemory.memory_date) return true;
        // Secondary: same date → compare by created_at
        if (m.memory_date === newMemory.memory_date && m.created_at < newMemory.created_at) return true;
        return false;
    });

    if (insertIndex === -1) {
        // New memory is the oldest → append at the end
        return [...list, newMemory];
    }
    const result = [...list];
    result.splice(insertIndex, 0, newMemory);
    return result;
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type UseMemoriesResult = {
    memories: Memory[];
    loading: boolean;
    error: string | null;
    currentUserId: string | null;
    partnerId: string | null;
    hasPartner: boolean;
    refresh: () => Promise<void>;
    addMemory: (payload: CreateMemoryPayload) => Promise<void>;
    updateMemory: (payload: UpdateMemoryPayload) => Promise<void>;
    deleteMemory: (memoryId: string) => Promise<void>;
    toggleLike?: (memoryId: string) => Promise<void>;
    addComment?: (payload: any) => Promise<void>;
};

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useMemories(): UseMemoriesResult {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);

    // Stable ref to avoid stale closures in subscriptions
    const currentUserIdRef = useRef<string | null>(null);
    const partnerIdRef = useRef<string | null>(null);

    // IDs that were inserted optimistically — realtime onInsert should skip these
    const pendingOptimisticIds = useRef<Set<string>>(new Set());

    // ─── Initial load ───────────────────────────────────────────
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const profile = await getCurrentProfile();
            setCurrentUserId(profile.id);
            currentUserIdRef.current = profile.id;
            setPartnerId(profile.partner_id);
            partnerIdRef.current = profile.partner_id;

            if (!profile.partner_id) {
                setMemories([]);
                return;
            }

            const data = await fetchMemoriesForCurrentUser(profile.id, profile.partner_id);
            setMemories(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── Refresh (pull-to-refresh) ───────────────────────────────
    const refresh = useCallback(async () => {
        const uid = currentUserIdRef.current;
        const pid = partnerIdRef.current;
        if (!uid || !pid) return;
        try {
            const data = await fetchMemoriesForCurrentUser(uid, pid);
            setMemories(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Refresh failed');
        }
    }, []);

    // ─── Realtime subscriptions ──────────────────────────────────
    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!currentUserId || !partnerId) return;

        const { userAId } = getPairUserIds(currentUserId, partnerId);

        // Subscribe to memories table changes
        const unsubMemories = subscribeToMemories(userAId, {
            onInsert: (newRow: MemoryRow) => {
                const normalised: Memory = {
                    id: newRow.id,
                    created_by: newRow.created_by,
                    user_a_id: newRow.user_a_id,
                    user_b_id: newRow.user_b_id,
                    title: newRow.title,
                    description: newRow.description,
                    photo_url: newRow.photo_url,
                    memory_date: newRow.memory_date,
                    created_at: newRow.created_at,
                    updated_at: newRow.updated_at,
                };
                // If we inserted this optimistically, skip the realtime event
                // (this is more reliable than checking prev[] inside setMemories,
                //  because React can batch the two setMemories calls and give
                //  both the same stale `prev`, causing duplicates)
                if (pendingOptimisticIds.current.has(newRow.id)) {
                    pendingOptimisticIds.current.delete(newRow.id);
                    return;
                }
                setMemories((prev) => {
                    if (prev.some((m) => m.id === normalised.id)) return prev;
                    return sortedInsertMemory(prev, normalised);
                });
            },
            onUpdate: (updatedRow: MemoryRow) => {
                setMemories((prev) => {
                    const updatedArray = prev.map((m) => {
                        if (m.id !== updatedRow.id) return m;
                        return {
                            ...m,
                            title: updatedRow.title ?? m.title,
                            description: updatedRow.description ?? m.description,
                            photo_url: updatedRow.photo_url ?? m.photo_url,
                            memory_date: updatedRow.memory_date ?? m.memory_date,
                            updated_at: updatedRow.updated_at ?? m.updated_at,
                        };
                    });
                    
                    // Re-sort in case the memory_date was changed
                    return updatedArray.sort(
                        (a, b) => new Date(b.memory_date).getTime() - new Date(a.memory_date).getTime()
                    );
                });
            },
            onDelete: (deletedId: string) => {
                setMemories((prev) => prev.filter((m) => m.id !== deletedId));
            },
        });

        return () => {
            unsubMemories();
        };
    }, [currentUserId, partnerId]);

    // ─── Actions ─────────────────────────────────────────────────

    const addMemory = useCallback(
        async (payload: CreateMemoryPayload) => {
            const uid = currentUserIdRef.current;
            const pid = partnerIdRef.current;
            if (!uid || !pid) throw new Error('Not matched with a partner.');

            console.log('[useMemories] Starting addMemory flow for user:', uid);

            try {
                // 1. Upload photo
                console.log('[useMemories] Uploading photo...');
                const photoUrl = await uploadMemoryPhoto(payload.photoUri, uid);
                console.log('[useMemories] Photo uploaded successfully:', photoUrl);

                // 2. Insert memory row
                console.log('[useMemories] Creating memory record in DB...');
                const args: CreateMemoryArgs = {
                    title: payload.title,
                    description: payload.description,
                    memory_date: payload.memory_date,
                    photo_url: photoUrl,
                    currentUserId: uid,
                    partnerId: pid,
                };
                const newMemory = await createMemory(args);
                console.log('[useMemories] Memory created in DB:', newMemory.id);

                // 3. Mark this ID so realtime onInsert skips it, then insert optimistically
                pendingOptimisticIds.current.add(newMemory.id);
                setMemories((prev) => {
                    if (prev.some((m) => m.id === newMemory.id)) return prev;
                    return sortedInsertMemory(prev, newMemory);
                });
            } catch (e: any) {
                console.error('[useMemories] Failed to add memory:', e);
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                throw new Error(`Memory creation failed: ${errorMessage}`);
            }
        },
        []
    );

    const editMemory = useCallback(
        async (payload: UpdateMemoryPayload) => {
            const uid = currentUserIdRef.current;
            if (!uid) throw new Error('Not authenticated.');

            let newPhotoUrl: string | undefined;

            // Upload new photo if provided
            if (payload.photoUri) {
                newPhotoUrl = await uploadMemoryPhoto(payload.photoUri, uid);
            }

            const args: UpdateMemoryArgs = {
                memoryId: payload.memoryId,
                title: payload.title,
                description: payload.description,
                memory_date: payload.memory_date,
                photo_url: newPhotoUrl,
                currentUserId: uid,
            };

            const updated = await updateMemoryService(args);

            // Optimistic update (realtime will also fire)
            setMemories((prev) =>
                prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
            );
        },
        []
    );

    const removeMemory = useCallback(
        async (memoryId: string) => {
            const uid = currentUserIdRef.current;
            if (!uid) throw new Error('Not authenticated.');

            // Optimistic delete
            setMemories((prev) => prev.filter((m) => m.id !== memoryId));

            try {
                await deleteMemoryService(memoryId, uid);
            } catch (e) {
                // Revert on failure
                await refresh();
                throw e;
            }
        },
        [refresh]
    );

    // Handlers removed for toggleLike, addComment

    return {
        memories,
        loading,
        error,
        currentUserId,
        partnerId,
        hasPartner: !!partnerId,
        refresh,
        addMemory,
        updateMemory: editMemory,
        deleteMemory: removeMemory,
    };
}
