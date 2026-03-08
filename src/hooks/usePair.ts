import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Share } from "react-native";
import { getMyProfile, matchPartner } from "../services/pairService";

export function usePair() {
    const [myCode, setMyCode] = useState("");
    const [partnerCode, setPartnerCode] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const profile = await getMyProfile();
            setMyCode(profile.match_code);
        } catch (e: any) {
            Alert.alert("Error", e.message);
        }
    };

    const copyCode = async () => {
        await Clipboard.setStringAsync(myCode);
        Alert.alert("Copied", "Invite code copied.");
    };

    const shareCode = async () => {
        await Share.share({
            message: `Join me on the app. My invite code: ${myCode}`,
        });
    };

    const connectPartner = async () => {
        if (!partnerCode.trim()) {
            Alert.alert("Error", "Enter partner code.");
            return;
        }

        try {
            setLoading(true);

            await matchPartner(partnerCode.trim());

            router.push("/(pairing)/relationship-setup");
        } catch (e: any) {
            Alert.alert("Pair Error", e.message);
        } finally {
            setLoading(false);
        }
    };
    return {
        myCode,
        partnerCode,
        setPartnerCode,
        loading,
        copyCode,
        shareCode,
        connectPartner,
    };
}