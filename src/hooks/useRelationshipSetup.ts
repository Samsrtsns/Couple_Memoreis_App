import { router } from "expo-router";
import { useState } from "react";
import { Alert, Platform } from "react-native";
import { completeRelationshipSetup } from "../services/pairService";

export function useRelationshipSetup() {
    const [partnerBirthDate, setPartnerBirthDate] = useState(new Date());
    const [relationshipStartDate, setRelationshipStartDate] = useState(new Date());

    const [showBirthPicker, setShowBirthPicker] = useState(false);
    const [showRelationPicker, setShowRelationPicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const toISODate = (date: Date) => {
        return date.toISOString().split("T")[0];
    };

    const onChangePartnerBirthDate = (_: any, selectedDate?: Date) => {
        if (Platform.OS !== "ios") setShowBirthPicker(false);
        if (selectedDate) setPartnerBirthDate(selectedDate);
    };

    const onChangeRelationshipStartDate = (_: any, selectedDate?: Date) => {
        if (Platform.OS !== "ios") setShowRelationPicker(false);
        if (selectedDate) setRelationshipStartDate(selectedDate);
    };

    const submit = async () => {
        try {
            setLoading(true);

            await completeRelationshipSetup(
                toISODate(partnerBirthDate),
                toISODate(relationshipStartDate)
            );

            Alert.alert("Success", "Your relationship details have been saved.", [
                {
                    text: "OK",
                    onPress: () => router.replace("/(tabs)/home"),
                },
            ]);
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        partnerBirthDate,
        relationshipStartDate,
        showBirthPicker,
        showRelationPicker,
        setShowBirthPicker,
        setShowRelationPicker,
        onChangePartnerBirthDate,
        onChangeRelationshipStartDate,
        submit,
        loading,
        formatDate,
    };
}