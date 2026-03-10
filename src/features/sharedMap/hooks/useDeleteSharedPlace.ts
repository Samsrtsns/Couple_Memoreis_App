/**
 * useDeleteSharedPlace — deletes a shared place if the current user is the creator.
 */

import { useAuth } from '@/src/context/AuthContext';
import { useCallback, useState } from 'react';
import { deleteSharedPlace } from '../services/sharedPlacesService';

export type UseDeleteSharedPlaceReturn = {
    remove: (placeId: string) => Promise<boolean>;
    loading: boolean;
    error: string | null;
    reset: () => void;
};

export function useDeleteSharedPlace(
    onSuccess?: (placeId: string) => void
): UseDeleteSharedPlaceReturn {
    const { state } = useAuth();
    const currentUserId = state.profile?.id;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reset = useCallback(() => {
        setError(null);
        setLoading(false);
    }, []);

    const remove = useCallback(
        async (placeId: string): Promise<boolean> => {
            if (!currentUserId) {
                setError('Not authenticated.');
                return false;
            }
            setLoading(true);
            setError(null);
            try {
                await deleteSharedPlace(placeId, currentUserId);
                onSuccess?.(placeId);
                return true;
            } catch (e: any) {
                setError(e.message ?? 'Failed to delete place.');
                return false;
            } finally {
                setLoading(false);
            }
        },
        [currentUserId, onSuccess]
    );

    return { remove, loading, error, reset };
}
