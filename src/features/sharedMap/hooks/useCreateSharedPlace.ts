/**
 * useCreateSharedPlace — creates a new shared place for the current pair.
 *
 * Exposes a mutate function, loading/error state, and reset helper.
 * On success, calls the optional `onSuccess` callback so the parent
 * can refetch or add the place to local state.
 */

import { useAuth } from '@/src/context/AuthContext';
import { useCallback, useState } from 'react';
import { addSharedPlace } from '../services/sharedPlacesService';
import type { CreateSharedPlacePayload, SharedPlace } from '../types/sharedPlace.types';

export type UseCreateSharedPlaceReturn = {
    create: (payload: CreateSharedPlacePayload) => Promise<SharedPlace | null>;
    loading: boolean;
    error: string | null;
    reset: () => void;
};

export function useCreateSharedPlace(
    onSuccess?: (place: SharedPlace) => void
): UseCreateSharedPlaceReturn {
    const { state } = useAuth();
    const { profile, partner } = state;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reset = useCallback(() => {
        setError(null);
        setLoading(false);
    }, []);

    const create = useCallback(
        async (payload: CreateSharedPlacePayload): Promise<SharedPlace | null> => {
            if (!profile?.id || !partner?.id) {
                setError('You must be matched with a partner to add places.');
                return null;
            }

            setLoading(true);
            setError(null);
            try {
                const place = await addSharedPlace({
                    title: payload.title,
                    description: payload.description,
                    latitude: payload.latitude,
                    longitude: payload.longitude,
                    address: payload.address,
                    imageUri: payload.imageUri,
                    currentUserId: profile.id,
                    partnerId: partner.id,
                    visitedAt: payload.visited_at,
                });
                onSuccess?.(place);
                return place;
            } catch (e: any) {
                setError(e.message ?? 'Failed to create place.');
                return null;
            } finally {
                setLoading(false);
            }
        },
        [profile?.id, partner?.id, onSuccess]
    );

    return { create, loading, error, reset };
}
