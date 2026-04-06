import { getCurrentProfile } from '@/src/features/memories/services/memoriesService';
import { getPairUserIds } from '@/src/features/memories/utils/pair.utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SpecialDay } from '../types/specialDay.types';
import {
    createSpecialDay,
    deleteSpecialDay,
    fetchSpecialDaysForPair,
    subscribeToSpecialDays,
    updateSpecialDay,
} from '../services/specialDaysService';

export type UseSpecialDaysResult = {
    specialDays: SpecialDay[];
    loading: boolean;
    error: string | null;
    currentUserId: string | null;
    partnerId: string | null;
    hasPartner: boolean;
    refresh: () => Promise<void>;
    addSpecialDay: (title: string, special_date: string) => Promise<void>;
    editSpecialDay: (id: string, title: string, special_date: string) => Promise<void>;
    removeSpecialDay: (id: string) => Promise<void>;
};

export function useSpecialDays(): UseSpecialDaysResult {
    const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);

    const currentUserIdRef = useRef<string | null>(null);
    const partnerIdRef = useRef<string | null>(null);
    const pendingOptimisticIds = useRef<Set<string>>(new Set());

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const profile = await getCurrentProfile();
            setCurrentUserId(profile.id);
            currentUserIdRef.current = profile.id;
            setPartnerId(profile.partner_id);
            partnerIdRef.current = profile.partner_id;

            if (!profile.partner_id) {
                setSpecialDays([]);
                return;
            }

            const data = await fetchSpecialDaysForPair(profile.id, profile.partner_id);
            setSpecialDays(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    const refresh = useCallback(async () => {
        const uid = currentUserIdRef.current;
        const pid = partnerIdRef.current;
        if (!uid || !pid) return;
        try {
            const data = await fetchSpecialDaysForPair(uid, pid);
            setSpecialDays(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Refresh failed');
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!currentUserId || !partnerId) return;
        const { userAId, userBId } = getPairUserIds(currentUserId, partnerId);

        const unsub = subscribeToSpecialDays(userAId, userBId, {
            onInsert: (row) => {
                if (pendingOptimisticIds.current.has(row.id)) {
                    pendingOptimisticIds.current.delete(row.id);
                    return;
                }
                setSpecialDays((prev) => {
                    if (prev.some((s) => s.id === row.id)) return prev;
                    return [...prev, row].sort((a, b) =>
                        a.special_date.localeCompare(b.special_date)
                    );
                });
            },
            onUpdate: (row) => {
                setSpecialDays((prev) =>
                    prev
                        .map((s) => (s.id === row.id ? { ...s, ...row } : s))
                        .sort((a, b) => a.special_date.localeCompare(b.special_date))
                );
            },
            onDelete: (id) => {
                setSpecialDays((prev) => prev.filter((s) => s.id !== id));
            },
        });

        return () => unsub();
    }, [currentUserId, partnerId]);

    const addSpecialDay = useCallback(async (title: string, special_date: string) => {
        const uid = currentUserIdRef.current;
        const pid = partnerIdRef.current;
        if (!uid || !pid) throw new Error('Eşleşmiş bir partner yok.');

        const created = await createSpecialDay({
            title,
            special_date,
            currentUserId: uid,
            partnerId: pid,
        });
        pendingOptimisticIds.current.add(created.id);
        setSpecialDays((prev) => {
            if (prev.some((s) => s.id === created.id)) return prev;
            return [...prev, created].sort((a, b) => a.special_date.localeCompare(b.special_date));
        });
    }, []);

    const editSpecialDay = useCallback(async (id: string, title: string, special_date: string) => {
        const updated = await updateSpecialDay({ id, title, special_date });
        setSpecialDays((prev) =>
            prev
                .map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
                .sort((a, b) => a.special_date.localeCompare(b.special_date))
        );
    }, []);

    const removeSpecialDay = useCallback(
        async (id: string) => {
            setSpecialDays((prev) => prev.filter((s) => s.id !== id));
            try {
                await deleteSpecialDay(id);
            } catch (e) {
                await refresh();
                throw e;
            }
        },
        [refresh]
    );

    return {
        specialDays,
        loading,
        error,
        currentUserId,
        partnerId,
        hasPartner: !!partnerId,
        refresh,
        addSpecialDay,
        editSpecialDay,
        removeSpecialDay,
    };
}
