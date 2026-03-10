import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SharedPlace } from "../data/placesData";

type Props = {
    place: SharedPlace | null;
    onClose: () => void;
    onToggleFavorite: (id: string) => void;
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

export default function PlaceDetailCard({ place, onClose, onToggleFavorite }: Props) {
    const slideAnim = useRef(new Animated.Value(300)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    // Keeps the last non-null place so the card can animate out with content visible
    const [snapshot, setSnapshot] = useState<SharedPlace | null>(null);

    useEffect(() => {
        if (place) {
            setSnapshot(place);
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 180,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 300,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => setSnapshot(null));
        }
    }, [place]);

    if (!snapshot) return null;

    const data = snapshot;

    return (
        <Animated.View
            style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                opacity: opacityAnim,
                transform: [{ translateY: slideAnim }],
            }}
            pointerEvents={place ? "box-none" : "none"}
        >
            <View
                style={{
                    backgroundColor: "#fff",
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    paddingBottom: 32,
                    shadowColor: "#000",
                    shadowOpacity: 0.15,
                    shadowRadius: 24,
                    shadowOffset: { width: 0, height: -8 },
                    elevation: 20,
                    maxHeight: 480,
                }}
            >
                {/* Drag handle */}
                <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 6 }}>
                    <View
                        style={{
                            width: 36,
                            height: 4,
                            backgroundColor: "#E2E8F0",
                            borderRadius: 2,
                        }}
                    />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
                >
                    {/* Place Image + Close + Heart Row */}
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
                        {/* Thumbnail */}
                        {data?.image ? (
                            <Image
                                source={{ uri: data.image }}
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 16,
                                    backgroundColor: "#FFE4E6",
                                }}
                                resizeMode="cover"
                            />
                        ) : (
                            <View
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 16,
                                    backgroundColor: "#FFE4E6",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons name="image-outline" size={28} color="#F43F5E" />
                            </View>
                        )}

                        {/* Title + Date */}
                        <View style={{ flex: 1, paddingTop: 2 }}>
                            <Text
                                style={{
                                    fontSize: 17,
                                    fontWeight: "800",
                                    color: "#1E293B",
                                    lineHeight: 22,
                                    marginBottom: 4,
                                }}
                                numberOfLines={2}
                            >
                                {data?.title}
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
                                <Text style={{ fontSize: 12, color: "#94A3B8", fontWeight: "500" }}>
                                    {data ? formatDate(data.visitedAt) : ""}
                                </Text>
                            </View>
                        </View>

                        {/* Buttons column */}
                        <View style={{ gap: 8, paddingTop: 2 }}>
                            {/* Favorite */}
                            <Pressable
                                onPress={() => data && onToggleFavorite(data.id)}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    backgroundColor: data?.isFavorite ? "#FFF1F2" : "#F8FAFC",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderWidth: 1,
                                    borderColor: data?.isFavorite ? "#FDA4AF" : "#E2E8F0",
                                }}
                            >
                                <Ionicons
                                    name={data?.isFavorite ? "heart" : "heart-outline"}
                                    size={18}
                                    color={data?.isFavorite ? "#F43F5E" : "#94A3B8"}
                                />
                            </Pressable>
                            {/* Close */}
                            <Pressable
                                onPress={onClose}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    backgroundColor: "#F8FAFC",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderWidth: 1,
                                    borderColor: "#E2E8F0",
                                }}
                            >
                                <Ionicons name="close" size={18} color="#64748B" />
                            </Pressable>
                        </View>
                    </View>

                    {/* Divider */}
                    <View
                        style={{
                            height: 1,
                            backgroundColor: "#F1F5F9",
                            marginVertical: 16,
                        }}
                    />

                    {/* Comments — memory chat style */}
                    <Text
                        style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: "#94A3B8",
                            letterSpacing: 0.8,
                            textTransform: "uppercase",
                            marginBottom: 12,
                        }}
                    >
                        Our Memories
                    </Text>

                    {data?.comments.map((comment, index) => {
                        const isYou = comment.userId === "user_a";
                        return (
                            <View
                                key={comment.userId}
                                style={{
                                    flexDirection: isYou ? "row" : "row-reverse",
                                    alignItems: "flex-end",
                                    gap: 8,
                                    marginBottom: 12,
                                }}
                            >
                                {/* Avatar */}
                                <Image
                                    source={{ uri: comment.avatar }}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        borderWidth: 2,
                                        borderColor: isYou ? "#FDA4AF" : "#C7D2FE",
                                    }}
                                />

                                {/* Bubble */}
                                <View
                                    style={{
                                        flex: 1,
                                        maxWidth: "80%",
                                        backgroundColor: isYou ? "#FFF1F2" : "#F0F4FF",
                                        borderRadius: 16,
                                        borderBottomLeftRadius: isYou ? 4 : 16,
                                        borderBottomRightRadius: isYou ? 16 : 4,
                                        padding: 12,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontWeight: "700",
                                            color: isYou ? "#F43F5E" : "#6366F1",
                                            marginBottom: 4,
                                        }}
                                    >
                                        {comment.userName}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            color: "#334155",
                                            lineHeight: 18,
                                        }}
                                    >
                                        {comment.text}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}

                    {/* CTA */}
                    <Pressable
                        style={{
                            backgroundColor: "#F43F5E",
                            borderRadius: 16,
                            paddingVertical: 14,
                            alignItems: "center",
                            marginTop: 4,
                            flexDirection: "row",
                            justifyContent: "center",
                            gap: 8,
                        }}
                    >
                        <Ionicons name="albums-outline" size={18} color="#fff" />
                        <Text
                            style={{
                                color: "#fff",
                                fontWeight: "700",
                                fontSize: 15,
                            }}
                        >
                            View Memory Archive
                        </Text>
                    </Pressable>
                </ScrollView>
            </View>
        </Animated.View>
    );
}
