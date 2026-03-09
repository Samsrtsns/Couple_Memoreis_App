import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { calculateDaysRemaining } from "../utils/dateUtils";

type Props = {
    title: string;
    date: string; // ISO string 
    isYearly?: boolean;
    iconName?: keyof typeof Ionicons.glyphMap;
};

export default function SpecialDayCard({ title, date, isYearly = true, iconName = "calendar" }: Props) {
    const remainingDays = calculateDaysRemaining(date, isYearly);

    return (
        <View className="w-40 bg-white rounded-2xl p-4 mr-3 border border-slate-100 shadow-sm shadow-slate-100 min-h-[110px]">
            <View className="flex-row items-start justify-between mb-3">
                <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                    <Ionicons name={iconName} size={16} color="#3B82F6" />
                </View>
                {remainingDays <= 7 && (
                    <View className="bg-rose-100 px-2 py-0.5 rounded-full">
                        <Text className="text-rose-600 text-[10px] font-bold">Soon</Text>
                    </View>
                )}
            </View>

            <View className="flex-1 justify-end">
                <Text className="text-slate-800 font-bold mb-1" numberOfLines={1}>{title}</Text>
                <Text className="text-slate-500 text-xs">{remainingDays} days left</Text>
            </View>
        </View>
    );
}
