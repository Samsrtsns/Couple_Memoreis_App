import { useEffect } from "react";
import { Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { getProfileWithPartner } from "../services/pairService";

export type ProfileData = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    partner_id?: string;
    avatar_url?: string;
    birth_date?: string;
    relationship_start_date?: string;
};

export function useProfile() {
    const { state, dispatch } = useAuth();
    const { profile, partner, isFetchingProfile } = state;

    useEffect(() => {
        // Optional background refresh: if we already have a profile, we don't *block* logic, 
        // but we can silently update it if we want to. However, let's keep it clean
        // and only fetch on mount if it's missing entirely (e.g. somehow it wasn't fetched).
        if (!profile && state.isLoggedIn) {
            loadProfileData();
        }
    }, [profile, state.isLoggedIn]);

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
            Alert.alert("Error loading profile", e.message);
        }
    };

    return {
        profile,
        partner,
        // Only return true loading state if we actively fetching AND we don't have profile data yet.
        // If we have profile data, it's just a background refresh.
        loading: isFetchingProfile && !profile,
        isFetchingBackground: isFetchingProfile && !!profile,
        refetch: () => loadProfileData(true),
    };
}
