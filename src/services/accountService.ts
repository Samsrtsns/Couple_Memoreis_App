import { supabase } from '@/src/lib/supabase';

/**
 * Completely deletes the user's account and all associated data.
 * This calls the delete_user_account RPC and then signs out.
 */
export async function deleteUserAccount(): Promise<void> {
    const { error } = await supabase.rpc('delete_user_account');
    if (error) throw new Error(error.message);

    // After DB deletion, sign out to clear local session
    await supabase.auth.signOut();
}

/**
 * Removes the partner connection but keeps the account active.
 */
export async function unpairPartner(): Promise<void> {
    const { error } = await supabase.rpc('unpair_partner');
    if (error) throw new Error(error.message);
}
