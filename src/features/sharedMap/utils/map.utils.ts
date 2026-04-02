/**
 * Harita Yardımcı Fonksiyonları (Map Utilities)
 *
 * Harita bölgelerini (region) hesaplama, işaretçilere (marker) göre haritayı sığdırma,
 * koordinat doğrulama ve SharedPlace verilerini işaretçi nesnelerine dönüştürme
 * gibi yardımcı fonksiyonları içerir.
 */

import type { MapRegion, PlaceMarkerData, SharedPlace } from '../types/sharedPlace.types';

// ─────────────────────────────────────────────
// Sabitler
// ─────────────────────────────────────────────

/** İstanbul merkez noktası — nihai yedek bölge olarak kullanılır */
export const DEFAULT_MAP_REGION: MapRegion = {
    latitude: 41.015,
    longitude: 28.975,
    latitudeDelta: 0.12,
    longitudeDelta: 0.06,
};

/** Haritayı birden fazla işaretçiye sığdırırken kullanılan dolgu (padding) faktörü */
const FIT_PADDING = 0.15;

// ─────────────────────────────────────────────
// Bölge (Region) Yardımcıları
// ─────────────────────────────────────────────

/**
 * Tek bir koordinata odaklanmış dar bir bölge (MapRegion) oluşturur.
 * Yeni eklenen bir yere veya kullanıcının konumuna zoom yapmak için kullanışlıdır.
 */
export function regionFromCoordinate(
    latitude: number,
    longitude: number,
    deltaPadding = 0.02
): MapRegion {
    return {
        latitude,
        longitude,
        latitudeDelta: deltaPadding,
        longitudeDelta: deltaPadding / 2,
    };
}

/**
 * Sağlanan tüm yerleri ekrana sığdıracak bir MapRegion hesaplar.
 * Yer listesi boşsa DEFAULT_MAP_REGION değerine geri döner.
 */
export function fitRegionToPlaces(places: SharedPlace[]): MapRegion {
    if (places.length === 0) return DEFAULT_MAP_REGION;
    if (places.length === 1) {
        return regionFromCoordinate(places[0].latitude, places[0].longitude);
    }

    const lats = places.map((p) => p.latitude);
    const lngs = places.map((p) => p.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latDelta = (maxLat - minLat) * (1 + FIT_PADDING);
    const lngDelta = (maxLng - minLng) * (1 + FIT_PADDING);

    return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lngDelta, 0.005),
    };
}

/**
 * Aşağıdaki öncelik sırasına göre başlangıç harita bölgesini döndürür:
 *  1. Kullanıcının mevcut konumu (sağlanmışsa)
 *  2. Listelenen ilk paylaşılan yer
 *  3. Varsayılan yedek bölge (Istanbul)
 */
export function getInitialMapRegion(
    userLocation: { latitude: number; longitude: number } | null,
    places: SharedPlace[]
): MapRegion {
    if (userLocation) {
        return regionFromCoordinate(userLocation.latitude, userLocation.longitude, 0.05);
    }
    if (places.length > 0) {
        return fitRegionToPlaces(places);
    }
    return DEFAULT_MAP_REGION;
}

// ─────────────────────────────────────────────
// Koordinat Doğrulama
// ─────────────────────────────────────────────

/** Geçerli bir WGS84 enlem (latitude) değeri için true döner */
export function isValidLatitude(lat: unknown): lat is number {
    return typeof lat === 'number' && isFinite(lat) && lat >= -90 && lat <= 90;
}

/** Geçerli bir WGS84 boylam (longitude) değeri için true döner */
export function isValidLongitude(lng: unknown): lng is number {
    return typeof lng === 'number' && isFinite(lng) && lng >= -180 && lng <= 180;
}

/** Hem enlem hem de boylam değerleri geçerliyse true döner */
export function isValidCoordinate(
    lat: unknown,
    lng: unknown
): lat is number {
    return isValidLatitude(lat) && isValidLongitude(lng);
}

// ─────────────────────────────────────────────
// Veri Dönüştürme
// ─────────────────────────────────────────────

/**
 * SharedPlace nesne dizisini, haritada hızlı render edilebilmesi için
 * daha hafif olan PlaceMarkerData nesnelerine dönüştürür.
 */
export function toMarkerData(places: SharedPlace[]): PlaceMarkerData[] {
    return places.map((place) => ({
        id: place.id,
        title: place.title,
        coordinate: {
            latitude: place.latitude,
            longitude: place.longitude,
        },
    }));
}

// ─────────────────────────────────────────────
// Tarih Formatlama
// ─────────────────────────────────────────────

/** ISO tarih string'ini okunabilir bir tarihe dönüştürür */
export function formatVisitedDate(isoString: string | null): string {
    if (!isoString) return 'Tarih bilinmiyor';
    return new Date(isoString).toLocaleDateString('tr-TR', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

/** ISO zaman damgasını göreceli zamana (örn: "5 dk önce") veya mutlak tarihe dönüştürür */
export function formatCommentTime(isoString: string): string {
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60_000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'az önce';
    if (diffMin < 60) return `${diffMin} dk önce`;
    if (diffHr < 24) return `${diffHr} sa önce`;
    if (diffDay < 7) return `${diffDay} gün önce`;

    return new Date(isoString).toLocaleDateString('tr-TR', {
        month: 'short',
        day: 'numeric',
    });
}
