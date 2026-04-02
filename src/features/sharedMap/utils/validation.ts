/**
 * Paylaşılan Yerler (Shared Places) harita özelliği için doğrulama (validation) yardımcıları.
 *
 * Bu dosyaki fonksiyonlar "saf" (pure) fonksiyonlardır; yan etkileri yoktur ve React'tan
 * bağımsızdırlar. Hook'lar, bileşenler ve servislerde kullanılabilirler.
 */

// ─────────────────────────────────────────────
// String Yardımcıları
// ─────────────────────────────────────────────

/** String'in başındaki ve sonundaki boşlukları temizler ve içindeki çoklu boşlukları teke indirir */
export function sanitize(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
}

// ─────────────────────────────────────────────
// Yer (Place) Doğrulama
// ─────────────────────────────────────────────

export type PlaceValidationResult = {
    valid: boolean;
    errors: Record<string, string>;
};

export type PlaceFormValues = {
    title: string;
    description?: string;
    latitude: number | null;
    longitude: number | null;
    address?: string;
    visited_at?: string;
};

/**
 * Yeni veya düzenlenmiş bir paylaşılan yer için tüm gerekli ve isteğe bağlı alanları doğrular.
 */
export function validatePlaceForm(values: PlaceFormValues): PlaceValidationResult {
    const errors: Record<string, string> = {};

    // Başlık: zorunlu, min 2, maks 80 karakter
    const title = sanitize(values.title ?? '');
    if (!title) {
        errors.title = 'Yer adı zorunludur.';
    } else if (title.length < 2) {
        errors.title = 'Yer adı en az 2 karakter olmalıdır.';
    } else if (title.length > 80) {
        errors.title = 'Yer adı 80 karakterden az olmalıdır.';
    }

    // Enlem (Latitude): zorunlu, geçerli WGS84 değeri
    if (values.latitude === null || values.latitude === undefined) {
        errors.latitude = 'Enlem bilgisi zorunludur.';
    } else if (!isFinite(values.latitude) || values.latitude < -90 || values.latitude > 90) {
        errors.latitude = 'Enlem -90 ile 90 arasında olmalıdır.';
    }

    // Boylam (Longitude): zorunlu, geçerli WGS84 değeri
    if (values.longitude === null || values.longitude === undefined) {
        errors.longitude = 'Boylam bilgisi zorunludur.';
    } else if (!isFinite(values.longitude) || values.longitude < -180 || values.longitude > 180) {
        errors.longitude = 'Boylam -180 ile 180 arasında olmalıdır.';
    }

    // Açıklama: isteğe bağlı, maks 500 karakter
    const description = sanitize(values.description ?? '');
    if (description && description.length > 500) {
        errors.description = 'Açıklama 500 karakterden az olmalıdır.';
    }

    // Adres: isteğe bağlı, maks 200 karakter
    const address = sanitize(values.address ?? '');
    if (address && address.length > 200) {
        errors.address = 'Adres 200 karakterden az olmalıdır.';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}

// ─────────────────────────────────────────────
// Yorum Doğrulama
// ─────────────────────────────────────────────

export type CommentValidationResult = {
    valid: boolean;
    error: string | null;
};

const MAX_COMMENT_LENGTH = 1000;

/**
 * Gönderilmeden önce yorum string'ini doğrular.
 */
export function validateComment(value: string): CommentValidationResult {
    const trimmed = sanitize(value);

    if (!trimmed) {
        return { valid: false, error: 'Yorum boş olamaz.' };
    }
    if (trimmed.length > MAX_COMMENT_LENGTH) {
        return {
            valid: false,
            error: `Yorum ${MAX_COMMENT_LENGTH} karakterden az olmalıdır.`,
        };
    }

    return { valid: true, error: null };
}

// ─────────────────────────────────────────────
// Hızlı Gönderim Engelleme (Submit Guard)
// ─────────────────────────────────────────────

/**
 * Tek seferlik bir debounce kilidi oluşturur. İlk çağrıda `fn` fonksiyonunu hemen
 * çalıştırır, ardından `cooldownMs` milisaniye geçene kadar gelen diğer çağrıları engeller.
 *
 * Yanlışlıkla yapılan çift tıklamaları ve mükerrer gönderimleri önlemek için kullanılır.
 */
export function createSubmitGuard(cooldownMs = 1500) {
    let lastCall = 0;
    return (fn: () => void) => {
        const now = Date.now();
        if (now - lastCall < cooldownMs) return;
        lastCall = now;
        fn();
    };
}
