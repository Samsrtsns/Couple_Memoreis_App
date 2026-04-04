/**
 * Yer Yorumları Servisi (Place Comments Service)
 *
 * `place_comments` tablosu için tüm Supabase işlemleri burada yer alır.
 *
 * Güvenlik Tasarımı:
 * - Yorumları çekmeden veya oluşturmadan önce servis, yerin mevcut kullanıcı çiftine
 *   ait olduğunu doğrular (ön uç koruması).
 * - Supabase RLS (Satır Bazlı Güvenlik) yetkilendirme katmanı olarak ana güvenliği sağlar.
 */

import { supabase } from '@/src/lib/supabase';
import type {
    CreateCommentPayload,
    PlaceComment,
    PlaceCommentRow,
    UpdateCommentPayload,
} from '../types/sharedPlace.types';
import { getPairFilterArgs } from '../utils/pair.utils';

// ─────────────────────────────────────────────
// Yardımcı: Yerin çifte ait olup olmadığını kontrol et
// ─────────────────────────────────────────────

/**
 * Belirtilen placeId'nin mevcut kullanıcı çiftine ait olduğunu doğrular.
 * Yer mevcut değilse veya erişim izni yoksa hata fırlatır.
 */
async function assertPlaceBelongsToPair(
    placeId: string,
    currentUserId: string,
    partnerId: string
): Promise<void> {
    const { data, error } = await supabase
        .from('shared_places')
        .select('id')
        .eq('id', placeId)
        .or(
            `and(user_a_id.eq.${currentUserId},user_b_id.eq.${partnerId}),and(user_a_id.eq.${partnerId},user_b_id.eq.${currentUserId})`
        )
        .maybeSingle();

    if (error) throw new Error(`Yer erişimi doğrulanamadı: ${error.message}`);
    if (!data) throw new Error('Yer bulunamadı veya erişim reddedildi.');
}

// ─────────────────────────────────────────────
// Yardımcı: Ham Supabase satırını PlaceComment nesnesine dönüştür
// ─────────────────────────────────────────────

function normalizeComment(row: PlaceCommentRow): PlaceComment {
    return {
        id: row.id,
        place_id: row.place_id,
        user_id: row.user_id,
        comment: row.comment,
        created_at: row.created_at,
        updated_at: row.updated_at,
        author: row.profiles
            ? {
                id: row.profiles.id,
                first_name: row.profiles.first_name,
                last_name: row.profiles.last_name,
            }
            : undefined,
    };
}

// ─────────────────────────────────────────────
// OKUMA (READ)
// ─────────────────────────────────────────────

/**
 * Belirli bir yer için tüm yorumları getirir.
 * Profiller tablosu üzerinden yazarın ad ve soyad bilgilerini de içerir.
 * Sadece yer mevcut çifte aitse erişilebilir.
 */
export async function getCommentsByPlace(
    placeId: string,
    currentUserId: string,
    partnerId: string
): Promise<PlaceComment[]> {
    // Ön uç güvenlik kontrolü
    await assertPlaceBelongsToPair(placeId, currentUserId, partnerId);

    const { data, error } = await supabase
        .from('place_comments')
        .select(`
      id,
      place_id,
      user_id,
      comment,
      created_at,
      updated_at
    `)
        .eq('place_id', placeId)
        .order('created_at', { ascending: true });

    if (error) throw new Error(`Yorumlar getirilemedi: ${error.message}`);
    const rawComments = data ?? [];

    const userIds = Array.from(new Set(rawComments.map((c: any) => c.user_id).filter(Boolean)));
    const profilesMap: Record<string, { id: string; first_name: string; last_name: string }> = {};

    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', userIds);
        
        if (profiles) {
            profiles.forEach(p => { profilesMap[p.id] = p; });
        }
    }

    return rawComments.map((row: any) => normalizeComment({
        ...row,
        profiles: profilesMap[row.user_id]
    } as unknown as PlaceCommentRow));
}

// ─────────────────────────────────────────────
// KONTROL: Kullanıcı daha önce yorum yaptı mı?
// ─────────────────────────────────────────────

/**
 * Mevcut kullanıcının bu yer için zaten bir yorumu olup olmadığını kontrol eder.
 * Her kullanıcı için "her yer başına tek yorum" kuralını uygulamak için kullanılır.
 */
export async function hasUserCommented(
    placeId: string,
    currentUserId: string
): Promise<boolean> {
    const { data, error } = await supabase
        .from('place_comments')
        .select('id')
        .eq('place_id', placeId)
        .eq('user_id', currentUserId)
        .maybeSingle();

    if (error) return false;
    return data !== null;
}

// ─────────────────────────────────────────────
// OLUŞTURMA (CREATE)
// ─────────────────────────────────────────────

/**
 * Paylaşılan bir yer için yeni bir yorum oluşturur.
 * Korumalar:
 *   1. Yer mevcut çifte ait olmalıdır.
 *   2. `user_id` her zaman currentUserId olarak ayarlanır (payload'a güvenilmez).
 *   3. Her kullanıcı her yer için sadece TEK bir yorum yapabilir.
 */
export async function createComment(
    payload: CreateCommentPayload,
    currentUserId: string,
    partnerId: string
): Promise<PlaceComment> {
    // Güvenlik kontrolü: yerin bu çifte ait olduğunu onayla
    await assertPlaceBelongsToPair(payload.place_id, currentUserId, partnerId);

    // Her kullanıcı başına tek yorum kuralını uygula
    const alreadyCommented = await hasUserCommented(payload.place_id, currentUserId);
    if (alreadyCommented) {
        throw new Error('Bu yer için zaten bir anı notu eklemişsiniz.');
    }

    const { data, error } = await supabase
        .from('place_comments')
        .insert({
            place_id: payload.place_id,
            user_id: currentUserId, // her zaman sunucu tarafındaki yetkili kullanıcı id'sini kullan
            comment: payload.comment.trim(),
        })
        .select(`
      id,
      place_id,
      user_id,
      comment,
      created_at,
      updated_at
    `)
        .single();

    if (error) throw new Error(`Yorum oluşturulamadı: ${error.message}`);

    // Profil bilgilerini manuel olarak çek
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', currentUserId)
        .single();

    return normalizeComment({
        ...(data as any),
        profiles: profile
    } as unknown as PlaceCommentRow);
}

// ─────────────────────────────────────────────
// GÜNCELLEME (UPDATE)
// ─────────────────────────────────────────────

/**
 * Mevcut bir yorumun metnini günceller.
 * Sadece yorum sahibi (`user_id`) yorumunu güncelleyebilir — RLS ve buradaki
 * `.eq('user_id', currentUserId)` kontrolü bunu sağlar.
 */
export async function updateComment(
    commentId: string,
    payload: UpdateCommentPayload,
    currentUserId: string
): Promise<PlaceComment> {
    const { data, error } = await supabase
        .from('place_comments')
        .update({
            comment: payload.comment.trim(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .eq('user_id', currentUserId) // ön uç sahiplik kontrolü
        .select(`
      id,
      place_id,
      user_id,
      comment,
      created_at,
      updated_at
    `)
        .single();

    if (error) throw new Error(`Yorum güncellenemedi: ${error.message}`);

    // Profil bilgilerini manuel olarak çek
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', currentUserId)
        .single();

    return normalizeComment({
        ...(data as any),
        profiles: profile
    } as unknown as PlaceCommentRow);
}

// ─────────────────────────────────────────────
// SİLME (DELETE)
// ─────────────────────────────────────────────

/**
 * Bir yorumu siler. Sadece yorum sahibi silebilir.
 */
export async function deleteComment(
    commentId: string,
    currentAuthUserId: string
): Promise<void> {
    const { error } = await supabase
        .from('place_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentAuthUserId);

    if (error) {
        throw new Error(`Yorum silinemedi: ${error.message}`);
    }
}

// ─────────────────────────────────────────────
// GERÇEK ZAMANLI (REALTIME - isteğe bağlı abonelik)
// ─────────────────────────────────────────────

/**
 * Belirli bir yer için gerçek zamanlı yorum etkinliklerine abone olur.
 * Aboneliği sonlandırmak için bir 'unsubscribe' fonksiyonu döndürür.
 *
 * Kullanım:
 *   const unsubscribe = subscribeToPlaceComments(placeId, onInsert, onDelete);
 *   return () => unsubscribe();
 */
export function subscribeToPlaceComments(
    placeId: string,
    onInsert: (comment: PlaceCommentRow) => void,
    onDelete?: (commentId: string) => void
): () => void {
    const channel = supabase
        .channel(`place_comments:${placeId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'place_comments',
                filter: `place_id=eq.${placeId}`,
            },
            (payload) => {
                onInsert(payload.new as PlaceCommentRow);
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'DELETE',
                schema: 'public',
                table: 'place_comments',
                filter: `place_id=eq.${placeId}`,
            },
            (payload) => {
                if (onDelete) {
                    onDelete((payload.old as PlaceCommentRow).id);
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}
