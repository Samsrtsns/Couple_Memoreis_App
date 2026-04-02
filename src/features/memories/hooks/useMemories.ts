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
    addMemoryComment,
    createMemory,
    fetchMemoriesForCurrentUser,
    getCurrentProfile,
    subscribeToMemories,
    subscribeToMemoryComments,
    subscribeToMemoryLikes,
    toggleMemoryLike,
    uploadMemoryPhoto,
    type CreateMemoryArgs,
} from '../services/memoriesService';
import type {
    CreateCommentPayload,
    CreateMemoryPayload,
    Memory,
    MemoryCommentRow,
    MemoryLike,
    MemoryRow,
} from '../types/memory.types';
import { getPairUserIds } from '../utils/pair.utils';

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
    toggleLike: (memoryId: string) => Promise<void>;
    addComment: (payload: CreateCommentPayload) => Promise<void>;
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
                    comments: [],
                    likes: [],
                    isLikedByCurrentUser: false,
                    likeCount: 0,
                    commentCount: 0,
                };
                setMemories((prev) => {
                    // Avoid duplicates (may have already been added optimistically)
                    if (prev.some((m) => m.id === normalised.id)) return prev;
                    return [normalised, ...prev];
                });
            },
            onDelete: (deletedId: string) => {
                setMemories((prev) => prev.filter((m) => m.id !== deletedId));
            },
        });

        // Subscribe to comments changes
        const unsubComments = subscribeToMemoryComments({
            onInsert: (newRow: MemoryCommentRow) => {
                setMemories((prev) =>
                    prev.map((m) => {
                        if (m.id !== newRow.memory_id) return m;
                        // Avoid duplicate comment
                        if (m.comments.some((c) => c.id === newRow.id)) return m;
                        const newComment = {
                            id: newRow.id,
                            memory_id: newRow.memory_id,
                            user_id: newRow.user_id,
                            comment: newRow.comment,
                            created_at: newRow.created_at,
                            updated_at: newRow.updated_at,
                            author: newRow.profiles
                                ? {
                                    id: newRow.profiles.id,
                                    first_name: newRow.profiles.first_name,
                                    last_name: newRow.profiles.last_name,
                                }
                                : undefined,
                        };
                        const updated = [...m.comments, newComment];
                        return { ...m, comments: updated, commentCount: updated.length };
                    })
                );
            },
            onDelete: (deletedId: string) => {
                setMemories((prev) =>
                    prev.map((m) => {
                        const updated = m.comments.filter((c) => c.id !== deletedId);
                        if (updated.length === m.comments.length) return m;
                        return { ...m, comments: updated, commentCount: updated.length };
                    })
                );
            },
        });

        // Subscribe to likes changes
        const unsubLikes = subscribeToMemoryLikes({
            onInsert: (newLike: MemoryLike) => {
                const uid = currentUserIdRef.current;
                setMemories((prev) =>
                    prev.map((m) => {
                        if (m.id !== newLike.memory_id) return m;
                        if (m.likes.some((l) => l.id === newLike.id)) return m;
                        const updated = [...m.likes, newLike];
                        return {
                            ...m,
                            likes: updated,
                            likeCount: updated.length,
                            isLikedByCurrentUser:
                                m.isLikedByCurrentUser || newLike.user_id === uid,
                        };
                    })
                );
            },
            onDelete: (deletedId: string) => {
                const uid = currentUserIdRef.current;
                setMemories((prev) =>
                    prev.map((m) => {
                        const removed = m.likes.find((l) => l.id === deletedId);
                        if (!removed) return m;
                        const updated = m.likes.filter((l) => l.id !== deletedId);
                        return {
                            ...m,
                            likes: updated,
                            likeCount: updated.length,
                            isLikedByCurrentUser:
                                removed.user_id === uid ? false : m.isLikedByCurrentUser,
                        };
                    })
                );
            },
        });

        return () => {
            unsubMemories();
            unsubComments();
            unsubLikes();
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

                // 3. Prepend optimistically (realtime will be deduplicated)
                setMemories((prev) => [newMemory, ...prev]);
            } catch (e: any) {
                console.error('[useMemories] Failed to add memory:', e);
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                throw new Error(`Memory creation failed: ${errorMessage}`);
            }
        },
        []
    );

    const toggleLike = useCallback(async (memoryId: string) => {
        const uid = currentUserIdRef.current;
        if (!uid) return;

        // Optimistic update
        setMemories((prev) =>
            prev.map((m) => {
                if (m.id !== memoryId) return m;
                const isLiked = m.isLikedByCurrentUser;
                return {
                    ...m,
                    isLikedByCurrentUser: !isLiked,
                    likeCount: isLiked ? m.likeCount - 1 : m.likeCount + 1,
                    likes: isLiked
                        ? m.likes.filter((l) => l.user_id !== uid)
                        : [
                            ...m.likes,
                            { id: 'optimistic', memory_id: memoryId, user_id: uid, created_at: new Date().toISOString() },
                        ],
                };
            })
        );

        try {
            await toggleMemoryLike(memoryId, uid);
        } catch {
            // Revert on error — pull fresh data
            await refresh();
        }
    }, [refresh]);

    const addComment = useCallback(
        async (payload: CreateCommentPayload) => {
            const uid = currentUserIdRef.current;
            if (!uid) throw new Error('Not authenticated.');

            const newComment = await addMemoryComment(payload, uid);

            // Optimistic update (realtime will dedup)
            setMemories((prev) =>
                prev.map((m) => {
                    if (m.id !== payload.memory_id) return m;
                    if (m.comments.some((c) => c.id === newComment.id)) return m;
                    const updated = [...m.comments, newComment];
                    return { ...m, comments: updated, commentCount: updated.length };
                })
            );
        },
        []
    );

    return {
        memories,
        loading,
        error,
        currentUserId,
        partnerId,
        hasPartner: !!partnerId,
        refresh,
        addMemory,
        toggleLike,
        addComment,
    };
}
