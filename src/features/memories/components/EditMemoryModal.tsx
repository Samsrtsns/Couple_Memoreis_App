/**
 * EditMemoryModal Component
 *
 * Modal for editing an existing memory:
 *   - Photo picker (change photo)
 *   - Title input
 *   - Description input
 *   - Date picker
 *   - Save flow with validation
 */

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Memory, UpdateMemoryPayload } from '../types/memory.types';
import { toISODateString } from '../utils/date.utils';

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

type Props = {
    visible: boolean;
    memory: Memory;
    onClose: () => void;
    onSubmit: (payload: UpdateMemoryPayload) => Promise<void>;
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function EditMemoryModal({ visible, memory, onClose, onSubmit }: Props) {
    const { t, i18n } = useTranslation();
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [photoChanged, setPhotoChanged] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [memoryDate, setMemoryDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    // Populate form with memory data when opening
    useEffect(() => {
        if (visible && memory) {
            setTitle(memory.title);
            setDescription(memory.description ?? '');
            setPhotoUri(memory.photo_url);
            setPhotoChanged(false);
            if (memory.memory_date) {
                const parts = memory.memory_date.split('-');
                if (parts.length === 3) {
                    setMemoryDate(new Date(+parts[0], +parts[1] - 1, +parts[2]));
                }
            }
            setShowDatePicker(false);
            setLoading(false);
        }
    }, [visible, memory]);

    const handleClose = () => {
        onClose();
    };

    // ─── Photo Picker ────────────────────────────────────────────
    const pickPhoto = () => {
        Alert.alert(
            t('editMemory.changePhotoTitle'),
            t('editMemory.changePhotoMessage'),
            [
                { text: t('editMemory.camera'), onPress: handleCamera },
                { text: t('editMemory.gallery'), onPress: handleGallery },
                { text: t('editMemory.cancel'), style: 'cancel' }
            ]
        );
    };

    const handleCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('addMemory.permissionRequired'), t('editMemory.permissionCamera'));
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 1,
            allowsEditing: true,
            aspect: [4, 3],
        });
        await processImageResult(result);
    };

    const handleGallery = async () => {
        const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (existingStatus !== 'granted') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t('addMemory.permissionRequired'), t('editMemory.permissionGallery'));
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 1,
            allowsEditing: true,
            aspect: [4, 3],
        });
        await processImageResult(result);
    };

    const processImageResult = async (result: ImagePicker.ImagePickerResult) => {
        if (!result.canceled && result.assets[0]) {
            try {
                const compressed = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 800 } }],
                    { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG }
                );
                setPhotoUri(compressed.uri);
                setPhotoChanged(true);
            } catch {
                setPhotoUri(result.assets[0].uri);
                setPhotoChanged(true);
            }
        }
    };

    // ─── Date picker handler ─────────────────────────────────────
    const onDateChange = (_: unknown, date?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (date) setMemoryDate(date);
    };

    // ─── Validation ──────────────────────────────────────────────
    const validate = (): string | null => {
        if (!title.trim()) return t('editMemory.enterTitle');
        return null;
    };

    // ─── Submit ──────────────────────────────────────────────────
    const handleSubmit = async () => {
        const err = validate();
        if (err) {
            Alert.alert(t('editMemory.missingInfo'), err);
            return;
        }

        setLoading(true);
        try {
            const payload: UpdateMemoryPayload = {
                memoryId: memory.id,
                title: title.trim(),
                description: description.trim(),
                memory_date: toISODateString(memoryDate),
            };

            // Only include photoUri if the photo was actually changed
            if (photoChanged && photoUri) {
                payload.photoUri = photoUri;
            }

            await onSubmit(payload);
            onClose();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : t('editMemory.genericError');
            Alert.alert(t('editMemory.updateFailed'), msg);
        } finally {
            setLoading(false);
        }
    };

    // ─── Date display ────────────────────────────────────────────
    const displayDate = memoryDate.toLocaleDateString(i18n.language || 'tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={handleClose}
                            style={styles.headerBtn}
                            disabled={loading}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Text style={styles.cancelText}>{t('editMemory.cancel')}</Text>
                        </TouchableOpacity>

                        <Text style={styles.headerTitle}>{t('editMemory.title')}</Text>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            style={[styles.headerBtn, styles.saveBtn]}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.saveText}>{t('editMemory.save')}</Text>
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
                            style={styles.photoPicker}
                            onPress={pickPhoto}
                            activeOpacity={0.85}
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
                                        <Text style={styles.photoOverlayText}>{t('editMemory.changePhoto')}</Text>
                                    </View>
                                </>
                            ) : (
                                <View style={styles.photoEmpty}>
                                    <View style={styles.photoIconWrap}>
                                        <Ionicons name="images-outline" size={36} color="#FF8A8A" />
                                    </View>
                                    <Text style={styles.photoEmptyTitle}>{t('editMemory.addPhoto')}</Text>
                                    <Text style={styles.photoEmptySubtitle}>
                                        {t('editMemory.addPhotoSub')}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Title */}
                        <View style={styles.field}>
                            <Text style={styles.label}>{t('editMemory.titleLabel')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('editMemory.titlePlaceholder')}
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
                            <Text style={styles.label}>{t('editMemory.descLabel')}</Text>
                            <TextInput
                                style={[styles.input, styles.inputMultiline]}
                                placeholder={t('editMemory.descPlaceholder')}
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
                            <Text style={styles.label}>{t('editMemory.dateLabel')}</Text>
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
                                <Ionicons name="chevron-down" size={16} color="#c084a0" style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>
                        </View>

                        {/* Date Picker */}
                        {showDatePicker && (
                            Platform.OS === 'ios' ? (
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
                                        <Text style={styles.iosDoneBtn}>{t('editMemory.done')}</Text>
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
                            )
                        )}

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
        backgroundColor: '#FDF8F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#FFF2F2',
        backgroundColor: '#fff',
    },
    headerBtn: {
        paddingHorizontal: 4,
        minWidth: 60,
    },
    cancelText: {
        fontSize: 15,
        color: '#9e6070',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#2d1020',
    },
    saveBtn: {
        backgroundColor: '#FF8A8A',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 7,
        alignItems: 'center',
        minWidth: 60,
    },
    saveText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        gap: 20,
    },
    photoPicker: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#FFF2F2',
        height: 220,
    },
    photoPreview: {
        width: '100%',
        height: '100%',
    },
    photoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 6,
    },
    photoOverlayText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    photoEmpty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    photoIconWrap: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    photoEmptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FF8A8A',
    },
    photoEmptySubtitle: {
        fontSize: 13,
        color: '#c9a0b8',
        textAlign: 'center',
    },
    field: {
        gap: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FF8A8A',
        letterSpacing: 0.3,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#FFD1D1',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 13,
        fontSize: 15,
        color: '#2d1020',
    },
    inputMultiline: {
        height: 110,
        paddingTop: 13,
    },
    dateTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#FFD1D1',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 13,
    },
    dateText: {
        fontSize: 15,
        color: '#2d1020',
        fontWeight: '500',
    },
    iosDateWrapper: {
        backgroundColor: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#FFD1D1',
    },
    iosDoneBtnWrapper: {
        alignItems: 'flex-end',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#FFF2F2',
    },
    iosDoneBtn: {
        color: '#FF8A8A',
        fontWeight: '700',
        fontSize: 15,
        paddingHorizontal: 8,
    },
});
