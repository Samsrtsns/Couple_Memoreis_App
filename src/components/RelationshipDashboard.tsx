import { calculateDaysRemaining, SpecialEvent } from "@/src/utils/dateUtils";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo } from "react";
import { Platform, Text, View } from "react-native";

interface RelationshipDashboardProps {
    memoriesCount: number;
    placesCount: number;
    nearestEvent?: SpecialEvent;
}

export default function RelationshipDashboard({
    memoriesCount,
    placesCount,
    nearestEvent,
}: RelationshipDashboardProps) {
    const daysRemaining = useMemo(() => {
        if (!nearestEvent) return null;
        return calculateDaysRemaining(nearestEvent.date, nearestEvent.isYearly);
    }, [nearestEvent]);

    return (
        <View className="px-6 mt-4 flex-row justify-between mb-2">
            {/* Memories Stat */}
            <View
                className="bg-bgLight rounded-2xl flex-1 items-center justify-center p-3 mr-2 border border-slate-100"
                style={
                    Platform.OS === "ios" ? {
                        shadowColor: "#F43F5E",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                    } : {
                        elevation: 4,
                        shadowColor: "#F43F5E",
                    }
                }
            >
                <View className="w-10 h-10 rounded-full bg-rose-50 items-center justify-center mb-2">
                    <Ionicons name="images" size={20} color="#F43F5E" />
                </View>
                <Text className="text-slate-800 font-bold text-lg leading-tight mt-1">{memoriesCount}</Text>
                <Text className="text-slate-400 font-medium text-[11px] mt-0.5">Memories</Text>
            </View>

            {/* Places Stat */}
            <View
                className="bg-bgLight rounded-2xl flex-1 items-center justify-center p-3 mx-1 border border-slate-100"
                style={
                    Platform.OS === "ios" ? {
                        shadowColor: "#F43F5E",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                    } : {
                        elevation: 4,
                        shadowColor: "#F43F5E",
                    }
                }
            >
                <View className="w-10 h-10 rounded-full bg-rose-50 items-center justify-center mb-2">
                    <Ionicons name="map" size={20} color="#F43F5E" />
                </View>
                <Text className="text-slate-800 font-bold text-lg leading-tight mt-1">{placesCount}</Text>
                <Text className="text-slate-400 font-medium text-[11px] mt-0.5">Places</Text>
            </View>

            {/* Nearest Event Stat */}
            <View
                className="bg-bgLight rounded-2xl flex-1 items-center justify-center p-3 ml-2 border border-slate-100"
                style={
                    Platform.OS === "ios" ? {
                        shadowColor: "#F43F5E",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                    } : {
                        elevation: 4,
                        shadowColor: "#F43F5E",
                    }
                }
            >
                <View className="w-10 h-10 rounded-full bg-rose-50 items-center justify-center mb-2">
                    <Ionicons name="calendar" size={20} color="#F43F5E" />
                </View>
                <Text className="text-slate-800 font-bold text-lg leading-tight mt-1">
                    {daysRemaining !== null ? `${daysRemaining}d` : "-"}
                </Text>
                <Text className="text-slate-400 font-medium text-[11px] mt-0.5" numberOfLines={1}>
                    {nearestEvent ? nearestEvent.title : "Events"}
                </Text>
            </View>
        </View>
    );
}
