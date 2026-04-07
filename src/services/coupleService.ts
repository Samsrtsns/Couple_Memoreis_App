import { supabase } from '@/src/lib/supabase';

/**
 * Çift bağlantısını kaldırır: ortak verileri siler, her iki kullanıcıya yeni match_code atar.
 * Supabase’te `unlink_couple` RPC tanımlı olmalıdır.
 */
export async function unlinkCouple(): Promise<void> {
    const { error } = await supabase.rpc('unlink_couple');

    if (error) {
        throw new Error(error.message || 'Bağlantı kaldırılamadı.');
    }
}
