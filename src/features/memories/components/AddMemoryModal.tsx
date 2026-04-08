/**
 * AddMemoryModal Component
 *
 * Full-featured modal for creating a new memory:
 *   - Photo picker (from gallery or camera)
 *   - Title input
 *   - Description input
 *   - Date picker
 *   - Upload + insert flow with validation
 */

import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toISODateString } from "../utils/date.utils";

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    memory_date: string;
    photoUri: string;
  }) => Promise<void>;
  isDailyLimitReached?: boolean;
  timeRemaining?: string;
  isTotalMemoryLimitReached?: boolean;
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function AddMemoryModal({
  visible,
  onClose,
  onSubmit,
  isDailyLimitReached,
  timeRemaining,
  isTotalMemoryLimitReached,
}: Props) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [memoryDate, setMemoryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // ─── Reset form ─────────────────────────────────────────────
  const resetForm = () => {
    setPhotoUri(null);
    setTitle("");
    setDescription("");
    setMemoryDate(new Date());
    setShowDatePicker(false);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ─── Photo Picker ────────────────────────────────────────────
  const pickPhoto = () => {
    Alert.alert("Fotoğraf Ekle", "Fotoğrafı nereden seçeceğinizi belirleyin:", [
      { text: "Fotoğraf Çek", onPress: handleCamera },
      { text: "Galeriden Seç", onPress: handleGallery },
      { text: "Vazgeç", style: "cancel" },
    ]);
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Lütfen kameranıza erişime izin verin.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: true,
      aspect: [4, 3],
    });
    await processImageResult(result);
  };

  const handleGallery = async () => {
    // Quick check first so we don't delay the launch if already granted
    const { status: existingStatus } =
      await ImagePicker.getMediaLibraryPermissionsAsync();
    if (existingStatus !== "granted") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "İzin Gerekli",
          "Lütfen fotoğraf kitaplığınıza erişime izin verin.",
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: true,
      aspect: [4, 3],
    });
    await processImageResult(result);
  };

  const processImageResult = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets[0]) {
      try {
        // Heavily compress and resize image to fit the 50MB bucket constraints
        const compressed = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }], // 800px width is enough for mobile cards
          { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG }, // 40% JPEG quality
        );
        setPhotoUri(compressed.uri);
      } catch (error) {
        // Fallback to original if manipulation fails
        setPhotoUri(result.assets[0].uri);
      }
    }
  };

  // ─── Date picker handler ─────────────────────────────────────
  const onDateChange = (_: unknown, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) setMemoryDate(date);
  };

  // ─── Validation ──────────────────────────────────────────────
  const validate = (): string | null => {
    if (isTotalMemoryLimitReached) {
      return "Toplam anı yükleme hakkınız doldu. Devam etmek için premium alın.";
    }
    if (!photoUri) return "Lütfen bu anıya bir fotoğraf ekleyin.";
    if (!title.trim()) return "Lütfen bu anıya bir başlık verin.";
    return null;
  };

  // ─── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Eksik Bilgi", err);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        memory_date: toISODateString(memoryDate),
        photoUri: photoUri!,
      });
      resetForm();
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Bir şeyler yanlış gitti.";
      if (msg === "MEMORY_LIMIT_REACHED") {
        throw e; // parent güncel stats'i çekip sayaç UI'ını gösterecek
      }
      Alert.alert("Anı kaydedilemedi", msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Date display ────────────────────────────────────────────
  const displayDate = memoryDate.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.headerBtn}
              disabled={loading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.cancelText}>Vazgeç</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Yeni Anı ✨</Text>

            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.headerBtn, styles.saveBtn]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveText}>Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Photo picker */}
            <TouchableOpacity
              style={[
                styles.photoPicker,
                (isDailyLimitReached || isTotalMemoryLimitReached) &&
                  !photoUri &&
                  styles.photoPickerDisabled,
              ]}
              onPress={
                (isDailyLimitReached || isTotalMemoryLimitReached) && !photoUri
                  ? undefined
                  : pickPhoto
              }
              activeOpacity={
                (isDailyLimitReached || isTotalMemoryLimitReached) && !photoUri
                  ? 1
                  : 0.85
              }
              disabled={loading}
            >
              {photoUri ? (
                <>
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.photoPreview}
                    resizeMode="cover"
                  />
                  <View style={styles.photoOverlay}>
                    <Ionicons name="camera" size={24} color="#fff" />
                    <Text style={styles.photoOverlayText}>
                      Fotoğrafı değiştir
                    </Text>
                  </View>
                </>
              ) : isTotalMemoryLimitReached ? (
                <View style={styles.photoLimitContainer}>
                  <View style={styles.photoIconWrapLimit}>
                    <Ionicons name="diamond-outline" size={36} color="#FF8A8A" />
                  </View>
                  <Text style={styles.photoLimitTitle}>
                    TOPLAM ANI LİMİTİ DOLDU
                  </Text>
                  <Text style={styles.photoLimitSubtitle}>
                    4 ANI YÜKLEME HAKKINIZI KULLANDINIZ
                  </Text>
                  <View className="mt-4 bg-rose-100 px-4 py-2 rounded-xl">
                    <Text style={styles.photoLimitPremiumText}>
                      DEVAM ETMEK İÇİN PREMİUM ALMANIZ GEREKİYOR.
                    </Text>
                  </View>
                </View>
              ) : isDailyLimitReached ? (
                <View style={styles.photoLimitContainer}>
                  <View style={styles.photoIconWrapLimit}>
                    <Ionicons name="time-outline" size={36} color="#FF8A8A" />
                  </View>
                  <Text style={styles.photoLimitTitle}>
                    GÜNLÜK LİMİTE ULAŞILDI
                  </Text>
                  <Text style={styles.photoLimitSubtitle}>
                    BİR SONRAKİ FOTOĞRAF HAKKINA KALAN SÜRE ŞUDUR :
                  </Text>
                  <Text style={styles.photoLimitTimer}>
                    {timeRemaining || "Hesaplanıyor..."}
                  </Text>
                  <View className="mt-4 bg-rose-100 px-4 py-2 rounded-xl">
                    <Text style={styles.photoLimitPremiumText}>
                      SINIRSIZ FOTOĞRAF YÜKLEMEK İÇİN PREMİUM ALABİLİRSİNİZ.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.photoEmpty}>
                  <View style={styles.photoIconWrap}>
                    <Ionicons name="images-outline" size={36} color="#FF8A8A" />
                  </View>
                  <Text style={styles.photoEmptyTitle}>Fotoğraf ekle</Text>
                  <Text style={styles.photoEmptySubtitle}>
                    Her güzel anı bir fotoğrafı hak eder
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>Başlık *</Text>
              <TextInput
                style={styles.input}
                placeholder="örn: Sevgililer Günü Yemeği ❤️"
                placeholderTextColor="#c9a0b2"
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
                editable={!loading}
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.label}>Açıklama</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Bu anı özel kılan neydi?"
                placeholderTextColor="#c9a0b2"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                editable={!loading}
                maxLength={500}
                textAlignVertical="top"
              />
            </View>

            {/* Date */}
            <View style={styles.field}>
              <Text style={styles.label}>Anı Tarihi</Text>
              <TouchableOpacity
                style={styles.dateTrigger}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowDatePicker(true);
                }}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={18} color="#FF8A8A" />
                <Text style={styles.dateText}>{displayDate}</Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color="#c084a0"
                  style={{ marginLeft: "auto" }}
                />
              </TouchableOpacity>
            </View>

            {/* Date Picker */}
            {showDatePicker &&
              (Platform.OS === "ios" ? (
                <View style={styles.iosDateWrapper}>
                  <DateTimePicker
                    value={memoryDate}
                    mode="date"
                    display="spinner"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    themeVariant="light"
                  />
                  <TouchableOpacity
                    style={styles.iosDoneBtnWrapper}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.iosDoneBtn}>Bitti</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <DateTimePicker
                  value={memoryDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              ))}

            <View style={{ height: 30 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FDF8F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#FFF2F2",
    backgroundColor: "#fff",
  },
  headerBtn: {
    paddingHorizontal: 4,
    minWidth: 60,
  },
  cancelText: {
    fontSize: 15,
    color: "#9e6070",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2d1020",
  },
  saveBtn: {
    backgroundColor: "#FF8A8A",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    alignItems: "center",
    minWidth: 60,
  },
  saveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  // Photo picker
  photoPicker: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#FFF2F2",
    height: 250,
  },
  photoPickerDisabled: {
    backgroundColor: "#FFF8F8",
    borderWidth: 2,
    borderColor: "#FFE4E4",
    borderStyle: "dashed",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  photoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
  },
  photoOverlayText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  photoEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  photoIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  photoEmptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF8A8A",
  },
  photoEmptySubtitle: {
    fontSize: 13,
    color: "#c9a0b8",
    textAlign: "center",
  },
  // Form fields
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FF8A8A",
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#FFD1D1",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: "#2d1020",
  },
  inputMultiline: {
    height: 110,
    paddingTop: 13,
  },
  dateTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#FFD1D1",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dateText: {
    fontSize: 15,
    color: "#2d1020",
    fontWeight: "500",
  },
  iosDateWrapper: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#FFD1D1",
  },
  iosDoneBtnWrapper: {
    alignItems: "flex-end",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#FFF2F2",
  },
  iosDoneBtn: {
    color: "#FF8A8A",
    fontWeight: "700",
    fontSize: 15,
    paddingHorizontal: 8,
  },
  photoLimitContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
  photoIconWrapLimit: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    shadowColor: "#FF8A8A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  photoLimitTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#2d1020",
    letterSpacing: 1,
  },
  photoLimitSubtitle: {
    fontSize: 11,
    color: "#9e6070",
    textAlign: "center",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  photoLimitTimer: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FF8A8A",
    fontVariant: ["tabular-nums"],
  },
  photoLimitPremiumText: {
    fontSize: 10,
    color: "#F43F5E",
    textAlign: "center",
    fontWeight: "800",
  },
});
