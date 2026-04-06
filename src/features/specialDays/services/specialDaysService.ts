import { supabase } from '@/src/lib/supabase';
import { getPairUserIds } from '@/src/features/memories/utils/pair.utils';
import type { SpecialDay, SpecialDayRow } from '../types/specialDay.types';

export async function fetchSpecialDaysForPair(
    currentUserId: string,
    partnerId: string
): Promise<SpecialDay[]> {
    const { userAId, userBId } = getPairUserIds(currentUserId, partnerId);

    const { data, error } = await supabase
        .from('special_days')
        .select(
            `
            id,
            created_by,
            user_a_id,
            user_b_id,
            title,
            special_date,
            created_at,
            updated_at
        `
        )
        .eq('user_a_id', userAId)
        .eq('user_b_id', userBId)
        .order('special_date', { ascending: true });

    if (error) throw new Error(`Failed to fetch special days: ${error.message}`);
    return (data ?? []) as SpecialDay[];
}

export type CreateSpecialDayArgs = {
    title: string;
    special_date: string;
    currentUserId: string;
    partnerId: string;
};

export async function createSpecialDay({
    title,
    special_date,
    currentUserId,
    partnerId,
}: CreateSpecialDayArgs): Promise<SpecialDay> {
    const { userAId, userBId } = getPairUserIds(currentUserId, partnerId);

    const { data, error } = await supabase
        .from('special_days')
        .insert({
            created_by: currentUserId,
            user_a_id: userAId,
            user_b_id: userBId,
            title: title.trim(),
            special_date,
        })
        .select(
            `
            id,
            created_by,
            user_a_id,
            user_b_id,
            title,
            special_date,
            created_at,
            updated_at
        `
        )
        .single();

    if (error) throw new Error(`Failed to create special day: ${error.message}`);
    return data as SpecialDay;
}

export type UpdateSpecialDayArgs = {
    id: string;
    title: string;
    special_date: string;
};

export async function updateSpecialDay({
    id,
    title,
    special_date,
}: UpdateSpecialDayArgs): Promise<SpecialDay> {
    const { data, error } = await supabase
        .from('special_days')
        .update({
            title: title.trim(),
            special_date,
        })
        .eq('id', id)
        .select(
            `
            id,
            created_by,
            user_a_id,
            user_b_id,
            title,
            special_date,
            created_at,
            updated_at
        `
        )
        .single();

    if (error) throw new Error(`Failed to update special day: ${error.message}`);
    return data as SpecialDay;
}

export async function deleteSpecialDay(id: string): Promise<void> {
    const { error } = await supabase.from('special_days').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete special day: ${error.message}`);
}

type RealtimeSpecialDayCallbacks = {
    onInsert?: (row: SpecialDayRow) => void;
    onUpdate?: (row: SpecialDayRow) => void;
    onDelete?: (id: string) => void;
};

function rowMatchesPair(row: { user_a_id: string; user_b_id: string }, userAId: string, userBId: string) {
    return row.user_a_id === userAId && row.user_b_id === userBId;
}

export function subscribeToSpecialDays(
    userAId: string,
    userBId: string,
    callbacks: RealtimeSpecialDayCallbacks
): () => void {
    const uid = Math.random().toString(36).slice(2, 8);
    const channel = supabase
        .channel(`special_days:pair:${userAId}:${uid}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'special_days' },
            (payload) => {
                const newRow = payload.new as SpecialDayRow;
                if (rowMatchesPair(newRow, userAId, userBId)) {
                    callbacks.onInsert?.(newRow);
                }
            }
        )
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'special_days' },
            (payload) => {
                const row = payload.new as SpecialDayRow;
                if (rowMatchesPair(row, userAId, userBId)) {
                    callbacks.onUpdate?.(row);
                }
            }
        )
        .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'special_days' },
            (payload) => {
                const id = (payload.old as { id?: string })?.id;
                if (id) callbacks.onDelete?.(id);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}
