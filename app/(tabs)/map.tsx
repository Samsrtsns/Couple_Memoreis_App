import AddPlaceModal from "@/src/components/AddPlaceModal";
import PlaceDetailCard from "@/src/components/PlaceDetailCard";
import PlacePin from "@/src/components/PlacePin";
import { MOCK_PLACES, SharedPlace } from "@/src/data/placesData";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useRef, useState } from "react";
import {
    Alert,
    Platform,
    Pressable,
    StatusBar,
    Text,
    TextInput,
    View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const INITIAL_REGION = {
    latitude: 41.015,
    longitude: 28.975,
    latitudeDelta: 0.12,
    longitudeDelta: 0.06,
};

export default function OurPlacesScreen() {
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);

    const [places, setPlaces] = useState<SharedPlace[]>(MOCK_PLACES);
    const [selectedPlace, setSelectedPlace] = useState<SharedPlace | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [searchText, setSearchText] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);

    const handlePinPress = (place: SharedPlace) => {
        setSelectedPlace(place);
    };

    const handleMapPress = () => {
        if (selectedPlace) setSelectedPlace(null);
    };

    const handleToggleFavorite = (id: string) => {
        setPlaces((prev) =>
            prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
        );
        setSelectedPlace((prev) =>
            prev?.id === id ? { ...prev, isFavorite: !prev.isFavorite } : prev
        );
    };

    const handleCenterOnMe = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission denied", "Location access is needed to center the map.");
            return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
        };
        setCurrentLocation(coords);
        mapRef.current?.animateToRegion(
            { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.005 },
            600
        );
    };

    const handleZoom = (direction: "in" | "out") => {
        mapRef.current?.getCamera().then((cam) => {
            if (cam.zoom !== undefined) {
                mapRef.current?.animateCamera(
                    { zoom: direction === "in" ? cam.zoom + 1 : cam.zoom - 1 },
                    { duration: 300 }
                );
            }
        });
    };

    const handleAddCurrentLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission denied", "Location access is needed to add a place.");
            return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
        });
        setShowAddModal(true);
    };

    const handleSaveNewPlace = (data: { title: string; comment: string }) => {
        const coords = currentLocation ?? {
            latitude: 41.015 + (Math.random() - 0.5) * 0.08,
            longitude: 28.975 + (Math.random() - 0.5) * 0.04,
        };
        const newPlace: SharedPlace = {
            id: Date.now().toString(),
            title: data.title,
            latitude: coords.latitude,
            longitude: coords.longitude,
            image: "",
            visitedAt: new Date().toISOString().split("T")[0],
            createdBy: "user_a",
            isFavorite: false,
            comments: data.comment
                ? [
                    {
                        userId: "user_a",
                        userName: "You",
                        avatar: "https://i.pravatar.cc/100?img=1",
                        text: data.comment,
                    },
                ]
                : [],
        };
        setPlaces((prev) => [...prev, newPlace]);
        setShowAddModal(false);
        mapRef.current?.animateToRegion(
            { ...coords, latitudeDelta: 0.02, longitudeDelta: 0.01 },
            600
        );
        setTimeout(() => setSelectedPlace(newPlace), 700);
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#FDF8F7" }}>
            <StatusBar barStyle="dark-content" />

            {/* ──────────────── HEADER ──────────────── */}
            <View
                style={{
                    paddingTop: insets.top + 8,
                    paddingBottom: 12,
                    paddingHorizontal: 20,
                    backgroundColor: "#FDF8F7",
                    borderBottomWidth: 1,
                    borderBottomColor: "#F1EEF0",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                {/* Left — title */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            backgroundColor: "#FFF1F2",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Ionicons name="heart" size={18} color="#F43F5E" />
                    </View>
                    <Text
                        style={{
                            fontSize: 20,
                            fontWeight: "800",
                            color: "#1E293B",
                            letterSpacing: -0.3,
                        }}
                    >
                        Our Places
                    </Text>
                    <View
                        style={{
                            backgroundColor: "#FFE4E6",
                            borderRadius: 10,
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: "700",
                                color: "#F43F5E",
                            }}
                        >
                            {places.length}
                        </Text>
                    </View>
                </View>

                {/* Right — filter button */}
                <Pressable
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        backgroundColor: "#FFF1F2",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: "#FDA4AF",
                    }}
                >
                    <Ionicons name="options-outline" size={18} color="#F43F5E" />
                </Pressable>
            </View>

            {/* ──────────────── SEARCH BAR ──────────────── */}
            <View
                style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    backgroundColor: "#FDF8F7",
                }}
            >
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#fff",
                        borderRadius: 16,
                        paddingHorizontal: 14,
                        paddingVertical: Platform.OS === "ios" ? 12 : 4,
                        gap: 8,
                        borderWidth: 1.5,
                        borderColor: searchFocused ? "#F43F5E" : "#EDE8EA",
                        shadowColor: "#000",
                        shadowOpacity: 0.04,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 2,
                    }}
                >
                    <Ionicons
                        name="search"
                        size={16}
                        color={searchFocused ? "#F43F5E" : "#94A3B8"}
                    />
                    <TextInput
                        value={searchText}
                        onChangeText={setSearchText}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        placeholder="Search or add a new place"
                        placeholderTextColor="#CBD5E1"
                        style={{
                            flex: 1,
                            fontSize: 14,
                            color: "#1E293B",
                        }}
                        returnKeyType="search"
                    />
                    {searchText.length > 0 && (
                        <Pressable onPress={() => setSearchText("")}>
                            <Ionicons name="close-circle" size={16} color="#CBD5E1" />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* ──────────────── MAP ──────────────── */}
            <View style={{ flex: 1, position: "relative" }}>
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={{ flex: 1 }}
                    initialRegion={INITIAL_REGION}
                    onPress={handleMapPress}
                    showsUserLocation
                    showsMyLocationButton={false}
                    showsCompass={false}
                    showsScale={false}
                    toolbarEnabled={false}
                >
                    {places.map((place) => (
                        <PlacePin
                            key={place.id}
                            place={place}
                            isSelected={selectedPlace?.id === place.id}
                            onPress={handlePinPress}
                        />
                    ))}
                </MapView>

                {/* ── Right-side FABs ── */}
                <View
                    style={{
                        position: "absolute",
                        right: 16,
                        top: 16,
                        gap: 10,
                    }}
                >
                    {/* Zoom In */}
                    <Pressable
                        onPress={() => handleZoom("in")}
                        style={{
                            width: 42,
                            height: 42,
                            backgroundColor: "#fff",
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                            shadowColor: "#000",
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: 3 },
                            elevation: 5,
                        }}
                    >
                        <Ionicons name="add" size={22} color="#334155" />
                    </Pressable>

                    {/* Zoom Out */}
                    <Pressable
                        onPress={() => handleZoom("out")}
                        style={{
                            width: 42,
                            height: 42,
                            backgroundColor: "#fff",
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                            shadowColor: "#000",
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: 3 },
                            elevation: 5,
                        }}
                    >
                        <Ionicons name="remove" size={22} color="#334155" />
                    </Pressable>

                    {/* Center on me */}
                    <Pressable
                        onPress={handleCenterOnMe}
                        style={{
                            width: 42,
                            height: 42,
                            backgroundColor: "#fff",
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                            shadowColor: "#000",
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: 3 },
                            elevation: 5,
                        }}
                    >
                        <Ionicons name="locate" size={20} color="#F43F5E" />
                    </Pressable>
                </View>

                {/* ── Bottom-center "Add Place" FAB ── */}
                {!selectedPlace && (
                    <Pressable
                        onPress={handleAddCurrentLocation}
                        style={{
                            position: "absolute",
                            bottom: 20,
                            alignSelf: "center",
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#F43F5E",
                            borderRadius: 20,
                            paddingVertical: 14,
                            paddingHorizontal: 22,
                            gap: 8,
                            shadowColor: "#F43F5E",
                            shadowOpacity: 0.4,
                            shadowRadius: 16,
                            shadowOffset: { width: 0, height: 6 },
                            elevation: 8,
                        }}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#fff" />
                        <Text
                            style={{
                                color: "#fff",
                                fontWeight: "700",
                                fontSize: 15,
                            }}
                        >
                            Add Our Place
                        </Text>
                    </Pressable>
                )}

                {/* ── Place Detail Card (slide up from bottom) ── */}
                <PlaceDetailCard
                    place={selectedPlace}
                    onClose={() => setSelectedPlace(null)}
                    onToggleFavorite={handleToggleFavorite}
                />
            </View>

            {/* ──────────────── ADD PLACE MODAL ──────────────── */}
            <AddPlaceModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={handleSaveNewPlace}
            />
        </View>
    );
}