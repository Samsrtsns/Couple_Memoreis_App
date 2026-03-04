import PrimaryButton from "@/src/components/PrimaryButton";
import Screen from "@/src/components/Screen";
import { router } from "expo-router";
import { Text, View } from "react-native";

export default function ProfileScreen() {
    return (
        <Screen>
            <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 26, fontWeight: "700" }}>Profil</Text>

                {/* Şimdilik logout sadece route */}
                <PrimaryButton
                    title="Çıkış Yap (Fake)"
                    variant="secondary"
                    onPress={() => router.replace("/(auth)/login")}
                />
            </View>
        </Screen>
    );
}