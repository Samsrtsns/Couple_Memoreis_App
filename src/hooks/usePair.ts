import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Share } from "react-native";
import { getMyProfile, matchPartner } from "../services/pairService";

/**
 * Partner eşleşme (pairing) sürecini yöneten özel hook.
 * Davet kodu oluşturma, kopyalama, paylaşma ve partnerle eşleşme işlemlerini sağlar.
 */
export function usePair() {
    const { t } = useTranslation();
    const [myCode, setMyCode] = useState("");
    const [partnerCode, setPartnerCode] = useState("");
    const [loading, setLoading] = useState(false);

    // Bileşen yüklendiğinde kullanıcının kendi profilini (ve kodunu) çek
    useEffect(() => {
        loadProfile();
    }, []);

    /**
     * Kendi match_code bilgimizi veritabanından getirir.
     */
    const loadProfile = async () => {
        try {
            const profile = await getMyProfile();
            setMyCode(profile.match_code);
        } catch (e: any) {
            Alert.alert(t("pairing.error"), e.message);
        }
    };

    /**
     * Davet kodunu cihaz kütüphanesine (Clipboard) kopyalar.
     */
    const copyCode = async () => {
        await Clipboard.setStringAsync(myCode);
        Alert.alert(t("pairing.copySuccessTitle"), t("pairing.copySuccessBody"));
    };

    /**
     * Davet kodunu diğer uygulamalar üzerinden (WhatsApp, SMS vb.) paylaşır.
     */
    const shareCode = async () => {
        await Share.share({
            message: t("pairing.shareMessage", { code: myCode }),
        });
    };

    /**
     * Girilen partner kodu ile eşleşme işlemini başlatır.
     */
    const connectPartner = async () => {
        if (!partnerCode.trim()) {
            Alert.alert(t("pairing.error"), t("pairing.enterPartnerCode"));
            return;
        }

        try {
            setLoading(true);

            // Eşleşme servisini çağır
            await matchPartner(partnerCode.trim());

            // Kısa başarı ekranı, ardından ilişki kurulum
            router.replace("/(pairing)/pair-success");
        } catch (e: any) {
            Alert.alert(t("pairing.matchErrorTitle"), e.message);
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