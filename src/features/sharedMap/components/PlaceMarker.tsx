/**
 * PlaceMarker — map marker for a shared place.
 *
 * Key pattern for tracksViewChanges:
 * React Native Maps only re-renders the native marker image when
 * tracksViewChanges === true. If we flip it to false at the same
 * time as isSelected changes, the deselected appearance never renders.
 *
 * Fix: keep tracksViewChanges=true for a short window after any
 * isSelected change, then flip to false to stop tracking.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import type { SharedPlace } from '../types/sharedPlace.types';

type Props = {
    place: SharedPlace;
    isSelected: boolean;
    onPress: (place: SharedPlace) => void;
};

function PlaceMarker({ place, isSelected, onPress }: Props) {
    // Keep tracksViewChanges true long enough for the view to update,
    // then stop tracking to avoid unnecessary renders.
    const [tracksViews, setTracksViews] = useState(true);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Any time isSelected changes, enable tracking and start a timer
        // to disable it after the view has had time to update.
        setTracksViews(true);
        timerRef.current && clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setTracksViews(false);
        }, 300);

        return () => {
            timerRef.current && clearTimeout(timerRef.current);
        };
    }, [isSelected]);

    return (
        <Marker
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            onPress={() => onPress(place)}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={tracksViews}
        >
            <View style={styles.wrapper}>
                {/* Pin bubble */}
                <View
                    style={[
                        styles.bubble,
                        isSelected && styles.bubbleSelected,
                    ]}
                >
                    <Ionicons
                        name="heart"
                        size={isSelected ? 22 : 18}
                        color={isSelected ? '#fff' : '#F43F5E'}
                    />
                </View>

                {/* Tail */}
                <View
                    style={[
                        styles.tail,
                        isSelected && styles.tailSelected,
                    ]}
                />

                {/* Label shown only when selected */}
                {isSelected && (
                    <View style={styles.label}>
                        <Text style={styles.labelText} numberOfLines={1}>
                            {place.title}
                        </Text>
                    </View>
                )}
            </View>
        </Marker>
    );
}

export default memo(PlaceMarker);

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
    },
    bubble: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#F43F5E',
    },
    bubbleSelected: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F43F5E',
    },
    tail: {
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#fff',
        marginTop: -2,
    },
    tailSelected: {
        borderTopColor: '#F43F5E',
    },
    label: {
        backgroundColor: '#F43F5E',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginTop: 4,
        maxWidth: 120,
    },
    labelText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
});
