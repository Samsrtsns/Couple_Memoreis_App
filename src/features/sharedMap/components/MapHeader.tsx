/**
 * MapHeader — top navigation bar for the Shared Places Map screen.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    placesCount: number;
    mapStyle: 'standard' | 'satellite';
    onToggleMapStyle: () => void;
};

export default function MapHeader({ placesCount, mapStyle, onToggleMapStyle }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
            {/* Left: title + count badge */}
            <View style={styles.left}>
                <View style={styles.iconBadge}>
                    <Ionicons name="heart" size={18} color="#F43F5E" />
                </View>
                <Text style={styles.title}>Our Places</Text>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{placesCount}</Text>
                </View>
            </View>

            {/* Right: map style toggle */}
            <TouchableOpacity
                onPress={onToggleMapStyle}
                style={styles.actionButton}
                activeOpacity={0.75}
                accessibilityLabel="Toggle map style"
            >
                <Ionicons
                    name={mapStyle === 'standard' ? 'globe-outline' : 'map-outline'}
                    size={18}
                    color="#F43F5E"
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 12,
        paddingHorizontal: 20,
        backgroundColor: '#FDF8F7',
        borderBottomWidth: 1,
        borderBottomColor: '#F1EEF0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconBadge: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: '#FFF1F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.3,
    },
    countBadge: {
        backgroundColor: '#FFE4E6',
        borderRadius: 10,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    countText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#F43F5E',
    },
    actionButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#FFF1F2',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FDA4AF',
    },
});
