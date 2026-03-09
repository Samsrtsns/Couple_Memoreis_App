import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { calculateDaysTogether } from "../utils/dateUtils";

type Props = {
    relationshipStartDate?: string | null;
};

export default function RelationshipCard({ relationshipStartDate }: Props) {
    if (!relationshipStartDate) return null;

    const daysTogether = calculateDaysTogether(relationshipStartDate);

    return (
        <View className="bg-white rounded-[24px] shadow-sm shadow-slate-200 border border-slate-100 p-6 flex-row items-center">
            <View className="w-14 h-14 bg-rose-50 rounded-full items-center justify-center mr-4 flex-shrink-0">
                <Ionicons name="heart" size={28} color="#F43F5E" />
            </View>
            <View className="flex-1">
                <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                    Relationship
                </Text>
                <Text className="text-slate-800 font-extrabold text-[22px]">
                    Together for{" "}
                    <Text className="text-rose-500">{daysTogether}</Text> days
                </Text>
            </View>
        </View>
    );
}
