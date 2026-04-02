import { supabase } from '@/src/lib/supabase';
import type { SharedPlace } from '../types/sharedPlace.types';

/**
 * fetchSharedPlaces(currentUserId)
 * returns rows where user_a_id = currentUserId OR user_b_id = currentUserId
 */
export async function fetchSharedPlaces(currentUserId: string): Promise<SharedPlace[]> {
    const { data, error } = await supabase
        .from('shared_places')
        .select('*')
        .or(`user_a_id.eq.${currentUserId},user_b_id.eq.${currentUserId}`)
        .order('visited_at', { ascending: false });

    if (error) {
        console.error('Error fetching shared places:', error);
        throw error;
    }

    return (data || []) as SharedPlace[];
}

/**
 * addSharedPlace({ title, description, latitude, longitude, address, photoUrl, currentUserId, partnerId })
 * insert into shared_places with:
 * created_by = currentUserId
 * user_a_id = currentUserId
 * user_b_id = partnerId
 * visited_at = custom date or now()
 */
export async function addSharedPlace(params: {
    title: string;
    description?: string;
    latitude: number;
    longitude: number;
    address?: string;
    photoUrl?: string;
    currentUserId: string;
    partnerId: string;
    visitedAt?: string;
}): Promise<SharedPlace> {
    const {
        title,
        description,
        latitude,
        longitude,
        address,
        photoUrl,
        currentUserId,
        partnerId,
        visitedAt
    } = params;

    const { data, error } = await supabase
        .from('shared_places')
        .insert({
            created_by: currentUserId,
            user_a_id: currentUserId,
            user_b_id: partnerId,
            title,
            description,
            latitude,
            longitude,
            address,
            photo_url: photoUrl,
            visited_at: visitedAt || new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding shared place:', error);
        throw error;
    }

    return data as SharedPlace;
}

/**
 * subscribeToSharedPlaces(currentUserId, callback)
 */
export function subscribeToSharedPlaces(
    currentUserId: string,
    callback: (payload: any) => void
) {
    return supabase
        .channel('shared_places_live')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'shared_places'
            },
            (payload) => {
                const record = (payload.new || payload.old) as Partial<SharedPlace>;
                if (record && (record.user_a_id === currentUserId || record.user_b_id === currentUserId)) {
                    callback(payload);
                }
            }
        )
        .subscribe();
}

/**
 * Delete a shared place.
 */
export async function deleteSharedPlace(placeId: string, currentUserId: string): Promise<void> {
    const { error } = await supabase
        .from('shared_places')
        .delete()
        .eq('id', placeId)
        .eq('created_by', currentUserId);

    if (error) throw error;
}
