import { router } from "expo-router";
import { useState } from "react";
import { Alert, Platform } from "react-native";
import { completeRelationshipSetup } from "../services/pairService";

export function useRelationshipSetup() {
    const [myBirthDate, setMyBirthDate] = useState(new Date());
    const [partnerBirthDate, setPartnerBirthDate] = useState(new Date());
    const [relationshipStartDate, setRelationshipStartDate] = useState(new Date());

    const [activeDatePicker, setActiveDatePicker] = useState<
        "myBirth" | "partnerBirth" | "relationStart" | null
    >(null);

    const [loading, setLoading] = useState(false);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const toISODate = (date: Date) => {
        // Adjust date to account for local timezone before returning the ISO string block
        const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return offsetDate.toISOString().split("T")[0];
    };

    const handleDateChange = (_: any, selectedDate?: Date) => {
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

    const closePicker = () => {
        setActiveDatePicker(null);
    };

    const submit = async () => {
        try {
            setLoading(true);

            await completeRelationshipSetup(
                toISODate(myBirthDate),
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
            Alert.alert("Error", e.message || "Failed to save relationship details.");
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