import { useEffect } from "react";
import { Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { getProfileWithPartner } from "../services/pairService";

/**
 * Profil verisi tipi
 */
export type ProfileData = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    partner_id?: string;
    avatar_url?: string;
    avatar_path?: string;
    birth_date?: string;
    relationship_start_date?: string;
    user_type?: 'base' | 'premium';
};

/**
 * Kullanıcı ve partner profil bilgilerini yöneten özel hook.
 * Verileri global state'den (AuthContext) okur ve gerekirse günceller.
 */
export function useProfile() {
    const { state, dispatch } = useAuth();
    const { profile, partner, isFetchingProfile } = state;

    useEffect(() => {
        // Eğer profil verisi yoksa ve kullanıcı giriş yapmışsa verileri yükle
        if (!profile && state.isLoggedIn) {
            loadProfileData();
        }
    }, [profile, state.isLoggedIn]);

    /**
     * Profil ve partner verilerini servisten çeken fonksiyon.
     * @param silent true ise yükleme durumu (loading) gösterilmez.
     */
    const loadProfileData = async (silent = false) => {
        try {
            if (!silent) {
                dispatch({ type: 'FETCH_PROFILE_START' });
            }
            const data = await getProfileWithPartner();
            dispatch({
                type: 'FETCH_PROFILE_SUCCESS',
                payload: {
                    profile: data.profile,
                    partner: data.partner,
                }
            });
        } catch (e: any) {
            if (!silent) {
                dispatch({ type: 'FETCH_PROFILE_ERROR' });
            }
            Alert.alert("Profil yüklenirken hata oluştu", e.message);
        }
    };

    return {
        profile,
        partner,
        // Aktif olarak veri çekiliyorsa ve henüz profil verisi yoksa loading true döner
        loading: isFetchingProfile && !profile,
        // Arka planda güncelleme yapılıyorsa (hali hazırda veri varken) bu durum kullanılır
        isFetchingBackground: isFetchingProfile && !!profile,
        // Verileri manuel olarak yeniden çekmek için kullanılır
        refetch: () => loadProfileData(true),
    };
}
