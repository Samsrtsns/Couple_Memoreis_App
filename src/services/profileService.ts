import { supabase } from '@/src/lib/supabase';

export type UpdateProfileArgs = {
    userId: string;
    first_name?: string;
    last_name?: string;
    birth_date?: string | null;
    relationship_start_date?: string | null;
};

/**
 * Updates a user's profile in the database.
 */
export async function updateProfile({
    userId,
    first_name,
    last_name,
    birth_date,
    relationship_start_date,
}: UpdateProfileArgs) {
    const updates: any = {
        updated_at: new Date().toISOString(),
    };

    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (birth_date !== undefined) updates.birth_date = birth_date;
    if (relationship_start_date !== undefined) updates.relationship_start_date = relationship_start_date;

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}
