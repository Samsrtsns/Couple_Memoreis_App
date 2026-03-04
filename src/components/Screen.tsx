import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Screen({ children }: { children: React.ReactNode }) {
    return (
        <SafeAreaView className="bg-bgLight flex-1" >
            <View className="flex-1 bg-bgLight">{children}</View>
        </SafeAreaView>
    );
}