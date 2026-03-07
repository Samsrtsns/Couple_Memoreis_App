import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface PrimaryButtonProps {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary";
    disabled?: boolean;
}

export default function PrimaryButton({
    title,
    onPress,
    variant = "primary",
    disabled = false,
}: PrimaryButtonProps) {
    const isPrimary = variant === "primary";

    if (isPrimary) {
        return (
            <Pressable
                disabled={disabled}
                onPress={onPress}
                className={`h-14 rounded-2xl overflow-hidden ${disabled ? "opacity-50" : "opacity-100"
                    }`}
            >
                <LinearGradient
                    colors={["#FF9B8E", "#FF7F6E", "#E65D4F"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                >
                    <View className="flex-row items-center gap-x-2">
                        <Text className="text-white font-bold text-base">{title}</Text>
                    </View>
                </LinearGradient>
            </Pressable>
        );
    }

    return (
        <Pressable
            onPress={onPress}
            className="h-14 rounded-2xl border border-primary items-center justify-center"
        >
            <Text className="text-primary font-semibold text-base">{title}</Text>
        </Pressable>
    );
}