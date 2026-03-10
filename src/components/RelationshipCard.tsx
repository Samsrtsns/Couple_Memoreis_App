import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { calculateDaysTogether } from "../utils/dateUtils";
import ProfileAvatar from "./ProfileAvatar";

type Props = {
    relationshipStartDate?: string | null;
};

export default function RelationshipCard({ relationshipStartDate }: Props) {
    const { state } = useAuth();
    const { profile, partner } = state;

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
        <View className="px-6 bg-bgLight">
            <View
                className="flex-col w-full items-center mt-6 p-6 bg-bgLight shadow-lg shadow-slate-200"
                style={{
                    borderRadius: 24,
                }}
            >
                <View className="flex-row items-center gap-x-6 ">
                    <ProfileAvatar
                        url={profile?.avatar_url}
                        size={104}
                        style={{ borderWidth: 3, borderColor: "#fff" }}
                    />

                    <Ionicons name="heart" size={52} color="#FF8A8A" />

                    <ProfileAvatar
                        url={partner?.avatar_url}
                        size={104}
                        style={{ borderWidth: 3, borderColor: "#fff" }}
                    />
                </View>

                <View className="flex-col items-start w-full mt-6 px-1">
                    <Text className="text-slate-900 font-bold text-[20px] text-left leading-8">
                        {partner?.first_name ? `${partner.first_name} ile ` : ""}
                        <Text className="text-primary font-bold text-[22px]">{daysTogether}</Text>
                        {" gündür birliktesiniz."}
                    </Text>

                    <View className="mt-1">
                        <Text className="text-left text-slate-500 font-semibold text-[16px]">
                            {formattedDate} tarihinden beri.
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}