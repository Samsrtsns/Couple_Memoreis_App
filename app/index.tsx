import { router } from "expo-router";
import React, { useEffect } from "react";
import { Image, Text, View } from "react-native";

export default function Index() {
    useEffect(() => {

        const timer = setTimeout(goNext, 2000)

        return () => clearTimeout(timer)

    }, [])

    function goNext() {
        router.replace("/(onboarding)/onboarding")
    }

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

                <Text className="text-[32px] font-bold text-bgDark">
                    Couple Memory
                </Text>

            </View>

        </View>
    );
}