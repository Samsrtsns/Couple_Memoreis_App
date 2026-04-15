import { useAuth } from "@/src/context/AuthContext";
import { openRevenueCatPaywall } from "@/src/services/revenuecat";
import { usePhotoUploadCountdown } from "@/src/hooks/usePhotoUploadCountdown";
import { supabase } from "@/src/lib/supabase";
import { isPremiumUser } from "@/src/utils/photoLimitUtils";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

type UsageCounts = {
    totalPhotoMemories: number;
    totalPlaces: number;
};

export default function PlanLimitsScreen() {
    const { t } = useTranslation();
    const { state } = useAuth();
    const profile = state.profile;
    const premium = isPremiumUser(profile);
    const { isLocked, remainingText } = usePhotoUploadCountdown();

    const [counts, setCounts] = useState<UsageCounts | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchCounts = useCallback(async () => {
        const userId = state.user?.id;
        if (!userId) return;

        const [memoriesRes, placesRes] = await Promise.all([
            supabase
                .from("memories")
                .select("id", { count: "exact", head: true })
                .eq("created_by", userId)
                .not("photo_url", "is", null),
            supabase
                .from("shared_places")
                .select("id", { count: "exact", head: true })
                .eq("created_by", userId),
        ]);

        setCounts({
            totalPhotoMemories: memoriesRes.count ?? 0,
            totalPlaces: placesRes.count ?? 0,
        });
        setLoading(false);
    }, [state.user?.id]);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    const dailyRemaining = profile?.daily_photo_count ?? 0;

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-bgLight">
                <ActivityIndicator size="large" color="#ea5385" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-bgLight">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 24 }}
            >
                <View className="items-center mb-8">
                    <View className="w-20 h-20 rounded-3xl bg-rose-100 items-center justify-center mb-4">
                        <Ionicons name="sparkles" size={40} color="#F43F5E" />
                    </View>
                    <Text className="text-slate-900 text-2xl font-extrabold text-center">
                        {premium
                            ? t("profile.planLimitsScreen.planPremium")
                            : t("profile.planLimitsScreen.planFree")}
                    </Text>
                    <Text className="text-slate-500 text-sm font-medium mt-1 text-center">
                        {premium
                            ? t("profile.planLimitsScreen.subtitlePremium")
                            : t("profile.planLimitsScreen.subtitleFree")}
                    </Text>
                    {!premium && (
                        <Text className="text-amber-700 text-xs font-semibold mt-3 text-center">
                            {t("profile.planLimitsScreen.freePlanHint")}
                        </Text>
                    )}
                </View>

                <View className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm mb-6">
                    <Text className="text-slate-800 font-bold text-lg mb-6">
                        {t("profile.planLimitsScreen.usageTitle")}
                    </Text>

                    <View className="space-y-6">
                        <View>
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-slate-600 font-semibold">
                                    {t("profile.planLimitsScreen.photoMemories")}
                                </Text>
                                <Text className="text-slate-900 font-extrabold">
                                    {counts?.totalPhotoMemories ?? 0} / {premium ? "∞" : 4}
                                </Text>
                            </View>
                            <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <View
                                    className="h-full bg-rose-500 rounded-full"
                                    style={{
                                        width: premium
                                            ? "100%"
                                            : `${Math.min(((counts?.totalPhotoMemories ?? 0) / 4) * 100, 100)}%`,
                                    }}
                                />
                            </View>
                        </View>

                        <View className="mt-6">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-slate-600 font-semibold">
                                    {t("profile.planLimitsScreen.sharedPlaces")}
                                </Text>
                                <Text className="text-slate-900 font-extrabold">
                                    {counts?.totalPlaces ?? 0} / {premium ? "∞" : 4}
                                </Text>
                            </View>
                            <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <View
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{
                                        width: premium
                                            ? "100%"
                                            : `${Math.min(((counts?.totalPlaces ?? 0) / 4) * 100, 100)}%`,
                                    }}
                                />
                            </View>
                        </View>

                        <View className="mt-6">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-slate-600 font-semibold">
                                    {t("profile.planLimitsScreen.dailyPhotoRemaining")}
                                </Text>
                                <Text className="text-slate-900 font-extrabold">
                                    {premium ? "∞" : `${dailyRemaining} / 1`}
                                </Text>
                            </View>
                            <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <View
                                    className="h-full bg-amber-500 rounded-full"
                                    style={{
                                        width: premium
                                            ? "100%"
                                            : `${Math.min(Math.max(dailyRemaining, 0) * 100, 100)}%`,
                                    }}
                                />
                            </View>
                            {isLocked && (
                                <Text className="text-amber-600 text-xs font-semibold mt-2">
                                    {t("profile.planLimitsScreen.dailyRefreshIn", {
                                        time: remainingText,
                                    })}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {!premium ? (
                    <View className="bg-amber-50 rounded-[28px] border border-amber-100 p-6 items-center">
                        <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center mb-4">
                            <MaterialIcons name="workspace-premium" size={24} color="#D97706" />
                        </View>
                        <Text className="text-amber-900 font-bold text-lg text-center">
                            {t("profile.planLimitsScreen.upgradeTitle")}
                        </Text>
                        <Text className="text-amber-800/70 text-sm text-center leading-5 mt-2">
                            {t("profile.planLimitsScreen.upgradeDesc")}
                        </Text>
                        <Pressable
                            className="bg-amber-500 rounded-2xl px-8 py-4 mt-5"
                            onPress={async () => {
                                console.log('[RC PAYWALL] User tapped upgrade in plan-limits');
                                const result = await openRevenueCatPaywall();
                                console.log('[RC PAYWALL] Paywall closed, result:', result);
                                if (result.includes("PURCHASED") || result.includes("RESTORED")) {
                                    Alert.alert("Tebrikler", "Premium üyeliğin aktif edildi!");
                                }
                            }}
                        >
                            <Text className="text-white font-extrabold text-base text-center">
                                {t("profile.planLimitsScreen.upgradeButton", { defaultValue: "Premium'a Yükselt" })}
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    <View className="bg-green-50 rounded-[28px] border border-green-100 p-6 items-center">
                        <Ionicons name="checkmark-circle" size={48} color="#059669" />
                        <Text className="text-green-900 font-bold text-lg mt-2">
                            {t("profile.planLimitsScreen.premiumActive")}
                        </Text>
                        <Text className="text-green-800/70 text-sm text-center mt-2">
                            {t("profile.planLimitsScreen.premiumActiveDesc")}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
