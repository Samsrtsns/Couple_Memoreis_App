import { calculateDaysRemaining, SpecialEvent } from "@/src/utils/dateUtils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Text, TouchableOpacity, View } from "react-native";

interface RelationshipDashboardProps {
    memoriesCount: number;
    placesCount: number;
    nearestEvent?: SpecialEvent;
    /** Partner yokken üçüncü kutu “eşleş” mesajı gösterir */
    isLinked?: boolean;
}

export default function RelationshipDashboard({
    memoriesCount,
    placesCount,
    nearestEvent,
    isLinked = true,
}: RelationshipDashboardProps) {
    const { t } = useTranslation();
    const router = useRouter();

    const daysRemaining = useMemo(() => {
        if (!isLinked || !nearestEvent) return null;
        return calculateDaysRemaining(nearestEvent.date, nearestEvent.isYearly);
    }, [isLinked, nearestEvent]);

    const cardShadowStyle = {
        ...(Platform.OS === "ios"
            ? {
                  shadowColor: "#FF8A8A",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
              }
            : {
                  elevation: 4,
                  shadowColor: "#FF8A8A",
              }),
    };

    return (
        <View className="px-6 mt-4 flex-row justify-between mb-2">
            {/* Memories Stat */}
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/(tabs)/memory")}
                className="bg-bgLight rounded-2xl flex-1 items-center justify-center p-3 mr-2 border border-slate-100"
                style={cardShadowStyle}
            >
                <View className="w-10 h-10 rounded-full bg-rose-50 items-center justify-center mb-2">
                    <Ionicons name="images" size={20} color="#F43F5E" />
                </View>
                <Text className="text-slate-800 font-bold text-lg leading-tight mt-1">
                    {memoriesCount}
                </Text>
                <Text className="text-slate-400 font-medium text-[11px] mt-0.5">
                    {t("home.memories")}
                </Text>
            </TouchableOpacity>

            {/* Places Stat */}
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/(tabs)/map")}
                className="bg-bgLight rounded-2xl flex-1 items-center justify-center p-3 mx-1 border border-slate-100"
                style={cardShadowStyle}
            >
                <View className="w-10 h-10 rounded-full bg-rose-50 items-center justify-center mb-2">
                    <Ionicons name="map" size={20} color="#F43F5E" />
                </View>
                <Text className="text-slate-800 font-bold text-lg leading-tight mt-1">
                    {placesCount}
                </Text>
                <Text className="text-slate-400 font-medium text-[11px] mt-0.5">
                    {t("home.places")}
                </Text>
            </TouchableOpacity>

            {/* Nearest Event Stat */}
            <View
                className="bg-bgLight rounded-2xl flex-1 items-center justify-center p-3 ml-2 border border-slate-100"
                style={cardShadowStyle}
            >
                <View className="w-10 h-10 rounded-full bg-rose-50 items-center justify-center mb-2">
                    <Ionicons name="calendar" size={20} color="#F43F5E" />
                </View>
                <Text className="text-slate-800 font-bold text-lg leading-tight mt-1">
                    {!isLinked
                        ? "—"
                        : daysRemaining !== null
                          ? daysRemaining === 0
                              ? t("home.today")
                              : `${daysRemaining}g`
                          : "-"}
                </Text>
                <Text
                    className="text-slate-400 font-medium text-[11px] mt-0.5"
                    numberOfLines={2}
                >
                    {!isLinked
                        ? t("home.matchFirst")
                        : nearestEvent
                          ? nearestEvent.title
                          : t("home.events")}
                </Text>
            </View>
        </View>
    );
}
