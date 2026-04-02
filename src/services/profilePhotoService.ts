import { decode } from 'base64-arraybuffer';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

// Tipler
export interface UploadResult {
    publicUrl: string;
    path: string;
}

const BUCKET_NAME = 'profile-photos';

/**
 * Kullanıcıdan cihazın medya kütüphanesinden bir resim seçmesini ister.
 */
export async function pickImage(): Promise<string | null> {
    // Önce izin iste
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== 'granted') {
        throw new Error('Permission to access camera roll is required!');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Kare en boy oranını erkenden zorunlu kıl
        quality: 1, // Yüksek kalite ile başla, daha sonra sıkıştıracağız
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
    }

    return null;
}

/**
 * Verilen resim URI'sini sıkıştırır ve yeniden boyutlandırır.
 */
export async function compressImage(uri: string): Promise<ImageManipulator.ImageResult> {
    const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 512 } }], // Maksimum genişlik: 512 olacak şekilde yeniden boyutlandır
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true } // Sıkıştır ve JPEG formatına dönüştür
    );

    return manipResult;
}

/**
 * Sıkıştırılmış bir resmi Supabase Storage'a yükler.
 */
export async function uploadProfilePhoto(userId: string, imageResult: ImageManipulator.ImageResult): Promise<UploadResult> {
    if (!imageResult.base64) {
        throw new Error('Base64 data is missing from the image result');
    }

    const path = `${userId}/avatar-${Date.now()}.jpg`; // Önbelleğe alma sorunlarını önlemek için zaman damgası ekle

    // Buffer'a doğru şekilde dönüştürmek için base64-arraybuffer kullanarak base64 temsilini yükle
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, decode(imageResult.base64), {
            contentType: 'image/jpeg',
            upsert: true, // Zaman damgası olmayan katı bir yolu yeniden kullanmamız durumunda üzerine yaz (upsert)
        });

    if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Herkese açık URL'yi al
    const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(uploadData.path);

    return {
        publicUrl: publicData.publicUrl,
        path: uploadData.path,
    };
}

/**
 * Tüm fotoğraf güncelleme sürecini yöneten merkezi fonksiyon:
 * 1. Yeni fotoğrafı yükler
 * 2. Varsa eski fotoğrafı depolama alanından siler
 * 3. Veritabanındaki profil kaydını günceller
 */
export async function updateProfileAvatar(
    userId: string,
    imageResult: ImageManipulator.ImageResult,
    oldAvatarPath?: string | null
): Promise<UploadResult> {
    // 1. Yeni fotoğrafı yükle
    const uploadResult = await uploadProfilePhoto(userId, imageResult);

    // 2. Alan kazanmak için varsa eski fotoğrafı sil (ve tam olarak aynı yol değilse)
    if (oldAvatarPath && oldAvatarPath !== uploadResult.path) {
        await deleteFileFromStorage(oldAvatarPath);
    }

    // 3. Veritabanı kaydını yeni URL ve yol ile güncelle
    const { error: dbError } = await supabase
        .from('profiles')
        .update({
            avatar_url: uploadResult.publicUrl,
            avatar_path: uploadResult.path,
        })
        .eq('id', userId);

    if (dbError) {
        // Veritabanı güncellemesi başarısız olursa, yetim dosyalar oluşmaması için yeni yüklenen dosyayı temizlemek isteyebiliriz
        await deleteFileFromStorage(uploadResult.path);
        throw new Error(`Failed to update user profile: ${dbError.message}`);
    }

    return uploadResult;
}

/**
 * Profil fotoğrafını tamamen kaldırır: depolama + veritabanı
 */
export async function deleteProfilePhoto(userId: string, currentAvatarPath: string): Promise<void> {
    // 1. Depolama alanından sil
    await deleteFileFromStorage(currentAvatarPath);

    // 2. Veritabanından temizle
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
 * Bucket'tan dosya silmek için yardımcı fonksiyon
 */
async function deleteFileFromStorage(path: string): Promise<void> {
    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);

    if (error) {
        console.warn(`Failed to delete old avatar at ${path}:`, error.message);
        // Hata fırlatmak yerine uyarı günlüğü (log) tutuyoruz çünkü eski bir dosyayı silmedeki başarısızlık kullanıcı akışını doğrudan bozmamalı, 
        // ancak zamanla yetim dosyalara yol açabilir.
    }
}
