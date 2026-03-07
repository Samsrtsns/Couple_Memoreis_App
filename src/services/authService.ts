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
        throw new Error("User could not be created.");
    }

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

export async function logoutUser() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw new Error(error.message);
    }
}

export async function getCurrentSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        throw new Error(error.message);
    }

    return data.session;
}