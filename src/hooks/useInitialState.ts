import { getCurrentSession } from "@/src/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";

export function useInitialState() {
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        checkInitialState();
    }, []);

    const checkInitialState = async () => {
        try {
            // Wait for a brief moment for visual splash
            await new Promise(resolve => setTimeout(resolve, 1500));

            const hasLaunched = await AsyncStorage.getItem("hasLaunched");

            if (hasLaunched === null || hasLaunched === "false") {
                // First launch ever
                router.replace("/(onboarding)/onboarding");
                return;
            }

            // check active session
            const session = await getCurrentSession();

            if (session) {
                router.replace("/(tabs)/home");
            } else {
                router.replace("/(auth)/login");
            }
        } catch (error) {
            console.error("Initial routing error:", error);
            // Default to login on error
            router.replace("/(auth)/login");
        } finally {
            setIsChecking(false);
        }
    };

    return { isChecking };
}
