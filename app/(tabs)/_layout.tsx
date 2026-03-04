import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                tabBarLabelStyle: { fontSize: 12 },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Ana",
                    tabBarLabel: "Ana",
                    tabBarIcon: ({ focused }) => (
                        <Text>{focused ? "🏠" : "🏚️"}</Text>
                    ),
                }}
            />
            <Tabs.Screen
                name="memory"
                options={{
                    title: "Memery",
                    tabBarLabel: "Memery",
                    tabBarIcon: ({ focused }) => <Text>{focused ? "🖼️" : "🗂️"}</Text>,
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: "Harita",
                    tabBarLabel: "Harita",
                    tabBarIcon: ({ focused }) => <Text>{focused ? "🗺️" : "📍"}</Text>,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profil",
                    tabBarLabel: "Profil",
                    tabBarIcon: ({ focused }) => <Text>{focused ? "👤" : "🙂"}</Text>,
                }}
            />
        </Tabs>
    );
}