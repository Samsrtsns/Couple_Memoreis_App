// src/services/authService.ts
import { supabase } from "@/src/lib/supabase";

/**
 * Kayıt parametreleri tipi
 */
type RegisterParams = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
};

/**
 * Giriş parametreleri tipi
 */
type LoginParams = {
    email: string;
    password: string;
};

/**
 * Yeni bir kullanıcı kaydı oluşturur.
 * Supabase Auth ile kullanıcıyı kaydeder ve ardından 'profiles' tablosuna profil bilgilerini ekler.
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

    // Auth kaydı başarılı olduktan sonra profil tablosuna isim bilgilerini kaydediyoruz
    const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        email,
    });

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
 * Kullanıcının oturumunu sonlandırır (çıkış yapar).
 */
export async function logoutUser() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw new Error(error.message);
    }
}

/**
 * Mevcut aktif oturum (session) bilgisini getirir.
 */
export async function getCurrentSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        throw new Error(error.message);
    }

    return data.session;
}