import { router } from "expo-router";
import { useState } from "react";
import { Alert, Platform } from "react-native";
import { useAuth } from "../context/AuthContext";
import { completeRelationshipSetup } from "../services/pairService";

/**
 * İlişki kurulum sürecini (doğum tarihleri, başlangıç tarihi) yöneten özel hook.
 * Tarih seçicileri (DatePicker), tarih formatlama ve veritabanına kaydetme işlemlerini yönetir.
 */
export function useRelationshipSetup() {
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
        return date.toLocaleDateString("tr-TR", {
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
        const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return offsetDate.toISOString().split("T")[0];
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
            if (activeDatePicker === "myBirth") {
                setMyBirthDate(selectedDate);
            } else if (activeDatePicker === "partnerBirth") {
                setPartnerBirthDate(selectedDate);
            } else if (activeDatePicker === "relationStart") {
                setRelationshipStartDate(selectedDate);
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

            Alert.alert("Başarılı", "İlişki detaylarınız kaydedildi.", [
                {
                    text: "Tamam",
                    onPress: () => router.replace("/(tabs)/home"),
                },
            ]);
        } catch (e: any) {
            Alert.alert("Hata", e.message || "İlişki detayları kaydedilemedi.");
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