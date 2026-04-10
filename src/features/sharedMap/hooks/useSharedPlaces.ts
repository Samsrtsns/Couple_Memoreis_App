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
        imageUri?: string;
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
    const { state, refreshProfile } = useAuth();
    const { profile, partner, isLoggedIn } = state;

    const [places, setPlaces] = useState<SharedPlace[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const currentUserId = profile?.id;
    const partnerId = partner?.id;
    const noPartner = isLoggedIn && !!profile?.id && !partner?.id;
    const isGuest = state.isGuest;

    const loadPlaces = useCallback(async (silent = false) => {
        if (isGuest || !currentUserId) {
            setPlaces([]);
            setError(null);
            if (!silent) setLoading(false);
            return;
        }
        if (!silent) setLoading(true);
        setError(null);
        try {
            const data = await fetchSharedPlaces(currentUserId);
            setPlaces(data);
        } catch (e: any) {
            setError(e.message || 'Failed to load shared places.');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [currentUserId, isGuest]);

    // Guest mode: skip everything and set loading to false
    useEffect(() => {
        if (isGuest) {
            setLoading(false);
            setPlaces([]);
            setError(null);
        }
    }, [isGuest]);

    useEffect(() => {
        if (isGuest || !currentUserId) return;

        loadPlaces();

        const channel = subscribeToSharedPlaces(currentUserId, (payload) => {
            setPlaces(prev => {
                const { eventType, new: newRecord, old: oldRecord } = payload;
                if (eventType === 'INSERT') {
                    // Prevent duplicate if optimistic UI already added it
                    if (prev.some(p => p.id === newRecord.id)) return prev;
                    return [newRecord as SharedPlace, ...prev];
                }
                if (eventType === 'DELETE') {
                    return prev.filter(p => p.id !== oldRecord.id);
                }
                if (eventType === 'UPDATE') {
                    return prev.map(p => p.id === newRecord.id ? (newRecord as SharedPlace) : p);
                }
                return prev;
            });
        });

        // "cleanup subscription on unmount"
        return () => {
            channel.unsubscribe();
        };
    }, [currentUserId, loadPlaces]);

    /** Partner yokken (unlink sonrası) liste sunucudan yeniden çekilir; silinen kayıtlar böyle anında boşalır */
    useEffect(() => {
        if (!currentUserId) return;
        if (partner?.id) return;
        loadPlaces(true);
    }, [currentUserId, partner?.id, loadPlaces]);

    const handleAddPlace = async (params: {
        title: string;
        description?: string;
        latitude: number;
        longitude: number;
        address?: string;
        imageUri?: string;
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
            // Update state immediately for instant feedback
            setPlaces(prev => prev.some(p => p.id === newPlace.id) ? prev : [newPlace, ...prev]);

            if (params.imageUri) {
                // DB trigger'i daily_photo_count'i dusurur; profile'i hemen tazele
                refreshProfile().catch(() => {});
            }

            return newPlace;
        } catch (e: any) {
            const errorMessage = e.message || 'Failed to add place.';
            if (errorMessage.includes('DAILY_PHOTO_LIMIT_REACHED')) {
                throw new Error('PLACE_LIMIT_REACHED');
            }
            if (errorMessage.includes('PLACE_TOTAL_LIMIT_REACHED')) {
                throw new Error('PLACE_TOTAL_LIMIT_REACHED');
            }
            setError(errorMessage);
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
