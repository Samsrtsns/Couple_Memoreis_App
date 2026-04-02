/**
 * usePlaceComments — fetches comments for a given place.
 *
 * Realtime:
 * - INSERT: re-fetches to get the full profile join (author name)
 * - DELETE: removes comment from list immediately (no refetch)
 *
 * The subscription is cleaned up and recreated whenever placeId changes.
 */

import { useAuth } from '@/src/context/AuthContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    getCommentsByPlace,
    subscribeToPlaceComments,
} from '../services/placeCommentsService';
import type { PlaceComment, PlaceCommentRow } from '../types/sharedPlace.types';

export type UsePlaceCommentsReturn = {
    comments: PlaceComment[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    removeCommentOptimistically: (commentId: string) => void;
};

export function usePlaceComments(placeId: string | null): UsePlaceCommentsReturn {
    const { state } = useAuth();
    const { profile, partner } = state;

    const [comments, setComments] = useState<PlaceComment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentUserId = profile?.id ?? null;
    const partnerId = partner?.id ?? null;

    // Keep a stable ref to fetch so the realtime handler can call it
    // without causing the subscription useEffect to re-run
    const fetchRef = useRef<() => Promise<void>>(async () => { });

    const fetch = useCallback(async () => {
        if (!placeId || !currentUserId || !partnerId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getCommentsByPlace(placeId, currentUserId, partnerId);
            setComments(data);
        } catch (e: any) {
            setError(e.message ?? 'Failed to load comments.');
        } finally {
            setLoading(false);
        }
    }, [placeId, currentUserId, partnerId]);

    // Keep fetchRef up to date
    useEffect(() => {
        fetchRef.current = fetch;
    }, [fetch]);

    // Initial fetch when placeId / partners change
    useEffect(() => {
        if (placeId && currentUserId && partnerId) {
            fetch();
        } else {
            setComments([]);
            setError(null);
        }
    }, [placeId, currentUserId, partnerId, fetch]);

    // Realtime subscription — recreate when placeId changes
    const unsubRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!placeId) return;

        // Tear down previous subscription
        unsubRef.current?.();

        unsubRef.current = subscribeToPlaceComments(
            placeId,
            // INSERT: re-fetch to get the profiles join (author first_name / last_name)
            (_newRow: PlaceCommentRow) => {
                fetchRef.current();
            },
            // DELETE: remove immediately without refetch
            (deletedId: string) => {
                setComments((prev) => prev.filter((c) => c.id !== deletedId));
            }
        );

        return () => {
            unsubRef.current?.();
            unsubRef.current = null;
        };
    }, [placeId]); // Only placeId — fetchRef is a stable ref

    const removeCommentOptimistically = useCallback((commentId: string) => {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
    }, []);

    return { comments, loading, error, refetch: fetch, removeCommentOptimistically };
}
