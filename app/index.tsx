import { router } from "expo-router";
import React, { useEffect } from "react";
import { Image, Text, View } from "react-native";

export default function Index() {
    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace("/(onboarding)/onboarding");
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View className="flex-1 bg-bgLight px-6 py-6 justify-between">
            <View className="flex-1 items-center justify-center">
                <View className="w-40 h-40 items-center justify-center">
                    <Image
                        source={require("../assets/icons/Connect.png")}
                        className="w-[140px] h-[140px]"
                        resizeMode="contain"
                    />

                    <Image
                        source={require("../assets/icons/Heart.png")}
                        className="absolute w-[50px] h-[50px]"
                        resizeMode="contain"
                    />
                </View>

                <Text className="text-[32px] font-bold text-bgDark mt-2">
                    Couple Memory
                </Text>

            </View>
        </View>
    );
}