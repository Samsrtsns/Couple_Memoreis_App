import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
    const renderLabel = (label: string) => ({ focused, color }: { focused: boolean; color: string }) => (
        <Text style={{ color, fontSize: 12, fontWeight: focused ? "700" : "400" }}>
            {label}
        </Text>
    );

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#ea5385",
                tabBarInactiveTintColor: "#94a3b8",

            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Ana Ekran",
                    tabBarLabel: renderLabel("Ana Ekran"),
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="memory"
                options={{
                    title: " Anılar",
                    tabBarLabel: renderLabel("Anılar"),
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons name={focused ? "images" : "images-outline"} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: "Harita",
                    tabBarLabel: renderLabel("Harita"),
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons name={focused ? "map" : "map-outline"} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profil",
                    tabBarLabel: renderLabel("Profil"),
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}