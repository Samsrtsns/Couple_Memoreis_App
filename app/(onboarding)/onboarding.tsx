import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    Text,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

const onboardingData = [
    {
        id: "1",
        title: "Memories Together",
        subtitle:
            "Save your best moments with your partner in one private place.",
        image:
            "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800",
    },
    {
        id: "2",
        title: "Track Special Days",
        subtitle:
            "Never forget anniversaries, birthdays, and meaningful dates.",
        image:
            "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
    },
    {
        id: "3",
        title: "Plan Your Future",
        subtitle:
            "Create shared plans, goals, and beautiful memories together.",
        image:
            "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800",
    },
];

export default function OnboardingScreen() {
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        setCurrentIndex(index);
    };

    const handleNext = () => {
        if (currentIndex < onboardingData.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            handleSkip();
        }
    };

    const handleSkip = async () => {
        try {
            await AsyncStorage.setItem("hasLaunched", "true");
            router.replace("/(auth)/login");
        } catch (error) {
            console.error("Error setting hasLaunched flag", error);
            router.replace("/(auth)/login");
        }
    };

    return (
        <View className="flex-1 bg-white">
            {/* Skip */}
            <View className="px-6 mt-20 items-end">
                <Pressable onPress={handleSkip}>
                    <Text className="text-slate-500 text-base font-medium">Skip</Text>
                </Pressable>
            </View>

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={onboardingData}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onScrollEnd}
                renderItem={({ item }) => (
                    <View style={{ width }} className="flex-1 px-6 items-center">
                        <View className="flex-1 items-center justify-center ">
                            <Image
                                source={{ uri: item.image }}
                                resizeMode="contain"
                                className="w-[380px] h-[380px] rounded-xl"
                            />
                        </View>

                        <View className="pb-20 items-center">
                            <Text className="text-3xl font-bold text-slate-900 text-center">
                                {item.title}
                            </Text>

                            <Text className="text-base text-slate-500 text-center mt-4 leading-6 px-4">
                                {item.subtitle}
                            </Text>
                        </View>
                    </View>
                )}
            />

            {/* Bottom */}
            <View className="px-6 pb-10">
                {/* Dots */}
                <View className="flex-row justify-center items-center mb-6 gap-x-2">
                    {onboardingData.map((_, index) => (
                        <View
                            key={index}
                            className={`rounded-full ${currentIndex === index
                                ? "w-6 h-2 bg-[#FF7F6E]"
                                : "w-2 h-2 bg-slate-300"
                                }`}
                        />
                    ))}
                </View>

                {/* Button */}
                <Pressable
                    onPress={handleNext}
                    className="h-14 rounded-2xl overflow-hidden"
                >
                    <LinearGradient
                        colors={["#FF9B8E", "#FF7F6E", "#E65D4F"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Text className="text-white font-bold text-base">
                            {currentIndex === onboardingData.length - 1
                                ? "Get Started"
                                : "Next"}
                        </Text>
                    </LinearGradient>
                </Pressable>
            </View>
        </View>
    );
}