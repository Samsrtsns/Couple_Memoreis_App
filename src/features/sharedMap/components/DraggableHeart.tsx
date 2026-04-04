import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

type Props = {
    onDrop: (x: number, y: number) => void;
    topInset?: number;
};

export default function DraggableHeart({ onDrop, topInset = 0 }: Props) {
    const isDragging = useSharedValue(false);
    const translationX = useSharedValue(0);
    const translationY = useSharedValue(0);

    const gesture = Gesture.Pan()
        .onStart(() => {
            isDragging.value = true;
        })
        .onUpdate((event) => {
            translationX.value = event.translationX;
            translationY.value = event.translationY;
        })
        .onEnd((event) => {
            isDragging.value = false;
            // Get absolute screen position on drop
            // The starting position (16, topInset + 10) + translation
            const dropX = event.absoluteX;
            const dropY = event.absoluteY;
            
            // Run on UI or call JS-side drop handler
            runOnJS(onDrop)(dropX, dropY);

            // Snap back
            translationX.value = withSpring(0);
            translationY.value = withSpring(0);
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translationX.value },
            { translateY: translationY.value },
            { scale: withSpring(isDragging.value ? 1.2 : 1) },
        ],
        opacity: withSpring(isDragging.value ? 0.9 : 1),
    }));

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View
                style={[
                    styles.container,
                    { top: topInset + 10 },
                    animatedStyle,
                ]}
            >
                <View style={styles.heartCircle}>
                    <Ionicons name="heart" size={24} color="#fff" />
                </View>
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        zIndex: 9999,
        // Using shadow only on the inner circle/view to minimize artifacts
    },
    heartCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F43F5E',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#F43F5E',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
});
