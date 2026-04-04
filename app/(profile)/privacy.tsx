import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, SafeAreaView, Pressable } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
    const [policy, setPolicy] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchPolicy = async () => {
        setLoading(true);
        setError(false);
        try {
            const { data, error: fetchError } = await supabase
                .from('legal_documents')
                .select('content')
                .eq('type', 'privacy_policy')
                .limit(1)
                .single();

            if (fetchError) throw fetchError;
            if (data) {
                setPolicy(data.content);
            }
        } catch (e) {
            console.error('Error fetching privacy policy:', e);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicy();
    }, []);

    if (loading) {
        return (
            <View className="flex-1 bg-[#FDF8F7] items-center justify-center">
                <ActivityIndicator size="large" color="#ea5385" />
                <Text className="mt-4 text-slate-400 font-medium tracking-wide">Loading Privacy Policy...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 bg-[#FDF8F7] items-center justify-center px-8">
                <View className="w-16 h-16 bg-rose-50 rounded-full items-center justify-center mb-4">
                    <Ionicons name="warning-outline" size={32} color="#F43F5E" />
                </View>
                <Text className="text-slate-800 text-lg font-bold text-center">Connection Error</Text>
                <Text className="text-slate-500 text-center mt-2 leading-5">
                    Unable to load privacy policy. Please check your connection and try again.
                </Text>
                <Pressable 
                    onPress={fetchPolicy}
                    className="mt-8 bg-rose-500 px-8 py-3 rounded-full active:opacity-80"
                >
                    <Text className="text-white font-bold">Retry</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#FDF8F7]">
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
            >
                <Text className="text-slate-700 text-base leading-6 tracking-wide">
                    {policy || 'No policy content available.'}
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
