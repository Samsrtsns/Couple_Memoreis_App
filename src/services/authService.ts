// src/services/authService.ts
import { supabase } from "@/src/lib/supabase";

type RegisterParams = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
};

type LoginParams = {
    email: string;
    password: string;
};

/**
 * Yeni bir kullanıcı kaydı oluşturur.
 */
export async function registerUser({
    firstName,
    lastName,
    email,
    password,
}: RegisterParams) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        throw new Error(error.message);
    }

    const user = data.user;

    if (!user) {
        throw new Error("Kullanıcı oluşturulamadı.");
    }

    const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
            {
                id: user.id,
                first_name: firstName,
                last_name: lastName,
                email,
                // Kayit aninda NULL; ilk anı/harita fotosu yuklemesinde DB tetikleyicisi set eder
                last_photo_reset: null,
            },
            { onConflict: "id" }
        );

    if (profileError) {
        throw new Error(profileError.message);
    }

    return data;
}

/**
 * Mevcut bir kullanıcı ile sisteme giriş yapar.
 */
export async function loginUser({ email, password }: LoginParams) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Oturum açıkken şifreyi günceller.
 * Sadece updateUser çağrısı yapar; ek signIn veya session kontrolü yoktur.
 */
export async function changePasswordWithCurrent(params: {
    email: string;
    currentPassword: string;
    newPassword: string;
}) {
    const { error } = await supabase.auth.updateUser({
        password: params.newPassword,
    });

    if (error) {
        throw new Error(error.message);
    }
}

export async function logoutUser() {
    try {
        await supabase.auth.signOut();
    } catch {
        try {
            await supabase.auth.signOut({ scope: 'local' });
        } catch {}
    }
}

/**
 * Mevcut aktif oturum bilgisini getirir ve token'ın geçerliliğini doğrular.
 *
 * getSession() yalnızca AsyncStorage'dan okur, sunucuya gitmez.
 * Bu yüzden refreshSession() ile token'ı sunucu tarafında doğruluyoruz.
 * Refresh başarısızsa (token süresi dolmuş/iptal edilmiş) yerel veriyi
 * temizleyip null döndürüyoruz — uygulama login ekranına yönlendirilir.
 */
export async function getCurrentSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) return null;

        const { data, error } = await supabase.auth.refreshSession();

        if (error || !data.session) {
            console.warn('[Auth] Token refresh failed, clearing local session:', error?.message);
            try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
            return null;
        }

        return data.session;
    } catch (error) {
        console.error('[Auth] getCurrentSession error:', error);
        try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
        return null;
    }
}
