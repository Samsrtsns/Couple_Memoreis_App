import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Dimensions, Text, View } from "react-native";
import { calculateDaysRemaining } from "../utils/dateUtils";

const { width } = Dimensions.get("window");
const CARD_WIDTH = Math.max(Math.floor(width * 0.22), 140);
const CARD_HEIGHT = CARD_WIDTH; // kare kart

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
            className="bg-bgLight bg-shadow-lg shadow-slate-200"
            style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                borderRadius: 20,
                marginRight: 14,
                padding: 16,
                shadowOpacity: 0.08,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
                justifyContent: "space-between",
            }}
        >
            <View style={{ alignItems: "center" }}>
                <View
                    style={{
                        width: 108,
                        height: 58,
                        borderRadius: 14,
                        backgroundColor: "#FFE4E6",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Ionicons name={iconName} size={28} color="#F43F5E" />
                </View>
            </View>

            <View>
                <Text
                    numberOfLines={1}
                    style={{
                        color: "#334155",
                        fontWeight: "700",
                        fontSize: 14,
                        lineHeight: 19,
                        marginBottom: 4,
                    }}
                >
                    {title}
                </Text>
                <Text
                    style={{
                        color: "#F43F5E",
                        fontWeight: "600",
                        fontSize: 13,
                    }}
                >
                    {remainingDays === 0 ? "🎉 Today!" : `${remainingDays} days left`}
                </Text>
            </View>
        </View>
    );
}