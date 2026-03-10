/**
 * Date Utilities — Memories Feature
 *
 * Consistent, elegant date formatting for the timeline.
 */

const MONTHS = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

/**
 * Formats a memory date string into elegant uppercase display.
 * Input: "2025-02-14"  →  Output: "14 FEBRUARY 2025"
 */
export function formatMemoryDate(dateString: string): string {
    // dateString is "YYYY-MM-DD"
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;

    const year = parts[0];
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const day = parseInt(parts[2], 10);

    const monthName = MONTHS[month] ?? '';
    return `${day} ${monthName} ${year}`;
}

/**
 * Returns a short human-friendly comment timestamp.
 * e.g. "Mar 10, 16:45" or "Feb 14, 2025"
 */
export function formatCommentDate(isoString: string): string {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;

    // Older than 24h — show short date
    const monthShort = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();

    // Show year only if different
    if (d.getFullYear() !== now.getFullYear()) {
        return `${monthShort} ${day}, ${d.getFullYear()}`;
    }
    return `${monthShort} ${day}`;
}

/**
 * Converts a JS Date object to a "YYYY-MM-DD" string
 * suitable for storing as `memory_date` in the database.
 */
export function toISODateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Returns a JS Date from a "YYYY-MM-DD" string.
 * Uses UTC noon to avoid timezone day-shift issues.
 */
export function fromISODateString(dateString: string): Date {
    return new Date(`${dateString}T12:00:00Z`);
}
