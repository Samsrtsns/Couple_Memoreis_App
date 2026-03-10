import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";

type Props = {
    visible: boolean;
    onClose: () => void;
    onSave: (data: { title: string; comment: string }) => void;
    locationName?: string;
};

export default function AddPlaceModal({ visible, onClose, onSave, locationName }: Props) {
    const [title, setTitle] = useState(locationName || "");
    const [comment, setComment] = useState("");

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({ title: title.trim(), comment: comment.trim() });
        setTitle("");
        setComment("");
    };

    const handleClose = () => {
        setTitle("");
        setComment("");
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <Pressable
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
                onPress={handleClose}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
            >
                <View
                    style={{
                        backgroundColor: "#fff",
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        padding: 24,
                        paddingBottom: 40,
                        shadowColor: "#000",
                        shadowOpacity: 0.2,
                        shadowRadius: 20,
                        shadowOffset: { width: 0, height: -6 },
                        elevation: 20,
                    }}
                >
                    {/* Handle */}
                    <View style={{ alignItems: "center", marginBottom: 20 }}>
                        <View
                            style={{
                                width: 36,
                                height: 4,
                                backgroundColor: "#E2E8F0",
                                borderRadius: 2,
                            }}
                        />
                    </View>

                    {/* Header */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24, gap: 10 }}>
                        <View
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                backgroundColor: "#FFF1F2",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Ionicons name="add-circle" size={22} color="#F43F5E" />
                        </View>
                        <View>
                            <Text style={{ fontSize: 18, fontWeight: "800", color: "#1E293B" }}>
                                Save This Place
                            </Text>
                            <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>
                                Add it to your shared memory map
                            </Text>
                        </View>
                    </View>

                    {/* Place Name */}
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#64748B", marginBottom: 8, letterSpacing: 0.5 }}>
                        PLACE NAME
                    </Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Our First Coffee Date ☕"
                        placeholderTextColor="#CBD5E1"
                        style={{
                            backgroundColor: "#F8FAFC",
                            borderRadius: 14,
                            padding: 14,
                            fontSize: 15,
                            color: "#1E293B",
                            borderWidth: 1.5,
                            borderColor: title ? "#F43F5E" : "#E2E8F0",
                            marginBottom: 16,
                        }}
                    />

                    {/* Memory Note */}
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#64748B", marginBottom: 8, letterSpacing: 0.5 }}>
                        YOUR MEMORY NOTE
                    </Text>
                    <TextInput
                        value={comment}
                        onChangeText={setComment}
                        placeholder="What made this place special?"
                        placeholderTextColor="#CBD5E1"
                        multiline
                        numberOfLines={3}
                        style={{
                            backgroundColor: "#F8FAFC",
                            borderRadius: 14,
                            padding: 14,
                            fontSize: 15,
                            color: "#1E293B",
                            borderWidth: 1.5,
                            borderColor: comment ? "#F43F5E" : "#E2E8F0",
                            textAlignVertical: "top",
                            minHeight: 88,
                            marginBottom: 24,
                        }}
                    />

                    {/* Actions */}
                    <View style={{ flexDirection: "row", gap: 12 }}>
                        <Pressable
                            onPress={handleClose}
                            style={{
                                flex: 1,
                                backgroundColor: "#F1F5F9",
                                borderRadius: 16,
                                paddingVertical: 15,
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ color: "#64748B", fontWeight: "700", fontSize: 15 }}>Cancel</Text>
                        </Pressable>

                        <Pressable
                            onPress={handleSave}
                            style={{
                                flex: 2,
                                backgroundColor: title.trim() ? "#F43F5E" : "#FDA4AF",
                                borderRadius: 16,
                                paddingVertical: 15,
                                alignItems: "center",
                                flexDirection: "row",
                                justifyContent: "center",
                                gap: 8,
                            }}
                        >
                            <Ionicons name="heart" size={16} color="#fff" />
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Save Memory</Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
