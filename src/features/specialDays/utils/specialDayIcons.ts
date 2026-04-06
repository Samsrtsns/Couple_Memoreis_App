const ICONS = ['gift', 'heart', 'sparkles', 'calendar'] as const;

/** `SpecialDayCard` rozet renkleri için tutarlı ikon seçimi */
export function iconNameForSpecialDayId(id: string): string {
    let h = 0;
    for (let i = 0; i < id.length; i++) {
        h = (h * 31 + id.charCodeAt(i)) | 0;
    }
    return ICONS[Math.abs(h) % ICONS.length];
}
