import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
    Dimensions,
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    Text,
    View,
} from "react-native";
import Animated, {
    Extrapolate,
    FadeInLeft,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    type SharedValue
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import LottieView from "lottie-react-native";

const { width, height } = Dimensions.get("window");

const onboardingData = [
    {
        id: "1",
        title: "İlişkiniz Hakkında",
        subtitle: "Sevginizin ne zamandır sürdüğünü görün. Özel günlerinizi görün, ekleyin, düzenleyin.",
        lottie: require("../../assets/lottie/onboarding_couple.json"),
        color: "#FFF5F4",
        isLocal: true
    },
    {
        id: "2",
        title: "Zaman Tüneli",
        subtitle: "En sevdiğiniz anılarınızı zaman tüneline ekleyin. Her buluşmanız için bir anı oluşturun.",
        lottie: require("../../assets/lottie/onboarding_couple2.json"),
        color: "#F4F7FF",
        isLocal: true
    },
    {
        id: "3",
        title: "Konumlarımız",
        subtitle: "Gittiğiniz her yeri haritada görüntüleyin her bir konum için bir anı oluşturun.",
        lottie: require("../../assets/lottie/onboarding_couple3.json"),
        color: "#FDF4FF",
        isLocal: true
    },
];


export default function OnboardingScreen() {
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useSharedValue(0);

    const onScroll = useAnimatedScrollHandler((event) => {
        scrollX.value = event.contentOffset.x;
    });

    const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
            {/* Header / Skip */}
            <View className="absolute top-14 left-0 right-0 z-10 px-6 flex-row justify-end items-center">
                {currentIndex < onboardingData.length - 1 && (
                    <Pressable onPress={handleSkip} className="px-4 py-2 rounded-full bg-slate-100">
                        <Text className="text-slate-500 text-sm font-semibold">Atla</Text>
                    </Pressable>
                )}
            </View>

            {/* Slides */}
            <Animated.FlatList
                ref={flatListRef as any}
                data={onboardingData}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                onMomentumScrollEnd={onScrollEnd}
                scrollEventThrottle={16}
                renderItem={({ item, index }) => {
                    return (
                        <View style={{ width }} className="flex-1 items-start justify-center pt-20">
                            {/* Lottie Container with background shape */}
                            <View className="relative w-full aspect-square items-center justify-center px-4">
                                <View 
                                    className="absolute w-[85%] aspect-square rounded-[60px] opacity-20"
                                    style={{ backgroundColor: item.color, transform: [{ rotate: '15deg' }] }}
                                />
                                <LottieView
                                    source={item.isLocal ? item.lottie : { uri: item.lottie as string }}
                                    autoPlay
                                    loop
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                    }}
                                />
                            </View>

                            {/* Text Content */}
                            <Animated.View 
                                entering={FadeInLeft.delay(300).duration(1000).springify()}
                                className="px-8 mt-10 items-start"
                            >
                                <Text 
                                    className="text-[34px] leading-tight text-slate-900 text-left"
                                    style={{ fontFamily: 'InterBlack' }}
                                >
                                    {item.title}
                                </Text>

                                <Text className="text-[17px] text-slate-500 text-left mt-4 leading-relaxed">
                                    {item.subtitle}
                                </Text>
                            </Animated.View>
                        </View>
                    );
                }}
            />

            {/* Bottom Actions */}
            <View className="px-6 pb-14 mt-auto">
                {/* Custom Pagination Dots */}
                <View className="flex-row justify-center items-center mb-10 gap-x-3">
                    {onboardingData.map((_, index) => {
                        return (
                            <PaginationDot 
                                key={index} 
                                index={index} 
                                scrollX={scrollX} 
                            />
                        );
                    })}
                </View>

                {/* Primary Button */}
                <Pressable
                    onPress={handleNext}
                    className="h-16 rounded-[24px] overflow-hidden shadow-xl shadow-red-200"
                >
                    <LinearGradient
                        colors={["#FF9B8E", "#FF7F6E", "#E65D4F"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Text
                            className="text-white text-xl mr-2"
                            style={{
                                fontFamily: 'InterBlack',
                                textAlign: 'center',
                                textAlignVertical: 'center',
                                includeFontPadding: false
                            }}
                        >
                            {currentIndex === onboardingData.length - 1
                                ? "Başlayalım"
                                : "İleri"}
                        </Text>
                        <Text
                            className="text-white text-xl"
                            style={{
                                textAlignVertical: 'center',
                                includeFontPadding: false
                            }}
                        >
                            ✨
                        </Text>
                    </LinearGradient>
                </Pressable>

            </View>
        </View>
    );
}

const PaginationDot = ({ index, scrollX }: { index: number, scrollX: SharedValue<number> }) => {
    const animatedStyle = useAnimatedStyle(() => {
        const input = [
            (index - 1) * width,
            index * width,
            (index + 1) * width
        ];

        const dotWidth = interpolate(
            scrollX.value,
            input,
            [10, 32, 10],
            Extrapolate.CLAMP
        );

        const opacity = interpolate(
            scrollX.value,
            input,
            [0.3, 1, 0.3],
            Extrapolate.CLAMP
        );
        
        const backgroundColor = interpolate(
            scrollX.value,
            input,
            [0.3, 1, 0.3],
            Extrapolate.CLAMP
        ) > 0.5 ? '#FF7F6E' : '#E2E8F0';

        return {
            width: dotWidth,
            opacity: opacity,
            backgroundColor: backgroundColor
        };
    });

    return (
        <Animated.View 
            className="h-3 rounded-full"
            style={animatedStyle}
        />
    );
}