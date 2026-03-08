import { useEffect, useState } from "react";
import { Alert } from "react-native";
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
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [partner, setPartner] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        try {
            setLoading(true);
            const data = await getProfileWithPartner();
            setProfile(data.profile);
            setPartner(data.partner);
        } catch (e: any) {
            Alert.alert("Error loading profile", e.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        profile,
        partner,
        loading,
        refetch: loadProfileData,
    };
}
