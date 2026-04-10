import { supabase } from '@/src/lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
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
 * uploadPlaceImage(uri)
 * Uploads a file from local URI to Supabase Storage bucket 'shared_places'
 * returns the public URL
 */
export async function uploadPlaceImage(uri: string, currentUserId: string): Promise<string> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
        throw new Error('Oturum doğrulanamadı. Lütfen tekrar giriş yapın.');
    }
    if (userData.user.id !== currentUserId) {
        throw new Error('Kullanıcı oturumu eşleşmediği için fotoğraf yüklenemedi.');
    }

    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const ext = (uri.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
    const filePath = `${currentUserId}/${Date.now()}.${ext}`;
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('shared-places')
        .upload(filePath, decode(base64), {
            contentType,
            upsert: false,
        });

    if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Fotoğraf yüklenemedi. Lütfen tekrar deneyin.');
    }

    const { data: publicUrlData } = supabase.storage
        .from('shared-places')
        .getPublicUrl(uploadData.path);

    return publicUrlData.publicUrl;
}

/**
 * addSharedPlace({ title, description, latitude, longitude, address, imageUri, currentUserId, partnerId })
 * Handles image upload first, then inserts DB record. Performs rollback on failure.
 */
export async function addSharedPlace(params: {
    title: string;
    description?: string;
    latitude: number;
    longitude: number;
    address?: string;
    imageUri?: string;
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
        imageUri,
        currentUserId,
        partnerId,
        visitedAt
    } = params;

    let photoUrl: string | undefined = undefined;
    let uploadedPath: string | undefined = undefined;

    // 1. Upload image if provided
    if (imageUri) {
        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData?.user?.id) {
                throw new Error('Oturum doğrulanamadı. Lütfen tekrar giriş yapın.');
            }
            if (userData.user.id !== currentUserId) {
                throw new Error('Kullanıcı oturumu eşleşmediği için fotoğraf yüklenemedi.');
            }

            const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
            const ext = (imageUri.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
            const filePath = `${currentUserId}/${Date.now()}.${ext}`;
            const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('shared-places')
                .upload(filePath, decode(base64), {
                    contentType,
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            uploadedPath = uploadData.path;
            const { data: publicUrlData } = supabase.storage
                .from('shared-places')
                .getPublicUrl(uploadData.path);
            
            photoUrl = publicUrlData.publicUrl;
        } catch (storageErr) {
            console.error('Storage error during addSharedPlace:', storageErr);
            throw new Error('Fotoğraf yüklenemedi. Supabase Storage izinlerini kontrol edin (bucket: shared-places).');
        }
    }

    // 2. Insert into DB
    const { userAId, userBId } = getPairUserIds(currentUserId, partnerId);

    const { data, error: dbError } = await supabase
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

    if (dbError) {
        // Rollback: delete uploaded photo if DB insert fails
        if (uploadedPath) {
            await supabase.storage.from('shared-places').remove([uploadedPath]);
        }
        console.error('DB Error adding shared place:', dbError);
        const rawMessage = dbError.message || '';
        if (
            rawMessage.includes('PLACE_TOTAL_LIMIT_REACHED') ||
            rawMessage.includes('DAILY_PHOTO_LIMIT_REACHED')
        ) {
            throw new Error(rawMessage);
        }
        throw new Error('Yer kaydedilemedi. Lütfen tekrar deneyin.');
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
