import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, View } from "react-native";
import { calculateDaysTogether } from "../utils/dateUtils";

type Props = {
    relationshipStartDate?: string | null;
};

export default function RelationshipCard({ relationshipStartDate }: Props) {
    if (!relationshipStartDate) return null;

    const daysTogether = calculateDaysTogether(relationshipStartDate);

    const formattedDate = new Date(relationshipStartDate).toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
        }
    );

    return (
        <View className="px-6">
            <View
                className="flex-col w-full items-center mt-6 p-6"
                style={{
                    backgroundColor: "#FFE4E6",
                    borderRadius: 24,
                    shadowColor: "#000",
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                }}
            >
                <View className="flex-row items-center gap-x-4 ">
                    <Image
                        source={{
                            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA1_kM2wl2t2KZcGYOWWeslpyy4tg28MI8_TqpCRCSHjDTmJ1mlD2d1w7kD51hNBc-MHPG_1CP8lS1g-hmGZrS8V7puXu_EiLT7ehnK2rG6-7mM52zBW9X1S4wm3RQFt3-FZUIfQ5Lm6WkqIfUJpgatxTpJ0CUzhMx3mrK2uHBDrDF5mQ7ljoaHHm718EtW2YsSpqFZrFLIHrsbSwdMKgio7FddfAiDXR-S7Y3SlZkSNcZgSnXaDGI3-3vSlRwiKY-noJyKY3_3ZvE",
                        }}
                        style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: "#fff" }}
                        resizeMode="cover"
                    />

                    <Ionicons name="heart" size={32} color="#F43F5E" />

                    <Image
                        source={{
                            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA1_kM2wl2t2KZcGYOWWeslpyy4tg28MI8_TqpCRCSHjDTmJ1mlD2d1w7kD51hNBc-MHPG_1CP8lS1g-hmGZrS8V7puXu_EiLT7ehnK2rG6-7mM52zBW9X1S4wm3RQFt3-FZUIfQ5Lm6WkqIfUJpgatxTpJ0CUzhMx3mrK2uHBDrDF5mQ7ljoaHHm718EtW2YsSpqFZrFLIHrsbSwdMKgio7FddfAiDXR-S7Y3SlZkSNcZgSnXaDGI3-3vSlRwiKY-noJyKY3_3ZvE",
                        }}
                        style={{ width: 64, height: 64, borderRadius: 32 }}
                        resizeMode="cover"
                    />
                </View>

                <View className="flex-col items-center mt-6">
                    <View className="flex-row items-center">
                        <Text className="text-slate-700 font-bold text-[22px]">Together for</Text>
                        <Text className="text-rose-500 font-bold text-[22px]"> {daysTogether} </Text>
                        <Text className="text-slate-700 font-bold text-[22px]">days</Text>
                    </View>

                    <View className="flex-row items-center mt-2">
                        <Text className="text-slate-500 font-normal text-[16px]">
                            Since {formattedDate}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}