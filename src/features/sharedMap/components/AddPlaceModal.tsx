/**
 * AddPlaceModal
 *
 * NativeWind + swipe-to-close + keyboard-safe + scrollable bottom sheet
 * Integrated with expo-image-picker for photo upload
 */

import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type CreateSharedPlacePayload = {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  visited_at?: string;
  imageUri?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: CreateSharedPlacePayload) => Promise<void>;
  loading?: boolean;
  initialCoords?: { latitude: number; longitude: number } | null;
  isDailyLimitReached?: boolean;
  timeRemaining?: string;
  isTotalPlaceLimitReached?: boolean;
};

export default function AddPlaceModal({
  visible,
  onClose,
  onSave,
  loading = false,
  initialCoords,
  isDailyLimitReached = false,
  timeRemaining,
  isTotalPlaceLimitReached = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const sheetMaxHeight = Dimensions.get("window").height * 0.92;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [visitedAt, setVisitedAt] = useState<Date | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [titleError, setTitleError] = useState("");

  useEffect(() => {
    if (!visible) {
      setTitle("");
      setDescription("");
      setAddress("");
      setVisitedAt(null);
      setImageUri(null);
      setShowDatePicker(false);
      setTitleError("");
    }
  }, [visible]);

  const handleClose = () => {
    if (loading) return;
    Keyboard.dismiss();
    setShowDatePicker(false);
    onClose();
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "İzin Gerekli",
        "Fotoğraf seçmek için galeriye erişim izni vermeniz gerekiyor.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      try {
        const compressed = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG },
        );
        setImageUri(compressed.uri);
      } catch {
        setImageUri(result.assets[0].uri);
      }
    }
  };

  const handleSave = async () => {
    if (loading) return;
    Keyboard.dismiss();

    if (isTotalPlaceLimitReached) {
      Alert.alert(
        "Limit doldu",
        "4 konum ekleme hakkınızı kullandınız. Devam etmek için premium almalısınız.",
      );
      return;
    }

    if (!imageUri) {
      Alert.alert("Eksik Bilgi", "Lütfen bu anıya bir fotoğraf ekleyin.");
      return;
    }

    const trimmedTitle = title.trim();

    if (!trimmedTitle || trimmedTitle.length < 2) {
      setTitleError("Yer adı en az 2 karakter olmalıdır.");
      return;
    }

    if (trimmedTitle.length > 80) {
      setTitleError("Yer adı 80 karakterden az olmalıdır.");
      return;
    }

    if (!initialCoords) {
      Alert.alert(
        "Konum mevcut değil",
        "Konumunuz alınamadı. Haritaya uzun basarak manuel yer eklemeyi deneyin.",
      );
      return;
    }

    try {
      await onSave({
        title: trimmedTitle,
        description: description.trim() || undefined,
        latitude: initialCoords.latitude,
        longitude: initialCoords.longitude,
        address: address.trim() || undefined,
        visited_at: visitedAt ? visitedAt.toISOString() : undefined,
        imageUri: imageUri || undefined,
      });
    } catch (e: any) {
      Alert.alert(
        "Hata",
        e?.message ?? "Yer kaydedilemedi. Lütfen tekrar deneyin.",
      );
    }
  };

  const canSave = useMemo(() => {
    return title.trim().length >= 2 && !loading;
  }, [title, loading]);

  const formattedDate = visitedAt
    ? visitedAt.toLocaleDateString("tr-TR", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Tarih seçin (isteğe bağlı)";

  return (
    <>
      <Modal
        isVisible={visible}
        onBackdropPress={handleClose}
        onBackButtonPress={handleClose}
        onSwipeComplete={handleClose}
        swipeDirection={["down"]}
        propagateSwipe
        style={{ margin: 0, justifyContent: "flex-end" }}
        backdropOpacity={0.4}
        useNativeDriverForBackdrop
        avoidKeyboard={false}
        statusBarTranslucent
      >
        <View
          className="rounded-t-[28px] bg-bgLight px-6"
          style={{
            height: sheetMaxHeight,
            maxHeight: sheetMaxHeight,
            paddingBottom: Math.max(insets.bottom, 16),
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: -6 },
            elevation: 20,
          }}
        >
          {/* Handle */}
          <View className="items-center py-3">
            <View className="h-1 w-10 rounded-full bg-slate-300" />
          </View>

          {/* Header */}
          <View className="mb-4 flex-row items-center">
            <View className="flex-1">
              <Text className="text-[18px] font-extrabold text-slate-800">
                Bu Yeri Kaydet
              </Text>
              <Text className="mt-0.5 text-[12px] text-slate-400">
                Ortak anı haritanıza ekleyin 💕
              </Text>
            </View>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1, minHeight: 0 }}
            behavior="padding"
            keyboardVerticalOffset={0}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces
              nestedScrollEnabled
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingBottom: 8 }}
              style={{ flex: 1 }}
            >
              {/* Photo Picker */}
              <Text className="mb-1.5 mt-3 text-[11px] font-bold tracking-[0.6px] text-slate-500">
                FOTOĞRAF EKLE
              </Text>

              <Pressable
                onPress={
                  (isDailyLimitReached || isTotalPlaceLimitReached) && !imageUri
                    ? undefined
                    : pickImage
                }
                disabled={(isDailyLimitReached || isTotalPlaceLimitReached) && !imageUri}
                className="h-64 w-full items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden"
              >
                {imageUri ? (
                  <>
                    <Image
                      source={{ uri: imageUri }}
                      className="h-full w-full"
                    />
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setImageUri(null);
                      }}
                      className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-black/50"
                    >
                      <Ionicons name="close" size={20} color="white" />
                    </Pressable>
                  </>
                ) : isTotalPlaceLimitReached ? (
                  <View className="items-center px-5">
                    <View className="h-14 w-14 items-center justify-center rounded-full bg-white">
                      <Ionicons name="diamond-outline" size={30} color="#FF8A8A" />
                    </View>
                    <Text className="mt-3 text-center text-[13px] font-extrabold text-slate-800">
                      TOPLAM KONUM LİMİTİ DOLDU
                    </Text>
                    <Text className="mt-1 text-center text-[11px] font-semibold text-slate-500">
                      4 KONUM EKLEME HAKKINIZI KULLANDINIZ
                    </Text>
                    <View className="mt-3 rounded-xl bg-rose-100 px-4 py-2">
                      <Text className="text-center text-[10px] font-extrabold text-rose-500">
                        DEVAM ETMEK İÇİN PREMİUM ALMALISINIZ.
                      </Text>
                    </View>
                  </View>
                ) : isDailyLimitReached ? (
                  <View className="items-center px-5">
                    <View className="h-14 w-14 items-center justify-center rounded-full bg-white">
                      <Ionicons name="time-outline" size={30} color="#FF8A8A" />
                    </View>
                    <Text className="mt-3 text-center text-[13px] font-extrabold text-slate-800">
                      GÜNLÜK LİMİTE ULAŞILDI
                    </Text>
                    <Text className="mt-1 text-center text-[11px] font-semibold text-slate-500">
                      BİR SONRAKİ FOTOĞRAF HAKKINA KALAN SÜRE:
                    </Text>
                    <Text className="mt-1 text-center text-2xl font-black text-rose-400">
                      {timeRemaining || "Hesaplanıyor..."}
                    </Text>
                    <View className="mt-3 rounded-xl bg-rose-100 px-4 py-2">
                      <Text className="text-center text-[10px] font-extrabold text-rose-500">
                        SINIRSIZ FOTOĞRAF İÇİN PREMİUM ALABİLİRSİN.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View className="items-center">
                    <Ionicons name="camera-outline" size={32} color="#94A3B8" />
                    <Text className="mt-2 text-sm text-slate-400 font-medium">
                      Fotoğraf Seç
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Title */}
              <Text className="mb-1.5 mt-3 text-[11px] font-bold tracking-[0.6px] text-slate-500">
                YER ADI *
              </Text>

              <TextInput
                value={title}
                onChangeText={(t) => {
                  setTitle(t);
                  setTitleError("");
                }}
                placeholder="Örn: İlk Kahve Randevumuz ☕"
                placeholderTextColor="#CBD5E1"
                className={`rounded-2xl border px-4 text-[15px] text-slate-800 ${
                  title ? "border-rose-500" : "border-slate-200"
                } bg-slate-50`}
                style={{
                  paddingVertical: Platform.OS === "ios" ? 14 : 10,
                }}
                returnKeyType="next"
                maxLength={80}
                underlineColorAndroid="transparent"
              />

              {!!titleError && (
                <Text className="mb-1 ml-1 mt-1 text-[12px] text-rose-500">
                  {titleError}
                </Text>
              )}

              {/* Description */}
              <Text className="mb-1.5 mt-3 text-[11px] font-bold tracking-[0.6px] text-slate-500">
                ANI NOTU
              </Text>

              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Bu yeri özel kılan neydi?"
                placeholderTextColor="#CBD5E1"
                multiline
                textAlignVertical="top"
                maxLength={500}
                underlineColorAndroid="transparent"
                className={`min-h-[90px] rounded-2xl border bg-slate-50 px-4 pt-3 text-[15px] text-slate-800 ${
                  description ? "border-rose-500" : "border-slate-200"
                }`}
              />

              {/* Date */}
              <Text className="mb-1.5 mt-3 text-[11px] font-bold tracking-[0.6px] text-slate-500">
                ZİYARET TARİHİ
              </Text>

              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setTimeout(() => setShowDatePicker(true), 120);
                }}
                className={`flex-row items-center rounded-2xl border bg-slate-50 px-4 ${
                  visitedAt ? "border-rose-500" : "border-slate-200"
                }`}
                style={{
                  paddingVertical: Platform.OS === "ios" ? 14 : 12,
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={visitedAt ? "#F43F5E" : "#CBD5E1"}
                />

                <Text
                  className={`ml-2 flex-1 text-[15px] ${
                    visitedAt ? "text-slate-800" : "text-slate-300"
                  }`}
                >
                  {formattedDate}
                </Text>

                {visitedAt && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setVisitedAt(null);
                    }}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={16} color="#CBD5E1" />
                  </Pressable>
                )}
              </Pressable>

              {/* iOS picker */}
              {showDatePicker && Platform.OS === "ios" && (
                <View className="mt-1 rounded-2xl border border-rose-500 bg-slate-50 overflow-hidden">
                  <DateTimePicker
                    value={visitedAt ?? new Date()}
                    mode="date"
                    display="inline"
                    maximumDate={new Date()}
                    accentColor="#000000"
                    textColor="#000000"
                    themeVariant="light"
                    onChange={(_event: DateTimePickerEvent, date?: Date) => {
                      if (date) setVisitedAt(date);
                    }}
                  />

                  <Pressable
                    onPress={() => setShowDatePicker(false)}
                    className="items-end bg-rose-50 px-4 py-3"
                  >
                    <Text className="text-[15px] font-bold text-black">
                      Bitti
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Actions */}
              <View className="mt-6 flex-row">
                <Pressable
                  onPress={handleClose}
                  disabled={loading}
                  className="mr-3 flex-1 items-center justify-center rounded-2xl bg-slate-100 py-4"
                >
                  <Text className="text-[15px] font-bold text-slate-500">
                    Vazgeç
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSave}
                  disabled={!canSave}
                  className={`flex-1.5 flex-row items-center justify-center rounded-2xl py-4 ${
                    canSave ? "bg-rose-500" : "bg-rose-300"
                  }`}
                  style={{ flex: 2 }}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="heart" size={16} color="#fff" />
                      <Text className="ml-2 text-[15px] font-bold text-white">
                        Anıyı Kaydet
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Android date picker */}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={visitedAt ?? new Date()}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(_event: DateTimePickerEvent, date?: Date) => {
            setShowDatePicker(false);
            if (date) setVisitedAt(date);
          }}
        />
      )}
    </>
  );
}
