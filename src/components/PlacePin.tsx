import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { SharedPlace } from "../data/placesData";

type Props = {
    place: SharedPlace;
    isSelected: boolean;
    onPress: (place: SharedPlace) => void;
};

export default function PlacePin({ place, isSelected, onPress }: Props) {
    return (
        <Marker
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            onPress={() => onPress(place)}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
        >
            <View style={{ alignItems: "center" }}>
                {/* Bubble */}
                <View
                    style={{
                        width: isSelected ? 52 : 44,
                        height: isSelected ? 52 : 44,
                        borderRadius: isSelected ? 26 : 22,
                        backgroundColor: isSelected ? "#F43F5E" : "#fff",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 3,
                        borderColor: isSelected ? "#fff" : "#F43F5E",
                        shadowColor: "#F43F5E",
                        shadowOpacity: isSelected ? 0.5 : 0.2,
                        shadowRadius: isSelected ? 12 : 6,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: isSelected ? 10 : 5,
                    }}
                >
                    <Ionicons
                        name={place.isFavorite ? "heart" : "location"}
                        size={isSelected ? 22 : 18}
                        color={isSelected ? "#fff" : "#F43F5E"}
                    />
                </View>

                {/* Tail */}
                <View
                    style={{
                        width: 0,
                        height: 0,
                        borderLeftWidth: 6,
                        borderRightWidth: 6,
                        borderTopWidth: 8,
                        borderLeftColor: "transparent",
                        borderRightColor: "transparent",
                        borderTopColor: isSelected ? "#F43F5E" : "#fff",
                        marginTop: -2,
                    }}
                />

                {/* Label */}
                {isSelected && (
                    <View
                        style={{
                            backgroundColor: "#F43F5E",
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 8,
                            marginTop: 4,
                            maxWidth: 120,
                            shadowColor: "#000",
                            shadowOpacity: 0.15,
                            shadowRadius: 4,
                            shadowOffset: { width: 0, height: 2 },
                            elevation: 3,
                        }}
                    >
                        <Text
                            numberOfLines={1}
                            style={{
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: "700",
                            }}
                        >
                            {place.title}
                        </Text>
                    </View>
                )}
            </View>
        </Marker>
    );
}
