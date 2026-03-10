/**
 * Map Utilities
 *
 * Helpers for computing map regions, fitting to markers,
 * validating coordinates, and transforming SharedPlace data
 * into marker-ready objects.
 */

import type { MapRegion, PlaceMarkerData, SharedPlace } from '../types/sharedPlace.types';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/** Istanbul center — used as a final fallback region */
export const DEFAULT_MAP_REGION: MapRegion = {
    latitude: 41.015,
    longitude: 28.975,
    latitudeDelta: 0.12,
    longitudeDelta: 0.06,
};

/** Padding factor used when fitting the map to multiple markers */
const FIT_PADDING = 0.15;

// ─────────────────────────────────────────────
// Region helpers
// ─────────────────────────────────────────────

/**
 * Creates a tight region centered on a single coordinate.
 * Useful for zooming in to a newly added place or the user's location.
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
 * Calculates a MapRegion that fits all provided places on screen.
 * Falls back to DEFAULT_MAP_REGION when the places array is empty.
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
 * Returns the initial map region using the following priority:
 *  1. User's current location (if provided)
 *  2. First shared place
 *  3. Default fallback
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
// Coordinate validation
// ─────────────────────────────────────────────

/** Returns true for a valid WGS84 latitude value */
export function isValidLatitude(lat: unknown): lat is number {
    return typeof lat === 'number' && isFinite(lat) && lat >= -90 && lat <= 90;
}

/** Returns true for a valid WGS84 longitude value */
export function isValidLongitude(lng: unknown): lng is number {
    return typeof lng === 'number' && isFinite(lng) && lng >= -180 && lng <= 180;
}

/** Returns true if both latitude and longitude are valid */
export function isValidCoordinate(
    lat: unknown,
    lng: unknown
): lat is number {
    return isValidLatitude(lat) && isValidLongitude(lng);
}

// ─────────────────────────────────────────────
// Data transformation
// ─────────────────────────────────────────────

/**
 * Converts an array of SharedPlace objects into lightweight
 * PlaceMarkerData objects for efficient map rendering.
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
// Date formatting
// ─────────────────────────────────────────────

/** Formats an ISO date string into a human-readable date */
export function formatVisitedDate(isoString: string | null): string {
    if (!isoString) return 'Date unknown';
    return new Date(isoString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

/** Formats an ISO timestamp into relative time or absolute date */
export function formatCommentTime(isoString: string): string {
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60_000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}
