import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" options={{ gestureEnabled: false }} />
            <Stack.Screen name="register" options={{ gestureEnabled: true }} />
            <Stack.Screen name="google-name" options={{ gestureEnabled: false }} />
            <Stack.Screen name="forgot-password" options={{ gestureEnabled: true }} />
            <Stack.Screen name="reset-password" options={{ gestureEnabled: true }} />
        </Stack>
    );
}
