/**
 * MemoryCardSkeleton Component
 *
 * Animated placeholder shown while memories are loading.
 * Mimics the shape of a MemoryCard.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

function Shimmer({ style }: { style?: object }) {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
            ])
        ).start();
    }, [opacity]);

    return <Animated.View style={[styles.shimmerBase, style, { opacity }]} />;
}

export function MemoryCardSkeleton() {
    return (
        <View style={styles.row}>
            {/* Timeline */}
            <View style={styles.timelineCol}>
                <View style={styles.dot} />
                <View style={styles.line} />
            </View>

            {/* Card */}
            <View style={styles.card}>
                <Shimmer style={styles.dateLine} />
                <Shimmer style={styles.titleLine} />
                <Shimmer style={styles.photo} />
                <Shimmer style={styles.descLine} />
                <Shimmer style={[styles.descLine, { width: '60%' }]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 4,
    },
    timelineCol: {
        width: 28,
        alignItems: 'center',
        paddingTop: 6,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#f8bbd9',
    },
    line: {
        flex: 1,
        width: 2,
        backgroundColor: '#fce4ec',
        marginTop: 4,
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginLeft: 12,
        marginBottom: 20,
        gap: 10,
        shadowColor: '#e91e8c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    shimmerBase: {
        backgroundColor: '#fde8f0',
        borderRadius: 8,
    },
    dateLine: {
        height: 12,
        width: '40%',
        borderRadius: 6,
    },
    titleLine: {
        height: 20,
        width: '80%',
        borderRadius: 8,
    },
    photo: {
        height: 200,
        borderRadius: 14,
    },
    descLine: {
        height: 12,
        width: '100%',
        borderRadius: 6,
    },
});
