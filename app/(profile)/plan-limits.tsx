import PrimaryButton from "@/src/components/PrimaryButton";
import { useAuth } from "@/src/context/AuthContext";
import { useUsageStats } from "@/src/hooks/useUsageStats";
import { presentPremiumPaywall } from "@/src/services/revenueCatService";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    View,
    SafeAreaView,
    Platform
} from "react-native";

export default function PlanLimitsScreen() {
    const { state, refreshProfile } = useAuth();
    const { stats, loading, fetchStats } = useUsageStats();

    useEffect(() => {
        if (state.user?.id) fetchStats(state.user.id);
    }, [state.user?.id, fetchStats]);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-bgLight">
                <ActivityIndicator size="large" color="#ea5385" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-bgLight">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 24 }}
            >
                {/* Current Plan Header */}
                <View className="items-center mb-8">
                    <View className="w-20 h-20 rounded-3xl bg-rose-100 items-center justify-center mb-4">
                        <Ionicons name="sparkles" size={40} color="#F43F5E" />
                    </View>
                    <Text className="text-slate-900 text-2xl font-extrabold text-center">
                        {stats?.user_type === 'premium' ? "Planın: Premium" : "Planın: Ücretsiz"}
                    </Text>
                    <Text className="text-slate-500 text-sm font-medium mt-1 text-center">
                        {stats?.user_type === 'premium' 
                            ? "Tüm özelliklere sınırsız erişimin var!" 
                            : "Temel özellikleri kullanıyorsun."}
                    </Text>
                </View>

                {/* Status Cards */}
                <View className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm mb-6">
                    <Text className="text-slate-800 font-bold text-lg mb-6">Kullanım Durumu</Text>
                    
                    <View className="space-y-6">
                        {/* Photos */}
                        <View>
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-slate-600 font-semibold">Fotoğraflı Anılar</Text>
                                <Text className="text-slate-900 font-extrabold">
                                    {stats?.total_photo_memories || 0} / {stats?.user_type === 'premium' ? '∞' : stats?.max_photo_memories || 8}
                                </Text>
                            </View>
                            <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <View 
                                    className="h-full bg-rose-500 rounded-full" 
                                    style={{ 
                                        width: stats?.user_type === 'premium' 
                                            ? '100%' 
                                            : `${Math.min(((stats?.total_photo_memories || 0) / (stats?.max_photo_memories || 8)) * 100, 100)}%` 
                                    }} 
                                />
                            </View>
                        </View>

                        {/* Places */}
                        <View className="mt-6">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-slate-600 font-semibold">Paylaşılan Yerler</Text>
                                <Text className="text-slate-900 font-extrabold">
                                    {stats?.total_places || 0} / {stats?.user_type === 'premium' ? '∞' : stats?.max_places || 8}
                                </Text>
                            </View>
                            <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <View 
                                    className="h-full bg-blue-500 rounded-full" 
                                    style={{ 
                                        width: stats?.user_type === 'premium' 
                                            ? '100%' 
                                            : `${Math.min(((stats?.total_places || 0) / (stats?.max_places || 8)) * 100, 100)}%` 
                                    }} 
                                />
                            </View>
                        </View>

                        {/* Daily Limit */}
                        <View className="mt-6">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-slate-600 font-semibold">Günlük Fotoğraf Limiti</Text>
                                <Text className="text-slate-900 font-extrabold">
                                    {stats?.today_photos || 0} / {stats?.user_type === 'premium' ? '∞' : stats?.max_daily_photos || 1}
                                </Text>
                            </View>
                            <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <View 
                                    className="h-full bg-amber-500 rounded-full" 
                                    style={{ 
                                        width: stats?.user_type === 'premium' 
                                            ? '100%' 
                                            : `${Math.min(((stats?.today_photos || 0) / (stats?.max_daily_photos || 1)) * 100, 100)}%` 
                                    }} 
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Premium Banner / CTA */}
                {stats?.user_type !== 'premium' ? (
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
                                            fetchStats(state.user.id);
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
        </SafeAreaView>
    );
}
