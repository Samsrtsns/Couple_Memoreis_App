import { supabase } from '../lib/supabase';
import { getDailyResetStart } from '../utils/photoLimitUtils';

/**
 * Kullanicinin gunluk foto sayacini arttirir.
 * Eger yeni gun periyodundaysa sayaci 1'e resetler.
 * Degilse mevcut degeri +1 yapar.
 */
export async function incrementDailyPhotoCount(userId: string): Promise<void> {
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('daily_photo_count, last_photo_reset')
        .eq('id', userId)
        .single();

    if (fetchError) {
        console.error('[photoLimitService] Profil okunamadi:', fetchError.message);
        return;
    }

    const lastReset = profile?.last_photo_reset ? new Date(profile.last_photo_reset) : null;
    const resetStart = getDailyResetStart();
    const needsReset = !lastReset || lastReset < resetStart;

    const newCount = needsReset ? 1 : (profile?.daily_photo_count ?? 0) + 1;

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            daily_photo_count: newCount,
            last_photo_reset: new Date().toISOString(),
        })
        .eq('id', userId);

    if (updateError) {
        console.error('[photoLimitService] Sayac guncellenemedi:', updateError.message);
    }
}
