import PrimaryButton from "@/src/components/PrimaryButton";
import Screen from "@/src/components/Screen";
import { router } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

export default function OnboardingScreen() {
    return (
        <Screen>
            <View className="flex-1 bg-bgLight">
                {/* Top Action Bar */}
                <View className="px-6 pt-6 pb-2 flex-row justify-end">
                    <Pressable onPress={() => router.replace("/(auth)/login")}>
                        <Text className="text-primary/80 font-bold text-base">Skip</Text>
                    </Pressable>
                </View>

                {/* Hero Illustration Container */}
                <View className="flex-1 px-6 items-center juastify-center">
                    <View className="w-full max-w-[390px] aspect-square max-h-80 rounded-2xl overflow-hidden bg-primary/5 relative">
                        {/* gradient overlay */}
                        <View className="absolute inset-0">
                            <View className="absolute inset-0 bg-primary/10" />
                            {/* basit gradient hissi için 2 katman */}
                            <View className="absolute inset-0 bg-primary/5" />
                        </View>

                        {/* Image */}
                        <Image
                            source={{
                                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_4N3dUGZla0afQAVWe0Kbi2j398nZAumlnZbj7VGhXfk-WoLVhjPPYC42vgMgJCXdUQlb1lcy1lccrLUPrfLO64XKZdu_j3dIANEMFD-7kVR5DcowcOBQOIpvopCVtjYdmvMPNirdhKSnpb0jM8mAJ3KJJZeSITcucm0M2efsOdH9xMn_q3cz94IwVxq92OxaffP2n_pWXGGefsI6m5Uxu0Vr9yg8EwO5M-wzxIrYTELQ6mz5NL3hQ6naTtq-4BUXPdkJBRd4-h8",
                            }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    </View>
                </View>

                {/* Text Content Area */}
                <View className="px-8 pt-4 pb-8 items-center">
                    <Text className="text-bgDark text-4xl font-bold tracking-tight text-center">
                        Save Every Moment
                    </Text>
                    <Text className="text-slate400 text-lg font-medium text-center mt-4 leading-6">
                        Create a shared space to store your photos, track special dates, and
                        map your journey together.
                    </Text>
                </View>

                {/* Interaction Area */}
                <View className="px-8 pb-10">
                    {/* Eğer PrimaryButton’un tasarımı zaten varsa bunu kullan */}
                    <PrimaryButton
                        title="Get Started"
                        onPress={() => router.replace("/(auth)/login")}
                    />


                </View>
            </View>
        </Screen>
    );
}