import { Stack, router, Redirect } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';

export default function ProfileLayout() {
    const { state } = useAuth();

    // Oturum kapandıysa veya hesap silindiyse direkt Login ekranına fırlat
    if (state.isInitialized && !state.isLoggedIn) {
        return <Redirect href="/(auth)/login" />;
    }

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
            <Stack.Screen name="personal-info" options={{ title: 'Kişisel Bilgiler' }} />
            <Stack.Screen name="relationship" options={{ title: 'İlişki Ayarları' }} />
            <Stack.Screen name="plan-limits" options={{ title: 'Plan ve Limitler' }} />
            <Stack.Screen name="notifications" options={{ title: 'Bildirimler' }} />
            <Stack.Screen name="data-management" options={{ title: 'Veri Yönetimi' }} />
            <Stack.Screen name="privacy" options={{ title: 'Gizlilik Politikası' }} />
        </Stack>
    );
}
