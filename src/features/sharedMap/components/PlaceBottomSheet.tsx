/**
 * PlaceBottomSheet — paylaşılan yer detayı.
 */

import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useRef } from "react";
import {
    Alert,
    Animated,
    Dimensions,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useDeleteSharedPlace } from "../hooks/useDeleteSharedPlace";
import type { SharedPlace } from "../types/sharedPlace.types";
import { formatVisitedDate } from "../utils/map.utils";
import { canDeletePlace } from "../utils/pair.utils";

type Props = {
  place: SharedPlace | null;
  partnerName?: string;
  onClose: () => void;
  onPlaceDeleted: (placeId: string) => void;
};

const SCREEN_HEIGHT = Dimensions.get("window").height;
const CARD_MAX_HEIGHT = SCREEN_HEIGHT * 0.85;
const SLIDE_DURATION = 300;

export default function PlaceBottomSheet({
  place,
  partnerName,
  onClose,
  onPlaceDeleted,
}: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { state } = useAuth();
  const currentUserId = state.user?.id ?? "";

  const { remove: removePlace, loading: deletingPlace } =
    useDeleteSharedPlace(onPlaceDeleted);

  const [modalVisible, setModalVisible] = React.useState(false);

  // Sadece kart için slide animasyonu
  const slideAnim = useRef(new Animated.Value(CARD_MAX_HEIGHT)).current;
  // Backdrop için ayrı opacity animasyonu
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: SLIDE_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: SLIDE_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: CARD_MAX_HEIGHT,
        duration: SLIDE_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: SLIDE_DURATION,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  useEffect(() => {
    if (place) {
      slideAnim.setValue(CARD_MAX_HEIGHT);
      backdropAnim.setValue(0);
      setModalVisible(true);
      requestAnimationFrame(animateIn);
    }
  }, [place]);

  const handleClose = () => {
    animateOut(() => {
      setModalVisible(false);
      onClose();
    });
  };

  const handleDeletePlace = () => {
    if (!place) return;
    Alert.alert(
      "Yeri Sil",
      `"${place.title}" silinsin mi? Bu işlem geri alınamaz.`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            await removePlace(place.id);
            handleClose();
          },
        },
      ],
    );
  };

  const isCreator = place ? canDeletePlace(place, currentUserId) : false;

  return (
    <Modal
      visible={modalVisible}
      onRequestClose={handleClose}
      transparent
      animationType="none"
      statusBarTranslucent={Platform.OS === "android"}
    >
      <View className="flex-1 justify-end" pointerEvents="box-none">
        {/* Backdrop — sabit durur, sadece opacity animasyonu */}
        <Animated.View
          pointerEvents="auto"
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(0,0,0,0.45)",
            opacity: backdropAnim,
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
          />
        </Animated.View>

        {/* Kart — sadece bu aşağıdan yukarıya kayıyor */}
        {place && (
          <Animated.View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: CARD_MAX_HEIGHT,
              paddingBottom: Math.max(insets.bottom, 16),
              elevation: 20,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: -8 },
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Handle */}
            <View className="items-center py-2.5">
              <View className="w-9 h-1 bg-slate-200 rounded-full" />
            </View>

            <View
              style={{
                paddingHorizontal: 20,
                paddingBottom: 8,
              }}
            >
              {place.photo_url && (
                <Image
                  source={{ uri: place.photo_url }}
                  style={{
                    width: "100%",
                    height: 260,
                    borderRadius: 16,
                    marginBottom: 16,
                    backgroundColor: "#F1F5F9",
                  }}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              )}

              <View className="flex-row gap-3 items-start">
                <View className="flex-1 pt-0.5 gap-1">
                  <Text
                    className="text-[17px] font-extrabold text-slate-800 leading-snug"
                    numberOfLines={2}
                  >
                    {place.title}
                  </Text>

                  {place.address && (
                    <View className="flex-row items-center gap-1">
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color="#94A3B8"
                      />
                      <Text
                        className="text-xs text-slate-400 font-medium flex-1"
                        numberOfLines={1}
                      >
                        {place.address}
                      </Text>
                    </View>
                  )}

                  {place.visited_at && (
                    <View className="flex-row items-center gap-1">
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color="#94A3B8"
                      />
                      <Text className="text-xs text-slate-400 font-medium">
                        {formatVisitedDate(place.visited_at)}
                      </Text>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center gap-3">
                  {isCreator && (
                    <Pressable
                      onPress={handleDeletePlace}
                      disabled={deletingPlace}
                      className="w-9 h-9 rounded-full bg-rose-50 border border-rose-200 items-center justify-center"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#F43F5E"
                      />
                    </Pressable>
                  )}
                  <Pressable
                    onPress={handleClose}
                    className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 items-center justify-center"
                  >
                    <Ionicons name="close" size={18} color="#64748B" />
                  </Pressable>
                </View>
              </View>

              {place.description ? (
                <Text
                  className="text-sm text-slate-500 leading-5 mt-3"
                  numberOfLines={8}
                >
                  {place.description}
                </Text>
              ) : null}

              <View className="h-px bg-slate-100 my-3" />

              <View className="flex-row items-center gap-1">
                <Ionicons
                  name="person-circle-outline"
                  size={14}
                  color="#94A3B8"
                />
                <Text className="text-xs text-slate-400 italic">
                  {place.created_by === currentUserId
                    ? t("map.placeAddedByYou")
                    : partnerName
                      ? t("map.placeAddedByName", { name: partnerName })
                      : t("map.placeAddedByPartner")}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}
