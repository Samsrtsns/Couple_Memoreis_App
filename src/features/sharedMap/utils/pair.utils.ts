/**
 * Eşleşme Yardımcı Fonksiyonları (Pair Utilities)
 *
 * Tüm eşleşme ve sahiplik (ownership) mantığı burada bulunur. Bu sayede servis
 * seviyesindeki sorgu ve erişim kontrolü mantığı tutarlı tutulur.
 *
 * NOT: Yetkilendirme katmanı olarak Supabase RLS (Row Level Security) esas alınır.
 * Bu yardımcılar sadece ön uç tarafında ek bir koruma ve kontrol sağlar.
 */

import type { PairUsers, PlaceComment, SharedPlace } from '../types/sharedPlace.types';

// ─────────────────────────────────────────────
// UUID Normalizasyon Yardımcıları
// ─────────────────────────────────────────────

/**
 * İki kullanıcı ID'sini tutarlı bir {userAId, userBId} çiftine dönüştürür.
 * Her zaman alfabetik (lexicographical) olarak küçük olan UUID'yi userAId olarak saklar.
 * Bu, sorguların sıradan bağımsız olarak her zaman aynı sonucu döndürmesini sağlar.
 */
export function getPairUserIds(currentUserId: string, partnerId: string): PairUsers {
    const [userAId, userBId] =
        currentUserId < partnerId
            ? [currentUserId, partnerId]
            : [partnerId, currentUserId];

    return {
        userAId,
        userBId,
        currentUserId,
        partnerId,
    };
}

// ─────────────────────────────────────────────
// Erişim Kontrolü Yardımcıları
// ─────────────────────────────────────────────

/**
 * Belirtilen yerin mevcut kullanıcı çiftine ait olup olmadığını kontrol eder.
 */
export function isUserPartOfPair(
    place: Pick<SharedPlace, 'user_a_id' | 'user_b_id'>,
    currentUserId: string,
    partnerId: string
): boolean {
    const { userAId, userBId } = getPairUserIds(currentUserId, partnerId);
    return place.user_a_id === userAId && place.user_b_id === userBId;
}

/**
 * Kullanıcının belirtilen yere erişim yetkisi (okuma) olup olmadığını kontrol eder.
 */
export function canAccessPlace(
    place: Pick<SharedPlace, 'user_a_id' | 'user_b_id'>,
    currentUserId: string,
    partnerId: string
): boolean {
    return isUserPartOfPair(place, currentUserId, partnerId);
}

/**
 * Mevcut kullanıcının belirtilen yeri oluşturup oluşturmadığını (yani silme/düzenleme 
 * yetkisi olup olmadığını) kontrol eder.
 */
export function canDeletePlace(
    place: Pick<SharedPlace, 'created_by'>,
    currentUserId: string
): boolean {
    return place.created_by === currentUserId;
}

/**
 * Kullanıcının kendi yorumu üzerinde düzenleme veya silme yetkisi olup olmadığını kontrol eder.
 */
export function canEditComment(
    comment: Pick<PlaceComment, 'user_id'>,
    currentUserId: string
): boolean {
    return comment.user_id === currentUserId;
}

// Anlamsal netlik için alias
export const canDeleteComment = canEditComment;

// ─────────────────────────────────────────────
// Supabase Sorguları için Çift Filtresi
// ─────────────────────────────────────────────

/**
 * Supabase sorguları ile uyumlu filtre nesnesi döndürür.
 * Servis katmanındaki .eq() / .or() çağrılarında parametre olarak kullanılır.
 */
export function getPairFilterArgs(currentUserId: string, partnerId: string) {
    const { userAId, userBId } = getPairUserIds(currentUserId, partnerId);
    return { userAId, userBId };
}
