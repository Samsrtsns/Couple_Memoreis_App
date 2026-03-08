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

export async function getProfileWithPartner() {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not found");

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (profileError) throw new Error(profileError.message);

    let partner = null;
    if (profile.partner_id) {
        const { data: partnerData, error: partnerError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", profile.partner_id)
            .single();

        if (!partnerError && partnerData) {
            partner = partnerData;
        }
    }

    return {
        profile,
        partner,
    };
}

export async function matchPartner(code: string) {
    const { data, error } = await supabase.rpc("match_with_code", {
        input_code: code,
    });

    if (error) throw new Error(error.message);

    return data;
}

export async function completeRelationshipSetup(
    partnerBirthDate: string,
    relationshipStartDate: string
) {
    const { error } = await supabase.rpc("complete_relationship_setup", {
        partner_birth_date: partnerBirthDate,
        relationship_start_date: relationshipStartDate,
    });

    if (error) throw new Error(error.message);
}