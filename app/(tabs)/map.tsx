/**
 * SharedMapScreen (app/(tabs)/map.tsx)
 *
 * The main "Our Places" map screen, now fully connected to Supabase.
 *
 * Features:
 * - Fetches shared places from Supabase for the matched pair
 * - Real-time sync via Supabase subscriptions (both users see updates)
 * - Long-press on map to pre-fill coordinates in AddPlaceModal
 * - "Add Place" FAB at the bottom
 * - Tap a marker → PlaceBottomSheet with details, comments, and comment input
 * - Map style toggle (standard / satellite)
 * - Zoom controls + center-on-me FAB
 * - Loading shimmer and error states
 * - Empty state if no places or no matched partner
 */

import Screen from '@/src/components/Screen';
import { useAuth } from '@/src/context/AuthContext';
import AddPlaceModal from '@/src/features/sharedMap/components/AddPlaceModal';
import MapHeader from '@/src/features/sharedMap/components/MapHeader';
import PlaceBottomSheet from '@/src/features/sharedMap/components/PlaceBottomSheet';
import PlaceMarker from '@/src/features/sharedMap/components/PlaceMarker';
import DraggableHeart from '@/src/features/sharedMap/components/DraggableHeart';
import { useSharedPlaces } from '@/src/features/sharedMap/hooks/useSharedPlaces';
import type { SharedPlace } from '@/src/features/sharedMap/types/sharedPlace.types';
import {
    fitRegionToPlaces,
    getInitialMapRegion,
} from '@/src/features/sharedMap/utils/map.utils';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';
import MapView, { LongPressEvent, MapPressEvent, MapType, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SharedMapScreen() {
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);
    const { state } = useAuth();

    // ─── State ───────────────────────────────────────────────────────────────
    const [selectedPlace, setSelectedPlace] = useState<SharedPlace | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const hasFittedPlaces = useRef(false);
    const [pendingCoords, setPendingCoords] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [mapType, setMapType] = useState<MapType>('standard');
    const [searchText, setSearchText] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [userLocation, setUserLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [mapLayout, setMapLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    // ─── Data Hooks ──────────────────────────────────────────────────────────
    const { places, loading, error, refetch, noPartner, addPlace } = useSharedPlaces();
    const [creating, setCreating] = useState(false);

    const handleCreatePlace = async (payload: any) => {
        setCreating(true);
        try {
            const newPlace = await addPlace({
                title: payload.title,
                description: payload.description,
                latitude: payload.latitude,
                longitude: payload.longitude,
                address: payload.address,
                photoUrl: payload.photo_url,
                visitedAt: payload.visited_at,
            });

            if (newPlace) {
                // Close modal and focus on new place
                setShowAddModal(false);
                setPendingCoords(null);

                // Safe delay before switching focus
                setTimeout(() => {
                    mapRef.current?.animateToRegion(
                        {
                            latitude: newPlace.latitude,
                            longitude: newPlace.longitude,
                            latitudeDelta: 0.012,
                            longitudeDelta: 0.006,
                        },
                        1000
                    );
                    setSelectedPlace(newPlace);
                }, 1200);
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to add place.');
        } finally {
            // Keep creating true until the animation starts or a bit longer
            // to prevent the Add FAB from flickering too soon
            setTimeout(() => setCreating(false), 2000);
        }
    };

    // ─── Initial map region ──────────────────────────────────────────────────
    useEffect(() => {
        if (mapReady && places.length > 0 && !hasFittedPlaces.current && !selectedPlace) {
            hasFittedPlaces.current = true;
            const region = fitRegionToPlaces(places);
            mapRef.current?.animateToRegion(region, 800);
        }
    }, [mapReady, places.length, !!selectedPlace]);

    // ─── Filter places by search ─────────────────────────────────────────────
    const filteredPlaces = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        if (!q) return places;
        return places.filter(
            (p) =>
                p.title.toLowerCase().includes(q) ||
                (p.address?.toLowerCase().includes(q) ?? false)
        );
    }, [places, searchText]);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleCenterOnMe = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'Location access is needed to center the map.');
            return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
        };
        setUserLocation(coords);
        mapRef.current?.animateToRegion(
            { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.005 },
            600
        );
    };

    const handleZoom = (direction: 'in' | 'out') => {
        mapRef.current?.getCamera().then((cam) => {
            if (cam.zoom !== undefined) {
                mapRef.current?.animateCamera(
                    { zoom: direction === 'in' ? cam.zoom + 1 : cam.zoom - 1 },
                    { duration: 300 }
                );
            }
        });
    };



    const handleHeartDrop = async (absoluteX: number, absoluteY: number) => {
        if (!mapRef.current || !mapLayout) return;
        
        try {
            // Convert absolute screen coordinates to relative map coordinates
            const relativeX = absoluteX - mapLayout.x;
            const relativeY = absoluteY - mapLayout.y;

            const coord = await mapRef.current.coordinateForPoint({ x: relativeX, y: relativeY });
            if (coord) {
                 setPendingCoords(coord);
                 setShowAddModal(true);
            }
        } catch (e) {
            console.error('Drop conversion failed:', e);
        }
    };

    const handleAddButtonPress = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            try {
                const loc = await Location.getCurrentPositionAsync({});
                setPendingCoords({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                });
            } catch {
                setPendingCoords(null);
            }
        } else {
            setPendingCoords(null);
        }
        setShowAddModal(true);
    };

    const handleMarkerPress = useCallback((place: SharedPlace) => {
        setSelectedPlace(place);
        mapRef.current?.animateToRegion(
            {
                latitude: place.latitude,
                longitude: place.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.005,
            },
            400
        );
    }, []);

    const handleMapPress = (event: MapPressEvent) => {
        // If a place is selected, clicking the map unselects it
        if (selectedPlace) {
            setSelectedPlace(null);
            return;
        }
    };

    const handlePlaceDeleted = useCallback((placeId: string) => {
        // Trigger a refetch immediately when a place is deleted
        refetch();
        setSelectedPlace((prev) => (prev?.id === placeId ? null : prev));
    }, [refetch]);

    const handleToggleMapStyle = () => {
        setMapType((prev) => (prev === 'standard' ? 'satellite' : 'standard'));
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    const partnerName = state.partner
        ? `${(state.partner as any).first_name ?? ''} ${(state.partner as any).last_name ?? ''}`.trim()
        : undefined;

    const initialRegion = getInitialMapRegion(userLocation, places);

    return (
        <Screen>
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" />

                {/* ── Header ── */}
                <MapHeader
                    placesCount={filteredPlaces.length}
                    mapStyle={mapType === 'standard' ? 'standard' : 'satellite'}
                    onToggleMapStyle={handleToggleMapStyle}
                    onRefresh={refetch}
                    refreshing={loading}
                />

                <DraggableHeart onDrop={handleHeartDrop} topInset={insets.top} />

                {/* ── Map ── */}
                <View 
                    style={styles.mapContainer}
                    onLayout={(e) => {
                        // We use measureInWindow for more accuracy but for now onLayout is a good start
                        // Actually, since it's inside a Screen with fixed container, onLayout is usually enough
                        // But let's use measure to be sure on all devices
                        e.currentTarget.measure((x, y, width, height, pageX, pageY) => {
                            setMapLayout({ x: pageX, y: pageY, width, height });
                        });
                    }}
                >
                    {/* Loading overlay */}
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#F43F5E" />
                        </View>
                    )}

                    {/* Error banner */}
                    {!!error && !loading && (
                        <View style={styles.errorBanner}>
                            <Ionicons name="warning-outline" size={16} color="#fff" />
                            <Text style={styles.errorBannerText}>{error}</Text>
                            <Pressable onPress={refetch} style={styles.retryBtn}>
                                <Text style={styles.retryBtnText}>Retry</Text>
                            </Pressable>
                        </View>
                    )}

                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        mapType={mapType}
                        initialRegion={initialRegion}
                        onPress={handleMapPress}
                        onMapReady={() => setMapReady(true)}
                        showsUserLocation
                        showsMyLocationButton={false}
                        showsCompass={false}
                        showsScale={false}
                        toolbarEnabled={false}
                    >
                        {filteredPlaces.map((place) => (
                            <PlaceMarker
                                key={place.id}
                                place={place}
                                isSelected={selectedPlace?.id === place.id}
                                onPress={handleMarkerPress}
                            />
                        ))}

                        {/* Preview marker for new place */}
                        {pendingCoords && (
                            <Marker
                                coordinate={pendingCoords}
                                pinColor="#F43F5E"
                                title="New Memory Location"
                                description="Saving this spot..."
                            />
                        )}
                    </MapView>

                    {/* No-partner banner (only shown when user has no partner) */}
                    {noPartner && !loading && (
                        <View style={styles.noPartnerBanner}>
                            <Ionicons name="people-outline" size={16} color="#64748B" />
                            <Text style={styles.noPartnerText}>
                                Connect with your partner to share places 💕
                            </Text>
                        </View>
                    )}

                    {/* Right FABs: zoom */}
                    <View style={styles.rightFabs}>
                        <Pressable onPress={() => handleZoom('in')} style={styles.fab} android_ripple={null}>
                            <Ionicons name="add" size={22} color="#334155" />
                        </Pressable>
                        <Pressable onPress={() => handleZoom('out')} style={styles.fab} android_ripple={null}>
                            <Ionicons name="remove" size={22} color="#334155" />
                        </Pressable>
                    </View>

                    {/* Bottom Right FABs: locate */}
                    <View style={styles.bottomRightFabs}>
                        <Pressable onPress={handleCenterOnMe} style={styles.fab} android_ripple={null}>
                            <Ionicons name="locate" size={20} color="#F43F5E" />
                        </Pressable>
                    </View>

                    {/* Bottom FAB: Add Place (hidden when detail card is open) */}
                    {!selectedPlace && !noPartner && (
                        <Pressable
                            onPress={handleAddButtonPress}
                            style={styles.addFab}
                            android_ripple={null}
                        >
                            <Ionicons name="add-circle-outline" size={20} color="#fff" />
                            <Text style={styles.addFabText}>Add Our Place</Text>
                        </Pressable>
                    )}

                    {/* Place detail bottom sheet */}
                    <PlaceBottomSheet
                        place={selectedPlace}
                        partnerName={partnerName}
                        onClose={() => setSelectedPlace(null)}
                        onPlaceDeleted={handlePlaceDeleted}
                    />
                </View>

                {/* Add Place Modal */}
                <AddPlaceModal
                    visible={showAddModal}
                    onClose={() => {
                        setShowAddModal(false);
                        setPendingCoords(null);
                    }}
                    onSave={handleCreatePlace}
                    loading={creating}
                    initialCoords={pendingCoords}
                />
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDF8F7',
    },
    searchWrapper: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FDF8F7',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 12 : 4,
        gap: 8,
        borderWidth: 1.5,
        borderColor: '#EDE8EA',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    searchBarFocused: {
        borderColor: '#F43F5E',
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1E293B',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorBanner: {
        position: 'absolute',
        top: 12,
        left: 16,
        right: 16,
        zIndex: 20,
        backgroundColor: '#F43F5E',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    errorBannerText: {
        flex: 1,
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    retryBtn: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    retryBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    rightFabs: {
        position: 'absolute',
        right: 16,
        top: 16,
        gap: 10,
    },
    bottomRightFabs: {
        position: 'absolute',
        right: 26,
        bottom: 110,
        gap: 10,
    },
    fab: {
        width: 42,
        height: 42,
        backgroundColor: '#fff',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 5,
    },
    addFab: {
        position: 'absolute',
        bottom: 110,
        left: 26,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F43F5E',
        borderRadius: 20,
        paddingVertical: 14,
        paddingHorizontal: 22,
        gap: 8,
        shadowColor: '#F43F5E',
        shadowOpacity: 0.4,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    addFabText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    fabLoading: {
        opacity: 0.5,
    },
    noPartnerBanner: {
        position: 'absolute',
        top: 12,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    noPartnerText: {
        flex: 1,
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
});