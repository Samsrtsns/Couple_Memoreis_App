import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { calculateDaysRemaining } from "../utils/dateUtils";

type Props = {
    title: string;
    date: string;
    isYearly?: boolean;
    iconName?: keyof typeof Ionicons.glyphMap;
};

export default function SpecialDayCard({
    title,
    date,
    isYearly = true,
    iconName = "heart",
}: Props) {
    const remainingDays = calculateDaysRemaining(date, isYearly);

    return (
        <View
            className="w-full rounded-2xl bg-bgLight px-4 py-4"
            style={{
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 6,
            }}
        >
            <View className="flex-row items-center">
                <View className="h-14 w-14 rounded-2xl bg-rose-100 items-center justify-center mr-4">
                    <Ionicons name={iconName} size={24} color="#F43F5E" />
                </View>

                <View className="flex-1">
                    <Text
                        numberOfLines={1}
                        className="text-slate-700 font-bold text-[15px]"
                    >
                        {title}
                    </Text>

                    <Text className="text-rose-500 font-semibold text-[13px] mt-1">
                        {remainingDays === 0 ? "🎉 Today!" : `${remainingDays} days left`}
                    </Text>
                </View>
            </View>
        </View>
    );
}