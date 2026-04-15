import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Platform } from "react-native";
import { useAuth } from "../context/AuthContext";
import { completeRelationshipSetup } from "../services/pairService";
import { normalizeDateToNoon } from "../utils/dateUtils";

/**
 * İlişki kurulum sürecini (doğum tarihleri, başlangıç tarihi) yöneten özel hook.
 * Tarih seçicileri (DatePicker), tarih formatlama ve veritabanına kaydetme işlemlerini yönetir.
 */
export function useRelationshipSetup() {
    const { t, i18n } = useTranslation();
    const { refreshProfile } = useAuth();
    const [myBirthDate, setMyBirthDate] = useState(new Date());
    const [partnerBirthDate, setPartnerBirthDate] = useState(new Date());
    const [relationshipStartDate, setRelationshipStartDate] = useState(new Date());

    // Hangi tarih seçicinin (DatePicker) aktif olduğunu tutan state
    const [activeDatePicker, setActiveDatePicker] = useState<
        "myBirth" | "partnerBirth" | "relationStart" | null
    >(null);

    const [loading, setLoading] = useState(false);

    /**
     * Tarih nesnesini "gün.ay.yıl" formatında string'e dönüştürür.
     */
    const formatDate = (date: Date) => {
        const locale = i18n.language?.startsWith("en") ? "en-US" : "tr-TR";
        return date.toLocaleDateString(locale, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    /**
     * Tarih nesnesini veritabanı için "YYYY-MM-DD" formatına dönüştürür.
     * Yerel zaman dilimi farkını hesaba katar.
     */
    const toISODate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    /**
     * DatePicker'dan tarih seçildiğinde çalışan fonksiyon.
     */
    const handleDateChange = (_: any, selectedDate?: Date) => {
        // Android'de seçimden sonra picker'ı otomatik kapat
        if (Platform.OS !== "ios") {
            setActiveDatePicker(null);
        }

        if (selectedDate) {
            const normalized = normalizeDateToNoon(selectedDate);
            if (activeDatePicker === "myBirth") {
                setMyBirthDate(normalized);
            } else if (activeDatePicker === "partnerBirth") {
                setPartnerBirthDate(normalized);
            } else if (activeDatePicker === "relationStart") {
                setRelationshipStartDate(normalized);
            }
        }
    };

    /**
     * Tarih seçiciyi kapatır.
     */
    const closePicker = () => {
        setActiveDatePicker(null);
    };

    /**
     * Formu gönderir ve ilişki kurulumunu veritabanında tamamlar.
     */
    const submit = async () => {
        try {
            setLoading(true);

            // Servisi çağırarak tarihleri kaydet
            await completeRelationshipSetup(
                toISODate(myBirthDate),
                toISODate(partnerBirthDate),
                toISODate(relationshipStartDate)
            );

            // Global auth context'i yenile (yeni partner bilgilerinin yansıması için)
            if (refreshProfile) {
                await refreshProfile();
            }

            Alert.alert(t("common.success"), t("relationshipSetup.successMessage"), [
                {
                    text: t("relationshipSetup.ok"),
                    onPress: () => router.replace("/(tabs)/home"),
                },
            ]);
        } catch (e: any) {
            Alert.alert(t("common.error"), e.message || t("relationshipSetup.errorGeneric"));
        } finally {
            setLoading(false);
        }
    };

    return {
        myBirthDate,
        partnerBirthDate,
        relationshipStartDate,
        activeDatePicker,
        setActiveDatePicker,
        handleDateChange,
        closePicker,
        submit,
        loading,
        formatDate,
    };
}