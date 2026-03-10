/**
 * MemoriesEmptyState Component
 *
 * Displayed when:
 * - User has no partner (variant: 'no-partner')
 * - User has a partner but no memories yet (variant: 'no-memories')
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
    variant: 'no-partner' | 'no-memories';
    onAddMemory?: () => void;
};

export function MemoriesEmptyState({ variant, onAddMemory }: Props) {
    const isNoPartner = variant === 'no-partner';

    return (
        <View style={styles.container}>
            {/* Icon */}
            <View style={styles.iconWrap}>
                <Ionicons
                    name={isNoPartner ? 'people-outline' : 'images-outline'}
                    size={60}
                    color="#f48fb1"
                />
            </View>

            {/* Text */}
            <Text style={styles.title}>
                {isNoPartner ? 'Not matched yet 💔' : 'No memories yet 💝'}
            </Text>
            <Text style={styles.subtitle}>
                {isNoPartner
                    ? 'You need to match with your partner before creating shared memories.'
                    : 'Start building your story. Create your first shared memory together.'}
            </Text>

            {/* CTA */}
            {!isNoPartner && onAddMemory && (
                <TouchableOpacity style={styles.btn} onPress={onAddMemory} activeOpacity={0.85}>
                    <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.btnText}>Add First Memory</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingBottom: 60,
        gap: 12,
    },
    iconWrap: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#fde8f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2d1020',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#9e6070',
        textAlign: 'center',
        lineHeight: 22,
    },
    btn: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e91e8c',
        borderRadius: 28,
        paddingVertical: 14,
        paddingHorizontal: 28,
        shadowColor: '#e91e8c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 4,
    },
    btnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});
