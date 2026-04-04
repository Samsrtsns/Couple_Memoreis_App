import { Stack, router } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileLayout() {
    return (
        <Stack 
            screenOptions={{ 
                headerBackTitle: '',
                headerStyle: { backgroundColor: '#FDF8F7' },
                headerShadowVisible: false,
                headerTintColor: '#0F172A',
                contentStyle: { backgroundColor: '#FDF8F7' },
                headerLeft: () => (
                    <Pressable 
                        onPress={() => router.back()} 
                        className="flex w-10 h-10 items-center justify-center rounded-full active:bg-slate-100"
                    >
                        <Ionicons name="chevron-back" size={24} color="#0F172A" />
                    </Pressable>
                )
            }}
        >
            <Stack.Screen name="personal-info" options={{ title: 'Personal Info' }} />
            <Stack.Screen name="relationship" options={{ title: 'Relationship Settings' }} />
            <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
            <Stack.Screen name="data-management" options={{ title: 'Data Management' }} />
            <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />
        </Stack>
    );
}
