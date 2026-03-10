import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface ProfileAvatarProps {
    url?: string | null;
    size?: number;
    style?: StyleProp<ViewStyle>;
    imageStyle?: StyleProp<ImageStyle>;
    fallbackIconSize?: number;
    loadingPlaceholderColor?: string;
}

export default function ProfileAvatar({
    url,
    size = 120,
    style,
    imageStyle,
    fallbackIconSize,
    loadingPlaceholderColor = '#f1f5f9', // slate-100
}: ProfileAvatarProps) {
    const defaultIconSize = fallbackIconSize || size * 0.5;

    return (
        <View
            style={[
                styles.container,
                { width: size, height: size, borderRadius: size / 2, backgroundColor: loadingPlaceholderColor },
                style
            ]}
        >
            {url ? (
                <Image
                    source={{ uri: url }}
                    style={[styles.image, { width: size, height: size, borderRadius: size / 2 }, imageStyle]}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="disk"
                />
            ) : (
                <View style={[styles.fallbackContainer, { width: size, height: size, borderRadius: size / 2 }]}>
                    <Ionicons name="person" size={defaultIconSize} color="#94a3b8" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    fallbackContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e2e8f0', // slate-200
    },
});
