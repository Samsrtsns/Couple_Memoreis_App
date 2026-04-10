// src/utils/dateUtils.ts

export function parseDateOnlyString(dateStr?: string | null): Date | null {
    if (!dateStr) return null;

    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
        const [year, month, day] = parts;
        return new Date(year, month - 1, day);
    }

    const parsed = new Date(dateStr);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Calculates the number of days between the given start date and today.
 */
export function calculateDaysTogether(startDateStr?: string | null): number {
    const start = parseDateOnlyString(startDateStr);
    if (!start) return 0;
    const today = new Date();

    // Normalize to midnight to avoid timezone/time-of-day offsets messing up days
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * Calculates how many days are remaining until the next occurrence of a specific date (like birthday or anniversary).
 * For non-yearly events, adjust logic accordingly. 
 */
export function calculateDaysRemaining(dateStr: string, isYearlyEvent = true): number {
    const eventDate = parseDateOnlyString(dateStr);
    if (!eventDate) return 0;
    const today = new Date();

    eventDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // Set the event date to the current year
    let nextOccurrence = new Date(eventDate);
    if (isYearlyEvent) {
        nextOccurrence.setFullYear(today.getFullYear());

        // If the date has already passed this year, set for next year
        if (nextOccurrence.getTime() < today.getTime()) {
            nextOccurrence.setFullYear(today.getFullYear() + 1);
        }
    } else {
        // If it's a one-time event that has passed, return 0 or negative
        if (eventDate.getTime() < today.getTime()) return 0;
        nextOccurrence = eventDate;
    }

    const diffTime = nextOccurrence.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

export type SpecialEvent = {
    id: string;
    title: string;
    date: string;
    isYearly?: boolean;
    iconName?: any;
};
