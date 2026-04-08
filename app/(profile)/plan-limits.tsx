import PrimaryButton from "@/src/components/PrimaryButton";
import { useAuth } from "@/src/context/AuthContext";
import { usePhotoUploadCountdown } from "@/src/hooks/usePhotoUploadCountdown";
import { supabase } from "@/src/lib/supabase";
import { presentPremiumPaywall } from "@/src/services/revenueCatService";
import { isPremiumUser } from "@/src/utils/photoLimitUtils";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    View,
} from "react-native";

type UsageCounts = {
    totalPhotoMemories: number;
    totalPlaces: number;
};

export default function PlanLimitsScreen() {
    const { state, refreshProfile } = useAuth();
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
                .from('memories')
                .select('id', { count: 'exact', head: true })
                .eq('created_by', userId)
                .not('photo_url', 'is', null),
            supabase
                .from('shared_places')
                .select('id', { count: 'exact', head: true })
                .eq('created_by', userId),
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
                        {premium ? "Planın: Premium" : "Planın: Ücretsiz"}
                    </Text>
                    <Text className="text-slate-500 text-sm font-medium mt-1 text-center">
                        {premium
                            ? "Tüm özelliklere sınırsız erişimin var!"
                            : "Temel özellikleri kullanıyorsun."}
                    </Text>
                    {!premium && (
                        <Text className="text-amber-700 text-xs font-semibold mt-3 text-center">
                            Ücretsiz planda günde 1 fotoğraf, toplam 4 anı ve 4 paylaşılan yer ekleyebilirsin.
                        </Text>
                    )}
                </View>

                <View className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm mb-6">
                    <Text className="text-slate-800 font-bold text-lg mb-6">Kullanım Durumu</Text>

                    <View className="space-y-6">
                        {/* Photos */}
                        <View>
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-slate-600 font-semibold">Fotoğraflı Anılar</Text>
                                <Text className="text-slate-900 font-extrabold">
                                    {counts?.totalPhotoMemories ?? 0} / {premium ? '∞' : 4}
                                </Text>
                            </View>
                            <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <View
                                    className="h-full bg-rose-500 rounded-full"
                                    style={{
                                        width: premium
                                            ? '100%'
                                            : `${Math.min(((counts?.totalPhotoMemories ?? 0) / 4) * 100, 100)}%`
                                    }}
                                />
                            </View>
                        </View>

                        {/* Places */}
                        <View className="mt-6">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-slate-600 font-semibold">Paylaşılan Yerler</Text>
                                <Text className="text-slate-900 font-extrabold">
                                    {counts?.totalPlaces ?? 0} / {premium ? '∞' : 4}
                                </Text>
                            </View>
                            <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <View
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{
                                        width: premium
                                            ? '100%'
                                            : `${Math.min(((counts?.totalPlaces ?? 0) / 4) * 100, 100)}%`
                                    }}
                                />
                            </View>
                        </View>

                        {/* Daily Limit */}
                        <View className="mt-6">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-slate-600 font-semibold">Günlük Fotoğraf Hakkı (Kalan)</Text>
                                <Text className="text-slate-900 font-extrabold">
                                    {premium ? '∞' : `${dailyRemaining} / 1`}
                                </Text>
                            </View>
                            <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <View
                                    className="h-full bg-amber-500 rounded-full"
                                    style={{
                                        width: premium ? '100%' : `${Math.min(Math.max(dailyRemaining, 0) * 100, 100)}%`
                                    }}
                                />
                            </View>
                            {isLocked && (
                                <Text className="text-amber-600 text-xs font-semibold mt-2">
                                    Yeni hak {remainingText} sonra yenilenecek
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
                        <Text className="text-amber-900 font-bold text-lg text-center">Premium'a Geç</Text>
                        <Text className="text-amber-800/70 text-sm text-center leading-5 mt-2 mb-6">
                            Sınırsız anı, konum ve daha fazlası için Premium planı tercih et.
                        </Text>
                        <View className="w-full">
                            <PrimaryButton
                                title="Şimdi Yükselt"
                                onPress={async () => {
                                    if (state.user?.id) {
                                        const success = await presentPremiumPaywall(state.user.id);
                                        if (success) {
                                            await refreshProfile();
                                            fetchCounts();
                                        }
                                    }
                                }}
                            />
                        </View>
                    </View>
                ) : (
                    <View className="bg-green-50 rounded-[28px] border border-green-100 p-6 items-center">
                        <Ionicons name="checkmark-circle" size={48} color="#059669" />
                        <Text className="text-green-900 font-bold text-lg mt-2">Premium Aktif</Text>
                        <Text className="text-green-800/70 text-sm text-center mt-2">
                            Harika bir deneyim için sınırsız haklarını kullanıyorsun!
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
