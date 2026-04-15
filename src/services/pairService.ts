import { supabase } from "@/src/lib/supabase";

const RETRY_DELAY_MS = 400;
const PROFILE_FETCH_MAX_RETRIES = 8;

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mevcut kullanıcının profilindeki eşleşme kodunu (match_code) getirir.
 */
export async function getMyProfile() {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Kullanıcı bulunamadı");

    for (let attempt = 0; attempt < PROFILE_FETCH_MAX_RETRIES; attempt++) {
        const { data, error } = await supabase
            .from("profiles")
            .select("match_code")
            .eq("id", user.id)
            .maybeSingle();

        if (error) throw new Error(error.message);
        if (data?.match_code) return data;

        if (attempt < PROFILE_FETCH_MAX_RETRIES - 1) {
            await sleep(RETRY_DELAY_MS);
        }
    }

    throw new Error("Profil hazırlanıyor, lütfen birkaç saniye sonra tekrar deneyin.");
}

/**
 * Mevcut kullanıcının profilini ve eğer varsa eşleştiği partnerin profil bilgilerini getirir.
 */
export async function getProfileWithPartner(userId?: string) {
    let currentUserId = userId;
    if (!currentUserId) {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        currentUserId = user?.id;
    }

    if (!currentUserId) throw new Error("Kullanıcı bulunamadı");

    let profile: any = null;
    for (let attempt = 0; attempt < PROFILE_FETCH_MAX_RETRIES; attempt++) {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUserId)
            .maybeSingle();

        if (error) {
            // Kayıt sonrası ilk saniyelerde profile satırı henüz oluşmadıysa
            // PostgREST tek kayıt zorlamasında bu mesajı dönebiliyor.
            if (!error.message.includes("Cannot coerce the result to a single JSON object")) {
                throw new Error(error.message);
            }
        } else if (data) {
            profile = data;
            break;
        }

        if (attempt < PROFILE_FETCH_MAX_RETRIES - 1) {
            await sleep(RETRY_DELAY_MS);
        }
    }

    if (!profile) {
        return {
            profile: null,
            partner: null,
        };
    }

    let partner = null;
    if (profile.partner_id) {
        const { data: partnerData, error: partnerError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", profile.partner_id)
            .maybeSingle();

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