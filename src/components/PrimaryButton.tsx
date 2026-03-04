import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface PrimaryButtonProps {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary";
}

export default function PrimaryButton({ title, onPress, variant = "primary" }: PrimaryButtonProps) {
    const isPrimary = variant === "primary";

    return (
        <TouchableOpacity
            style={[styles.button, isPrimary ? styles.primaryButton : styles.secondaryButton]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text style={[styles.text, isPrimary ? styles.primaryText : styles.secondaryText]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    primaryButton: {
        backgroundColor: "#ff4d4d",
    },
    secondaryButton: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "#ff4d4d",
    },
    text: {
        fontSize: 16,
        fontWeight: "600",
    },
    primaryText: {
        color: "#ffffff",
    },
    secondaryText: {
        color: "#ff4d4d",
    },
});