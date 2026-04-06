import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function DataManagementScreen() {
    return (
        <View className="flex-1 bg-[#FDF8F7]">
            <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 12 }}>
                <Text className="text-slate-500 text-sm">
                    Verilerinizi yönetin, yedek alın veya hesabınızı kalıcı olarak silin.
                </Text>
                
                <View className="mt-8 bg-white rounded-2xl p-6 border border-slate-100 items-center justify-center min-h-[200px]">
                    <Text className="text-slate-400 font-medium">Yakında...</Text>
                </View>
            </ScrollView>
        </View>
    );
}
