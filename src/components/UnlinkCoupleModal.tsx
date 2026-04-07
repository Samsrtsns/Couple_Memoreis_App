import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    Text,
    View,
} from 'react-native';

type Props = {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
};

export function UnlinkCoupleModal({ visible, onClose, onConfirm, loading }: Props) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={loading ? undefined : onClose}
        >
            <Pressable
                className="flex-1 bg-black/50 justify-center px-6"
                onPress={loading ? undefined : onClose}
            >
                <Pressable
                    className="bg-white rounded-3xl p-6 border border-slate-100"
                    onPress={(e) => e.stopPropagation()}
                >
                    <View className="items-center mb-4">
                        <View className="w-14 h-14 rounded-full bg-rose-100 items-center justify-center mb-3">
                            <Ionicons name="unlink-outline" size={28} color="#E11D48" />
                        </View>
                        <Text className="text-slate-900 font-extrabold text-lg text-center">
                            Partner bağlantısını kaldır
                        </Text>
                    </View>

                    <Text className="text-slate-600 text-[15px] leading-6 mb-2">
                        Bu işlem <Text className="font-bold text-rose-600">geri alınamaz</Text>.
                        Onaylarsanız:
                    </Text>
                    <View className="gap-y-2 mb-6">
                        <Text className="text-slate-600 text-sm leading-5">
                            • İkinizin de eşleşmesi sona erer ve yeni davet kodları alırsınız.
                        </Text>
                        <Text className="text-slate-600 text-sm leading-5">
                            • Ortak anılar, paylaşılan yerler ve özel günler kalıcı olarak silinir.
                        </Text>
                    </View>

                    <View className="flex-row gap-3">
                        <Pressable
                            onPress={onClose}
                            disabled={loading}
                            className="flex-1 h-12 rounded-2xl border border-slate-200 items-center justify-center bg-slate-50"
                        >
                            <Text className="text-slate-700 font-bold">Vazgeç</Text>
                        </Pressable>
                        <Pressable
                            onPress={onConfirm}
                            disabled={loading}
                            className="flex-1 h-12 rounded-2xl bg-rose-600 items-center justify-center opacity-100 disabled:opacity-50"
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-white font-bold">Bağlantıyı kaldır</Text>
                            )}
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
