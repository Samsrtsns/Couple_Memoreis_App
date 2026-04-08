import type { ProfileData } from '../hooks/useProfile';

const RESET_HOUR = 5; // 05:00

export function isPremiumUser(profile: ProfileData | null | undefined): boolean {
    return profile?.user_type === 'premium';
}

/**
 * Mevcut gunun (veya dun gece yarisi gecildiyse dunun) 05:00 baslangicini dondurur.
 * Ornek: saat 03:00 ise dunun 05:00'i; saat 07:00 ise bugunun 05:00'i.
 */
export function getDailyResetStart(now: Date = new Date()): Date {
    const resetToday = new Date(now);
    resetToday.setHours(RESET_HOUR, 0, 0, 0);

    if (now < resetToday) {
        resetToday.setDate(resetToday.getDate() - 1);
    }
    return resetToday;
}

/**
 * Bir sonraki 05:00 zamanini dondurur.
 */
export function getNextPhotoResetTime(now: Date = new Date()): Date {
    const next = new Date(now);
    next.setHours(RESET_HOUR, 0, 0, 0);

    if (now >= next) {
        next.setDate(next.getDate() + 1);
    }
    return next;
}

/**
 * Kullanicinin bugun foto yukleme hakki olup olmadigini dondurur.
 * Premium kullanicilar her zaman true alir.
 */
export function hasDailyPhotoUploadRight(profile: ProfileData | null | undefined): boolean {
    if (!profile) return false;
    if (isPremiumUser(profile)) return true;

    // DB: kalan gunluk hak (base icin yukleme oncesi 1, sonra 0)
    const remaining = profile.daily_photo_count ?? 0;
    const lastReset = profile.last_photo_reset ? new Date(profile.last_photo_reset) : null;
    const resetStart = getDailyResetStart();

    // Ilk foto oncesi last_photo_reset yok; veya yeni gun periyodu (DB reset ile uyumlu)
    if (!lastReset || lastReset < resetStart) return true;

    return remaining > 0;
}

/**
 * Kalan sureyi ms ve formatli text olarak dondurur.
 */
export function getRemainingPhotoCooldown(now: Date = new Date()): {
    remainingMs: number;
    remainingText: string;
} {
    const nextReset = getNextPhotoResetTime(now);
    const diff = Math.max(0, nextReset.getTime() - now.getTime());

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const remainingText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    return { remainingMs: diff, remainingText };
}

/**
 * Foto yukleme kilitli mi? Premium degilse VE gunluk hakki bitmisse true.
 */
export function shouldLockPhotoUpload(profile: ProfileData | null | undefined): boolean {
    if (!profile) return true;
    if (isPremiumUser(profile)) return false;
    return !hasDailyPhotoUploadRight(profile);
}
