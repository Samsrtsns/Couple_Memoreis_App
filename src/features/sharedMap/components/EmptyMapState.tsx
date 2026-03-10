/**
 * EmptyMapState — shown when the user has no shared places yet.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
    noPartner?: boolean;
};

export default function EmptyMapState({ noPartner = false }: Props) {
    return (
        <View style={styles.container}>
            {/* Icon */}
            <View style={styles.iconWrapper}>
                <Ionicons
                    name={noPartner ? 'people-outline' : 'map-outline'}
                    size={48}
                    color="#F43F5E"
                />
            </View>

            {/* Title */}
            <Text style={styles.title}>
                {noPartner ? 'No Partner Yet' : 'No Places Yet'}
            </Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
                {noPartner
                    ? 'Connect with your partner first to start adding shared memories together.'
                    : 'Tap the button below to add your first shared memory to the map. 💕'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: '30%',
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 40,
        pointerEvents: 'none',
    },
    iconWrapper: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#FFF1F2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#F43F5E',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 22,
    },
});
