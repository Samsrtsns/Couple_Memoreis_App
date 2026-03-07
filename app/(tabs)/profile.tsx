import PrimaryButton from "@/src/components/PrimaryButton";
import Screen from "@/src/components/Screen";
import { logoutUser } from "@/src/services/authService";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

export default function ProfileScreen() {
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        try {
            setLoading(true);
            await logoutUser();
            router.replace("/(auth)/login");
        } catch (error: any) {
            Alert.alert("Logout Error", error.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen>
            <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 26, fontWeight: "700" }}>Profil</Text>

                <PrimaryButton
                    title={loading ? "Logging Out..." : "Log Out"}
                    variant="secondary"
                    onPress={handleLogout}
                />
            </View>
        </Screen>
    );
}