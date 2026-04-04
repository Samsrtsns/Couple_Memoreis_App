import { supabase } from '@/src/lib/supabase';
import type { SharedPlace } from '../types/sharedPlace.types';
import { getPairUserIds } from '../utils/pair.utils';

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

    const { userAId, userBId } = getPairUserIds(currentUserId, partnerId);

    const { data, error } = await supabase
        .from('shared_places')
        .insert({
            created_by: currentUserId,
            user_a_id: userAId,
            user_b_id: userBId,
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
    const uid = Math.random().toString(36).slice(2, 8);
    const channel = supabase
        .channel(`shared_places_live:${uid}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'shared_places'
            },
            (payload) => {
                // Determine if this event is relevant to CurrentUser natively over Javascript
                const record = (payload.new || payload.old) as Partial<SharedPlace>;
                
                // For INSERT, user_a_id will exist.
                if (record && record.user_a_id) {
                    if (record.user_a_id === currentUserId || record.user_b_id === currentUserId) {
                        callback(payload);
                    }
                } else {
                    // For UPDATE/DELETE without full replica identity, let it pass so local state can filter by ID
                    callback(payload);
                }
            }
        )
        .subscribe((status) => {
            console.log('SharedPlaces Realtime status:', status);
        });
        
    return channel;
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
