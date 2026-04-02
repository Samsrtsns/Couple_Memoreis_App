import { useAuth } from '@/src/context/AuthContext';
import { useCallback, useEffect, useState } from 'react';
import {
    addSharedPlace,
    fetchSharedPlaces,
    subscribeToSharedPlaces,
} from '../services/sharedPlacesService';
import type { SharedPlace } from '../types/sharedPlace.types';

export type UseSharedPlacesReturn = {
    places: SharedPlace[];
    loading: boolean;
    error: string | null;
    noPartner: boolean;
    addPlace: (params: {
        title: string;
        description?: string;
        latitude: number;
        longitude: number;
        address?: string;
        photoUrl?: string;
        visitedAt?: string;
    }) => Promise<SharedPlace>;
    refetch: () => Promise<void>;
};

/**
 * useSharedPlaces hook
 * load places on mount
 * subscribe realtime updates
 * auto refresh list after change
 * cleanup subscription on unmount
 */
export function useSharedPlaces(): UseSharedPlacesReturn {
    const { state } = useAuth();
    const { profile, partner, isLoggedIn } = state;

    const [places, setPlaces] = useState<SharedPlace[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const currentUserId = profile?.id;
    const partnerId = partner?.id;
    const noPartner = isLoggedIn && !!profile?.id && !partner?.id;

    const loadPlaces = useCallback(async () => {
        if (!currentUserId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchSharedPlaces(currentUserId);
            setPlaces(data);
        } catch (e: any) {
            setError(e.message || 'Failed to load shared places.');
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    useEffect(() => {
        if (!currentUserId) return;

        loadPlaces();

        const channel = subscribeToSharedPlaces(currentUserId, (payload) => {
            // "auto refresh list after change"
            // INSERT, UPDATE, DELETE all trigger a reload
            loadPlaces();
        });

        // "cleanup subscription on unmount"
        return () => {
            channel.unsubscribe();
        };
    }, [currentUserId, loadPlaces]);

    const handleAddPlace = async (params: {
        title: string;
        description?: string;
        latitude: number;
        longitude: number;
        address?: string;
        photoUrl?: string;
        visitedAt?: string;
    }) => {
        if (!currentUserId || !partnerId) {
            throw new Error('You must be matched with a partner to add shared locations.');
        }

        try {
            const newPlace = await addSharedPlace({
                ...params,
                currentUserId,
                partnerId,
            });
            // State will be updated by the realtime subscription auto-refresh,
            // but we return the newPlace for immediate UI use if needed.
            return newPlace;
        } catch (e: any) {
            setError(e.message || 'Failed to add place.');
            throw e;
        }
    };

    return {
        places,
        loading,
        error,
        noPartner,
        addPlace: handleAddPlace,
        refetch: loadPlaces,
    };
}
