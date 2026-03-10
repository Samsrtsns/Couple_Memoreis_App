/**
 * Validation helpers for Shared Places Map feature.
 *
 * These are pure functions — no side effects, no imports from React.
 * They can be used in hooks, components, and services.
 */

// ─────────────────────────────────────────────
// String helpers
// ─────────────────────────────────────────────

/** Trims and normalizes whitespace within a string */
export function sanitize(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
}

// ─────────────────────────────────────────────
// Place validation
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
 * Validates all required + optional fields for a new/edited shared place.
 */
export function validatePlaceForm(values: PlaceFormValues): PlaceValidationResult {
    const errors: Record<string, string> = {};

    // Title: required, min 2 chars, max 80 chars
    const title = sanitize(values.title ?? '');
    if (!title) {
        errors.title = 'Place name is required.';
    } else if (title.length < 2) {
        errors.title = 'Place name must be at least 2 characters.';
    } else if (title.length > 80) {
        errors.title = 'Place name must be under 80 characters.';
    }

    // Latitude: required, valid WGS84
    if (values.latitude === null || values.latitude === undefined) {
        errors.latitude = 'Latitude is required.';
    } else if (!isFinite(values.latitude) || values.latitude < -90 || values.latitude > 90) {
        errors.latitude = 'Latitude must be between -90 and 90.';
    }

    // Longitude: required, valid WGS84
    if (values.longitude === null || values.longitude === undefined) {
        errors.longitude = 'Longitude is required.';
    } else if (!isFinite(values.longitude) || values.longitude < -180 || values.longitude > 180) {
        errors.longitude = 'Longitude must be between -180 and 180.';
    }

    // Description: optional, max 500 chars
    const description = sanitize(values.description ?? '');
    if (description && description.length > 500) {
        errors.description = 'Description must be under 500 characters.';
    }

    // Address: optional, max 200 chars
    const address = sanitize(values.address ?? '');
    if (address && address.length > 200) {
        errors.address = 'Address must be under 200 characters.';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}

// ─────────────────────────────────────────────
// Comment validation
// ─────────────────────────────────────────────

export type CommentValidationResult = {
    valid: boolean;
    error: string | null;
};

const MAX_COMMENT_LENGTH = 1000;

/**
 * Validates a comment string before submission.
 */
export function validateComment(value: string): CommentValidationResult {
    const trimmed = sanitize(value);

    if (!trimmed) {
        return { valid: false, error: 'Comment cannot be empty.' };
    }
    if (trimmed.length > MAX_COMMENT_LENGTH) {
        return {
            valid: false,
            error: `Comment must be under ${MAX_COMMENT_LENGTH} characters.`,
        };
    }

    return { valid: true, error: null };
}

// ─────────────────────────────────────────────
// Debounce guard for rapid submissions
// ─────────────────────────────────────────────

/**
 * Creates a one-time debounce lock. Returns a function which
 * executes `fn` immediately on first call, then blocks further
 * calls until `cooldownMs` milliseconds have elapsed.
 *
 * Use this to prevent accidental double-submissions.
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
