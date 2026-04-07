/**
 * MapHeader — top navigation bar for the Shared Places Map screen.
 */

import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
    placesCount: number;
    searchOpen: boolean;
    searchQuery: string;
    onToggleSearch: () => void;
    onChangeSearchQuery: (value: string) => void;
};

export default function MapHeader({
    placesCount,
    searchOpen,
    searchQuery,
    onToggleSearch,
    onChangeSearchQuery,
}: Props) {
    return (
        <View className="border-b border-[#F1EEF0] bg-[#FDF8F7] px-5 pt-5 pb-4">
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                    <Text className="text-[26px] font-extrabold text-slate-800">Konumlarımız</Text>
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-rose-100">
                        <Text className="text-[12px] font-bold text-rose-500">{placesCount}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={onToggleSearch}
                    className="h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50"
                >
                    <Ionicons name={searchOpen ? 'close' : 'search'} size={20} color="#334155" />
                </TouchableOpacity>
            </View>

            {searchOpen && (
                <View className="mt-3 flex-row items-center rounded-2xl border border-rose-200 bg-white px-3 py-2">
                    <Ionicons name="search" size={16} color="#94A3B8" />
                    <TextInput
                        value={searchQuery}
                        onChangeText={onChangeSearchQuery}
                        placeholder="Başlığa göre ara..."
                        placeholderTextColor="#94A3B8"
                        className="ml-2 flex-1 text-[14px] text-slate-800"
                        autoFocus
                        returnKeyType="search"
                    />
                </View>
            )}
        </View>
    );
}