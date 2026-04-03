import RelationshipCard from "@/src/components/RelationshipCard";
import RelationshipDashboard from "@/src/components/RelationshipDashboard";
import Screen from "@/src/components/Screen";
import SpecialDayCard from "@/src/components/SpecialDayCard";
import { useAuth } from "@/src/context/AuthContext";
import { useMemories } from "@/src/features/memories/hooks/useMemories";
import { useSharedPlaces } from "@/src/features/sharedMap/hooks/useSharedPlaces";
import { calculateDaysRemaining, SpecialEvent } from "@/src/utils/dateUtils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function HomeScreen() {
    const { state } = useAuth();
    const { profile, partner } = state;

    const { memories } = useMemories();
    const { places } = useSharedPlaces();

    const upcomingEvents = useMemo(() => {
        const events: SpecialEvent[] = [
            {
                id: "1",
                title: "Partner's Birthday",
                date: partner?.birth_date || "2000-01-01",
                isYearly: true,
                iconName: "gift",
            },
            {
                id: "2",
                title: "Valentine's Day",
                date: "2026-02-14",
                isYearly: true,
                iconName: "heart",
            },
            {
                id: "3",
                title: "New Year",
                date: "2026-01-01",
                isYearly: true,
                iconName: "sparkles",
            },
            {
                id: "4",
                title: "Anniversary",
                date: profile?.relationship_start_date || "2024-01-01",
                isYearly: true,
                iconName: "calendar",
            },
        ];

        return events.sort(
            (a, b) =>
                calculateDaysRemaining(a.date, a.isYearly) -
                calculateDaysRemaining(b.date, b.isYearly)
        );
    }, [partner?.birth_date, profile?.relationship_start_date]);

    return (
        <Screen>
            <ScrollView
                className="flex-1 bg-bgLight"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                <View className="pt-4 px-6 flex-row justify-between items-center">
                    <View className="flex-1 mr-4">
                        <Text className="text-slate-500 font-medium text-[14px]">
                            Welcome back
                        </Text>
                        <Text
                            className="text-slate-800 font-extrabold text-[28px] mt-1"
                            numberOfLines={1}
                        >
                            {profile?.first_name || "User"} 👋🏻
                        </Text>
                    </View>
                </View>

                <RelationshipCard
                    relationshipStartDate={profile?.relationship_start_date}
                />

                <RelationshipDashboard
                    memoriesCount={memories?.length || 0}
                    placesCount={places?.length || 0}
                    nearestEvent={upcomingEvents[0]}
                />

                <View className="mt-6">
                    <View className="px-6 flex-row items-center justify-between mb-4">
                        <Text className="text-slate-800 font-bold text-lg">
                            Special Days
                        </Text>

                        <Pressable
                            onPress={() => router.push("/(events)")}
                            className="flex-row items-center"
                        >
                            <Text className="text-rose-500 font-semibold text-sm mr-1">
                                View All
                            </Text>
                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color="#F43F5E"
                            />
                        </Pressable>
                    </View>

                    <View className="px-6 gap-3">
                        {upcomingEvents.map((event) => (
                            <SpecialDayCard
                                key={event.id}
                                title={event.title}
                                date={event.date}
                                isYearly={event.isYearly}
                                iconName={event.iconName}
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>
        </Screen>
    );
}