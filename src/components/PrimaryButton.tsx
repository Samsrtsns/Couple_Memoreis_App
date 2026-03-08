import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, Keyboard, Modal, Pressable, Text, View } from "react-native";

interface PrimaryButtonProps {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary";
    disabled?: boolean;
    loading?: boolean;
}

export default function PrimaryButton({
    title,
    onPress,
    variant = "primary",
    disabled = false,
    loading = false,
}: PrimaryButtonProps) {
    const isPrimary = variant === "primary";

    const handlePress = () => {
        Keyboard.dismiss();
        onPress();
    };

    const renderContent = () => (
        <>
            {isPrimary ? (
                <Pressable
                    disabled={disabled || loading}
                    onPress={handlePress}
                    className={`h-14 rounded-2xl overflow-hidden ${(disabled || loading) ? "opacity-70" : "opacity-100"
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
            ) : (
                <Pressable
                    disabled={disabled || loading}
                    onPress={handlePress}
                    className={`h-14 rounded-2xl border border-primary items-center justify-center ${(disabled || loading) ? "opacity-50" : "opacity-100"}`}
                >
                    <View className="flex-row items-center gap-x-2">
                        <Text className="text-primary font-semibold text-base">{title}</Text>
                    </View>
                </Pressable>
            )}

            {loading && (
                <Modal transparent visible={loading} animationType="fade">
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#FF7F6E" />
                    </View>
                </Modal>
            )}
        </>
    );

    return renderContent();
}