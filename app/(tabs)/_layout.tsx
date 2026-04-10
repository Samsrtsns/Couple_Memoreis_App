import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs, Redirect } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/context/AuthContext";

const TAB_ICONS: Record<
    string,
    {
        active: keyof typeof Ionicons.glyphMap;
        inactive: keyof typeof Ionicons.glyphMap;
    }
> = {
    home: { active: "home", inactive: "home-outline" },
    memory: { active: "images", inactive: "images-outline" },
    map: { active: "map", inactive: "map-outline" },
    profile: { active: "person", inactive: "person-outline" },
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={{
                position: "absolute",
                bottom: Math.max(insets.bottom, 16),
                left: 24,
                right: 24,
                backgroundColor: "#FFFFFF",
                borderRadius: 32,
                height: 68,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-evenly",
                paddingHorizontal: 12,
                ...Platform.select({
                    ios: {
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.1,
                        shadowRadius: 28,
                    },
                    android: {
                        elevation: 12,
                    },
                }),
            }}
        >
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const icons = TAB_ICONS[route.name] || {
                    active: "ellipse",
                    inactive: "ellipse-outline",
                };

                const onPress = () => {
                    const event = navigation.emit({
                        type: "tabPress",
                        target: route.key,
                        canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: "tabLongPress",
                        target: route.key,
                    });
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        activeOpacity={0.7}
                        style={{
                            alignItems: "center",
                            justifyContent: "center",
                            width: 52,
                            height: 52,
                            borderRadius: 26,
                            backgroundColor: isFocused ? "#F43F5E" : "transparent",
                        }}
                    >
                        <Ionicons
                            name={isFocused ? icons.active : icons.inactive}
                            size={24}
                            color={isFocused ? "#FFFFFF" : "#94A3B8"}
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export default function TabsLayout() {
    const { t } = useTranslation();
    const { state } = useAuth();

    // Oturum kapandıysa veya hesap silindiyse direkt Login ekranına fırlat
    // Misafir modundaki kullanıcılar geçebilsin
    if (state.isInitialized && !state.isLoggedIn && !state.isGuest) {
        return <Redirect href="/(auth)/login" />;
    }

    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen name="home" options={{ title: t("tabs.home") }} />
            <Tabs.Screen name="memory" options={{ title: t("tabs.memory") }} />
            <Tabs.Screen name="map" options={{ title: t("tabs.map") }} />
            <Tabs.Screen name="profile" options={{ title: t("tabs.profile") }} />
        </Tabs>
    );
}