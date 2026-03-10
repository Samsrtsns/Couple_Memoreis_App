import { decode } from 'base64-arraybuffer';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

// Types
export interface UploadResult {
    publicUrl: string;
    path: string;
}

const BUCKET_NAME = 'profile-photos';

/**
 * Prompts the user to pick an image from the device's media library.
 */
export async function pickImage(): Promise<string | null> {
    // Request permission first
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== 'granted') {
        throw new Error('Permission to access camera roll is required!');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Enforce square aspect ratio early on
        quality: 1, // Start with high quality, we will compress later
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
    }

    return null;
}

/**
 * Compresses and resizes the given image URI.
 */
export async function compressImage(uri: string): Promise<ImageManipulator.ImageResult> {
    const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 512 } }], // Resize to maxWidth: 512
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true } // Compress and convert to JPEG
    );

    return manipResult;
}

/**
 * Uploads a compressed image to Supabase Storage.
 */
export async function uploadProfilePhoto(userId: string, imageResult: ImageManipulator.ImageResult): Promise<UploadResult> {
    if (!imageResult.base64) {
        throw new Error('Base64 data is missing from the image result');
    }

    const path = `${userId}/avatar-${Date.now()}.jpg`; // Add timestamp to avoid caching issues

    // Upload base64 representation using base64-arraybuffer to convert into buffer correctly
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, decode(imageResult.base64), {
            contentType: 'image/jpeg',
            upsert: true, // Upsert in case we reuse a strict path without timestamp
        });

    if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(uploadData.path);

    return {
        publicUrl: publicData.publicUrl,
        path: uploadData.path,
    };
}

/**
 * Central function to handle the entire photo update process:
 * 1. Upload new photo
 * 2. Delete old photo from storage (if exists)
 * 3. Update database profile record
 */
export async function updateProfileAvatar(
    userId: string,
    imageResult: ImageManipulator.ImageResult,
    oldAvatarPath?: string | null
): Promise<UploadResult> {
    // 1. Upload the new photo
    const uploadResult = await uploadProfilePhoto(userId, imageResult);

    // 2. Delete the old photo if it exists to save space (and if it's not the exact same path)
    if (oldAvatarPath && oldAvatarPath !== uploadResult.path) {
        await deleteFileFromStorage(oldAvatarPath);
    }

    // 3. Update the database record with the new URL and path
    const { error: dbError } = await supabase
        .from('profiles')
        .update({
            avatar_url: uploadResult.publicUrl,
            avatar_path: uploadResult.path,
        })
        .eq('id', userId);

    if (dbError) {
        // If DB update fails, we might want to clean up the newly uploaded file to avoid orphans
        await deleteFileFromStorage(uploadResult.path);
        throw new Error(`Failed to update user profile: ${dbError.message}`);
    }

    return uploadResult;
}

/**
 * Removes the profile photo entirely: storage + DB
 */
export async function deleteProfilePhoto(userId: string, currentAvatarPath: string): Promise<void> {
    // 1. Delete from storage
    await deleteFileFromStorage(currentAvatarPath);

    // 2. Clear from DB
    const { error: dbError } = await supabase
        .from('profiles')
        .update({
            avatar_url: null,
            avatar_path: null,
        })
        .eq('id', userId);

    if (dbError) {
        throw new Error(`Failed to clear avatar from profile: ${dbError.message}`);
    }
}

/**
 * Helper to delete a file from the bucket
 */
async function deleteFileFromStorage(path: string): Promise<void> {
    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);

    if (error) {
        console.warn(`Failed to delete old avatar at ${path}:`, error.message);
        // We log a warning instead of throwing because failing to delete an old artifact shouldn't break the user flow directly, 
        // though it could lead to orphaned files over time.
    }
}
