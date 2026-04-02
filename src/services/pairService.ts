import { supabase } from "@/src/lib/supabase";

/**
 * Mevcut kullanıcının profilindeki eşleşme kodunu (match_code) getirir.
 */
export async function getMyProfile() {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Kullanıcı bulunamadı");

    const { data, error } = await supabase
        .from("profiles")
        .select("match_code")
        .eq("id", user.id)
        .single();

    if (error) throw new Error(error.message);

    return data;
}

/**
 * Mevcut kullanıcının profilini ve eğer varsa eşleştiği partnerin profil bilgilerini getirir.
 */
export async function getProfileWithPartner() {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Kullanıcı bulunamadı");

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

/**
 * Verilen davet kodu ile başka bir kullanıcıyla eşleşme (matching) işlemini başlatır.
 * Supabase'deki 'match_with_code' adlı RPC (Stored Procedure) fonksiyonunu kullanır.
 */
export async function matchPartner(code: string) {
    const { data, error } = await supabase.rpc("match_with_code", {
        input_code: code,
    });

    if (error) throw new Error(error.message);

    return data;
}

/**
 * İlişki kurulumunu tamamlar. Kullanıcının ve partnerinin doğum tarihlerini,
 * ayrıca ilişki başlangıç tarihini sisteme kaydeder.
 */
export async function completeRelationshipSetup(
    myBirthDate: string,
    partnerBirthDate: string,
    relationshipStartDate: string
) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Kullanıcı bulunamadı");

    // İlk olarak kendi doğum tarihimizi güncelliyoruz
    const { error: myProfileError } = await supabase
        .from("profiles")
        .update({ birth_date: myBirthDate })
        .eq("id", user.id);

    if (myProfileError) throw new Error(myProfileError.message);

    // Ardından partner bilgilerini ve ilişki detaylarını güncelleyen RPC fonksiyonunu çağırıyoruz
    const { error } = await supabase.rpc("complete_relationship_setup", {
        partner_birth_date: partnerBirthDate,
        relationship_start_date: relationshipStartDate,
    });

    if (error) throw new Error(error.message);
}