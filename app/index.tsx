import { useInitialState } from "@/src/hooks/useInitialState";
import React from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";

export default function Index() {
    const { isChecking } = useInitialState();

    return (
        <View className="flex-1 bg-bgLight items-center justify-center">
            {/* Logo */}
            <View className="items-center justify-center">

                <View className="w-40 h-40 items-center justify-center">
                    <Image
                        source={require("../assets/icons/Connect.png")}
                        style={{ width: 120, height: 120 }}
                        resizeMode="contain"
                    />

                    <Image
                        source={require("../assets/icons/Heart.png")}
                        style={{
                            position: "absolute",
                            width: 40,
                            height: 40
                        }}
                        resizeMode="contain"
                    />
                </View>

                <Text className="text-[32px] font-bold text-bgDark mb-8">
                    Couple Memory
                </Text>

                {isChecking && (
                    <ActivityIndicator size="large" color="#FF7F6E" />
                )}
            </View>
        </View>
    );
}