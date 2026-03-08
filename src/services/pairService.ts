import { supabase } from "@/src/lib/supabase";

export async function getMyProfile() {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not found");

    const { data, error } = await supabase
        .from("profiles")
        .select("match_code")
        .eq("id", user.id)
        .single();

    if (error) throw new Error(error.message);

    return data;
}

export async function matchPartner(code: string) {
    const { data, error } = await supabase.rpc("match_with_code", {
        input_code: code,
    });

    if (error) throw new Error(error.message);

    return data;
}