/**
 * MapHeader — top navigation bar for the Shared Places Map screen.
 */

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    placesCount: number;
    mapStyle: 'standard' | 'satellite';
    onToggleMapStyle: () => void;
    onRefresh: () => void;
    refreshing: boolean;
};

export default function MapHeader({
    placesCount,
    onRefresh,
    refreshing,
}: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View
            className="flex-row items-center justify-between border-b border-[#F1EEF0] bg-[#FDF8F7] px-5 pt-5 pb-4"
        >
            <View className="flex-row items-center gap-2">
                <Text className="text-[26px] font-extrabold  text-slate-800">
                    Our Places
                </Text>

                <View className="w-8 h-8 rounded-full bg-rose-100 items-center justify-center">
                    <Text className="text-[12px] font-bold text-rose-500">
                        {placesCount}
                    </Text>
                </View>
            </View>

            <TouchableOpacity 
                onPress={onRefresh}
                disabled={refreshing}
                className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-100"
                style={{ opacity: refreshing ? 0.5 : 1 }}
            >
                <Ionicons name="refresh" size={20} color="#334155" />
            </TouchableOpacity>
        </View>
    );
}