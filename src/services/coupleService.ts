import { supabase } from '@/src/lib/supabase';
import { getPairUserIds } from '@/src/features/memories/utils/pair.utils';

const MEMORIES_PUBLIC_MARKER = '/object/public/memories/';
const SHARED_PLACES_PUBLIC_MARKER = '/object/public/shared-places/';
const STORAGE_REMOVE_CHUNK = 80;

function pathFromPublicUrl(url: string | null | undefined, marker: string): string | null {
    if (!url || typeof url !== 'string') return null;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.substring(idx + marker.length);
}

function collectPhotoPaths(
    rows: { photo_url: string | null }[] | null,
    marker: string,
): string[] {
    const out = new Set<string>();
    for (const row of rows ?? []) {
        const p = pathFromPublicUrl(row.photo_url, marker);
        if (p) out.add(p);
    }
    return [...out];
}

async function removeStoragePaths(bucket: string, paths: string[]): Promise<void> {
    for (let i = 0; i < paths.length; i += STORAGE_REMOVE_CHUNK) {
        const slice = paths.slice(i, i + STORAGE_REMOVE_CHUNK);
        const { error } = await supabase.storage.from(bucket).remove(slice);
        if (error) {
            console.warn(`[unlinkCouple] storage.remove ${bucket}:`, error.message);
        }
    }
}

/**
 * Çift bağlantısını kaldırır: ortak verileri siler, her iki kullanıcıya yeni match_code atar.
 * Supabase’te `unlink_couple` RPC (migration 10+) profil tarihlerini NULL’lar, özel günleri ve
 * anı / yer satırlarını siler. Depodaki çift fotoğrafları da (best-effort) temizler.
 */
export async function unlinkCouple(): Promise<void> {
    const {
        data: { user },
        error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
        throw new Error('Oturum bulunamadı.');
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', user.id)
        .maybeSingle();

    if (profileError) {
        throw new Error(profileError.message);
    }

    const partnerId = profile?.partner_id;
    if (!partnerId) {
        throw new Error('Partner bağlantısı yok.');
    }

    const { userAId, userBId } = getPairUserIds(user.id, partnerId);

    const [memoriesRes, placesRes] = await Promise.all([
        supabase.from('memories').select('photo_url').eq('user_a_id', userAId).eq('user_b_id', userBId),
        supabase
            .from('shared_places')
            .select('photo_url')
            .eq('user_a_id', userAId)
            .eq('user_b_id', userBId),
    ]);

    if (memoriesRes.error) {
        throw new Error(memoriesRes.error.message);
    }
    if (placesRes.error) {
        throw new Error(placesRes.error.message);
    }

    const memoryPaths = collectPhotoPaths(memoriesRes.data, MEMORIES_PUBLIC_MARKER);
    const placePaths = collectPhotoPaths(placesRes.data, SHARED_PLACES_PUBLIC_MARKER);

    const { error } = await supabase.rpc('unlink_couple');

    if (error) {
        throw new Error(error.message || 'Bağlantı kaldırılamadı.');
    }

    await Promise.all([
        removeStoragePaths('memories', memoryPaths),
        removeStoragePaths('shared-places', placePaths),
    ]);
}
