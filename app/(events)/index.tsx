import Screen from "@/src/components/Screen";
import { useAuth } from "@/src/context/AuthContext";
import { calculateDaysRemaining, SpecialEvent } from "@/src/utils/dateUtils";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function EventsScreen() {
    const { state } = useAuth();
    const { profile, partner } = state;

    // Sort events by closest remaining days dynamically
    const sortedEvents = useMemo(() => {
        const SPECIAL_EVENTS: SpecialEvent[] = [
            { id: "1", title: "Partner's Birthday", date: partner?.birth_date || "2000-01-01", isYearly: true, iconName: "gift-outline" },
            { id: "2", title: "Our Anniversary", date: profile?.relationship_start_date || "2024-01-01", isYearly: true, iconName: "heart-outline" },
            { id: "3", title: "Valentine's Day", date: "2026-02-14", isYearly: true, iconName: "rose-outline" },
            { id: "4", title: "New Year", date: "2026-01-01", isYearly: true, iconName: "sparkles-outline" },
        ];

        return SPECIAL_EVENTS.sort((a, b) => {
            return calculateDaysRemaining(a.date, a.isYearly) - calculateDaysRemaining(b.date, b.isYearly);
        });
    }, [partner?.birth_date, profile?.relationship_start_date]);

    return (
        <Screen>
            <View className="flex-1 bg-bgLight">
                <View className="px-6 py-4 flex-row items-center justify-between border-b border-slate-100 bg-white">
                    <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2">
                        <Ionicons name="chevron-back" size={24} color="#0F172A" />
                    </Pressable>
                    <Text className="text-xl font-bold text-slate-800">Special Days</Text>
                    <View className="w-10 h-10" />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24 }}>
                    {sortedEvents.map((event) => {
                        const remaining = calculateDaysRemaining(event.date, event.isYearly);

                        return (
                            <View
                                key={event.id}
                                className="bg-white rounded-[20px] p-5 mb-4 flex-row items-center border border-slate-100 shadow-sm shadow-slate-100"
                            >
                                <View className="w-12 h-12 rounded-full bg-rose-50 items-center justify-center mr-4">
                                    <Ionicons name={event.iconName || "calendar-outline"} size={22} color="#F43F5E" />
                                </View>

                                <View className="flex-1">
                                    <Text className="text-slate-800 font-bold text-base mb-1">{event.title}</Text>
                                    <View className="flex-row items-center">
                                        <Ionicons name="time-outline" size={14} color="#94A3B8" />
                                        <Text className="text-slate-500 text-xs ml-1 font-medium">
                                            {remaining} days left
                                        </Text>
                                    </View>
                                </View>

                                {remaining <= 7 && remaining > 0 && (
                                    <View className="bg-rose-100 px-3 py-1 rounded-full">
                                        <Text className="text-rose-600 font-bold text-xs">Soon</Text>
                                    </View>
                                )}
                                {remaining === 0 && (
                                    <View className="bg-emerald-100 px-3 py-1 rounded-full">
                                        <Text className="text-emerald-700 font-bold text-xs">Today</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        </Screen>
    );
}
