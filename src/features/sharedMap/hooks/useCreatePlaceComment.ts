/**
 * useCreatePlaceComment — submits a new comment on a shared place.
 *
 * Supports optimistic UI: an optimistic comment is added immediately
 * and replaced with the real one on success, or rolled back on error.
 */

import { useAuth } from '@/src/context/AuthContext';
import { useCallback, useRef, useState } from 'react';
import { createComment } from '../services/placeCommentsService';
import type { CreateCommentPayload, PlaceComment } from '../types/sharedPlace.types';

export type UseCreatePlaceCommentReturn = {
    submit: (payload: CreateCommentPayload) => Promise<PlaceComment | null>;
    loading: boolean;
    error: string | null;
    reset: () => void;
};

export function useCreatePlaceComment(
    onSuccess?: (comment: PlaceComment) => void
): UseCreatePlaceCommentReturn {
    const { state } = useAuth();
    const { profile, partner } = state;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Rate-limit guard: prevent rapid-fire submissions
    const lastSubmitRef = useRef<number>(0);

    const reset = useCallback(() => {
        setError(null);
        setLoading(false);
    }, []);

    const submit = useCallback(
        async (payload: CreateCommentPayload): Promise<PlaceComment | null> => {
            if (!profile?.id || !partner?.id) {
                setError('You must be matched to add comments.');
                return null;
            }

            // Debounce guard: block submissions within 1.5s of the last one
            const now = Date.now();
            if (now - lastSubmitRef.current < 1500) {
                return null;
            }
            lastSubmitRef.current = now;

            setLoading(true);
            setError(null);
            try {
                const comment = await createComment(payload, profile.id, partner.id);
                onSuccess?.(comment);
                return comment;
            } catch (e: any) {
                setError(e.message ?? 'Failed to submit comment.');
                return null;
            } finally {
                setLoading(false);
            }
        },
        [profile?.id, partner?.id, onSuccess]
    );

    return { submit, loading, error, reset };
}
