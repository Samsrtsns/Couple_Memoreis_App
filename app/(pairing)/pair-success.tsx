import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const REDIRECT_MS = 3000;

export default function PairSuccessScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const id = setTimeout(() => {
            router.replace("/(pairing)/relationship-setup");
        }, REDIRECT_MS);
        return () => clearTimeout(id);
    }, []);

    return (
        <View
            className="flex-1 bg-bgLight items-center justify-center px-8"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
            <View className="items-center max-w-sm">
                <View className="w-24 h-24 rounded-full bg-emerald-100 items-center justify-center mb-6">
                    <Ionicons name="checkmark-circle" size={64} color="#059669" />
                </View>
                <Text className="text-2xl font-bold text-slate-900 text-center">
                    {t("pairing.connectSuccessTitle")}
                </Text>
                <Text className="text-slate-500 text-center mt-3 text-base leading-6">
                    {t("pairing.connectSuccessMessage")}
                </Text>
                <ActivityIndicator className="mt-10" color="#ea5385" />
            </View>
        </View>
    );
}
