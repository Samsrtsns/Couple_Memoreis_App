/**
 * useSharedPlaces — fetches all shared places for the current pair.
 *
 * Realtime: subscribes to INSERT and DELETE events on shared_places.
 * On INSERT: injects the new place directly (no refetch needed).
 * On DELETE: removes the place from state.
 */

import { useAuth } from '@/src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    getSharedPlacesForPair,
    subscribeToSharedPlaces,
} from '../services/sharedPlacesService';
import type { SharedPlace } from '../types/sharedPlace.types';

const PLACES_CACHE_PREFIX = '@cached_places_';

export type UseSharedPlacesReturn = {
    places: SharedPlace[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    /** True if user is authenticated but has no matched partner yet */
    noPartner: boolean;
};

export function useSharedPlaces(): UseSharedPlacesReturn {
    const { state } = useAuth();
    const { profile, partner, isLoggedIn } = state;

    const [places, setPlaces] = useState<SharedPlace[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentUserId = profile?.id ?? null;
    const partnerId = partner?.id ?? null;

    const fetch = useCallback(async () => {
        if (!currentUserId || !partnerId) return;

        const cacheKey = `${PLACES_CACHE_PREFIX}${currentUserId}_${partnerId}`;

        // Try load from cache first for instant UI response
        try {
            const cachedData = await AsyncStorage.getItem(cacheKey);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setPlaces(parsed);
                }
            }
        } catch (e) {
            console.warn('Failed to read places cache:', e);
        }

        // Only show loading if we didn't have any places loaded yet
        if (places.length === 0) {
            setLoading(true);
        }
        setError(null);

        // Fetch from Supabase in the background
        try {
            const data = await getSharedPlacesForPair(currentUserId, partnerId);
            setPlaces(data);

            // Save new data back to cache
            AsyncStorage.setItem(cacheKey, JSON.stringify(data)).catch((e) => {
                console.warn('Failed to write places cache:', e);
            });
        } catch (e: any) {
            setError(e.message ?? 'Failed to load places.');
        } finally {
            setLoading(false);
        }
    }, [currentUserId, partnerId]);

    // Initial load
    useEffect(() => {
        if (isLoggedIn && currentUserId && partnerId) {
            fetch();
        }
    }, [isLoggedIn, currentUserId, partnerId, fetch]);

    // Realtime subscription
    const unsubRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!currentUserId || !partnerId) return;

        // Clean up previous subscription before creating a new one
        unsubRef.current?.();

        unsubRef.current = subscribeToSharedPlaces(
            currentUserId,
            partnerId,
            (newPlace) => {
                // Inject new place, dedup by id
                setPlaces((prev) =>
                    prev.some((p) => p.id === newPlace.id) ? prev : [newPlace, ...prev]
                );
            },
            (deletedId) => {
                setPlaces((prev) => prev.filter((p) => p.id !== deletedId));
            }
        );

        return () => {
            unsubRef.current?.();
            unsubRef.current = null;
        };
    }, [currentUserId, partnerId]);

    return {
        places,
        loading,
        error,
        refetch: fetch,
        noPartner: isLoggedIn && !!currentUserId && !partnerId,
    };
}
