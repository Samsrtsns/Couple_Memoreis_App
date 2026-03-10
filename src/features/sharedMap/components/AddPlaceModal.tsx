/**
 * AddPlaceModal — simplified modal for adding a new shared place.
 *
 * - Coordinates are pre-filled automatically (from location or long-press) — not shown to user
 * - No photo URL field
 * - Fixed keyboard behavior: Modal wraps KeyboardAvoidingView(flex:1) so sheet doesn't jump
 * - DateTimePicker shown as a separate Modal on Android to avoid layout issues
 */

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import type { CreateSharedPlacePayload } from '../types/sharedPlace.types';

type Props = {
    visible: boolean;
    onClose: () => void;
    onSave: (payload: CreateSharedPlacePayload) => Promise<void>;
    loading?: boolean;
    /** Pre-filled coordinates from long press or location */
    initialCoords?: { latitude: number; longitude: number } | null;
};

export default function AddPlaceModal({
    visible,
    onClose,
    onSave,
    loading = false,
    initialCoords,
}: Props) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [visitedAt, setVisitedAt] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [titleError, setTitleError] = useState('');

    // Reset form when modal closes
    useEffect(() => {
        if (!visible) {
            setTitle('');
            setDescription('');
            setAddress('');
            setVisitedAt(null);
            setShowDatePicker(false);
            setTitleError('');
        }
    }, [visible]);

    const handleClose = () => {
        if (loading) return;
        Keyboard.dismiss();
        onClose();
    };

    const handleSave = async () => {
        if (loading) return;
        Keyboard.dismiss();

        const trimmedTitle = title.trim();
        if (!trimmedTitle || trimmedTitle.length < 2) {
            setTitleError('Place name must be at least 2 characters.');
            return;
        }
        if (trimmedTitle.length > 80) {
            setTitleError('Place name must be under 80 characters.');
            return;
        }

        if (!initialCoords) {
            Alert.alert('Location not available', 'Could not get your location. Try long-pressing on the map to add a place manually.');
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
            });
        } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to save place. Please try again.');
        }
    };

    const canSave = title.trim().length >= 2 && !loading;

    const formattedDate = visitedAt
        ? visitedAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'Select a date (optional)';

    return (
        <>
            <Modal
                visible={visible}
                transparent
                animationType="slide"
                onRequestClose={handleClose}
                statusBarTranslucent
            >
                {/* Outer: fills the screen, sheet anchored at bottom via flex */}
                <View style={styles.kavContainer}>
                    {/* Tappable backdrop */}
                    <Pressable style={styles.backdrop} onPress={handleClose} />

                    {/* KAV only wraps the sheet — lifts it above keyboard */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{ flex: 1, justifyContent: 'flex-end' }}
                        keyboardVerticalOffset={0}
                    >
                        {/* Bottom sheet */}
                        <View style={styles.sheet}>
                            {/* Drag handle */}
                            <View style={styles.handleWrapper}>
                                <View style={styles.handle} />
                            </View>

                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.headerIcon}>
                                    <Ionicons name="add-circle" size={22} color="#F43F5E" />
                                </View>
                                <View>
                                    <Text style={styles.headerTitle}>Save This Place</Text>
                                    <Text style={styles.headerSub}>Add it to your shared memory map 💕</Text>
                                </View>
                            </View>

                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                bounces={false}
                                nestedScrollEnabled={true}
                                scrollEnabled={true}
                                contentContainerStyle={styles.scrollContent}
                            >
                                {/* Show coords info (read-only badge) */}
                                {initialCoords && (
                                    <View style={styles.coordsBadge}>
                                        <Ionicons name="location" size={13} color="#F43F5E" />
                                        <Text style={styles.coordsBadgeText}>
                                            {initialCoords.latitude.toFixed(5)}, {initialCoords.longitude.toFixed(5)}
                                        </Text>
                                    </View>
                                )}

                                {/* Title */}
                                <Text style={styles.label}>PLACE NAME *</Text>
                                <TextInput
                                    value={title}
                                    onChangeText={(t) => { setTitle(t); setTitleError(''); }}
                                    placeholder="e.g. Our First Coffee Date ☕"
                                    placeholderTextColor="#CBD5E1"
                                    style={[styles.input, title ? styles.inputActive : undefined]}
                                    returnKeyType="next"
                                    maxLength={80}
                                    autoFocus={false}
                                    underlineColorAndroid="transparent"
                                />
                                {!!titleError && <Text style={styles.errorText}>{titleError}</Text>}

                                {/* Memory Note */}
                                <Text style={styles.label}>MEMORY NOTE</Text>
                                <TextInput
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="What made this place special?"
                                    placeholderTextColor="#CBD5E1"
                                    multiline
                                    style={[styles.input, styles.multiline, description ? styles.inputActive : undefined]}
                                    textAlignVertical="top"
                                    maxLength={500}
                                    underlineColorAndroid="transparent"
                                />

                                {/* Address */}
                                <Text style={styles.label}>ADDRESS</Text>
                                <TextInput
                                    value={address}
                                    onChangeText={setAddress}
                                    placeholder="e.g. Karaköy, Istanbul"
                                    placeholderTextColor="#CBD5E1"
                                    style={[styles.input, address ? styles.inputActive : undefined]}
                                    maxLength={200}
                                    underlineColorAndroid="transparent"
                                />

                                {/* Date visited */}
                                <Text style={styles.label}>DATE VISITED</Text>
                                <Pressable
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        // Small delay so keyboard dismiss doesn't conflict
                                        setTimeout(() => setShowDatePicker(true), 150);
                                    }}
                                    style={[styles.input, styles.datePickerRow, visitedAt ? styles.inputActive : undefined]}
                                >
                                    <Ionicons
                                        name="calendar-outline"
                                        size={16}
                                        color={visitedAt ? '#F43F5E' : '#CBD5E1'}
                                    />
                                    <Text style={[styles.dateText, visitedAt ? styles.dateTextActive : undefined]}>
                                        {formattedDate}
                                    </Text>
                                    {visitedAt && (
                                        <Pressable
                                            onPress={(e) => { e.stopPropagation(); setVisitedAt(null); }}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <Ionicons name="close-circle" size={16} color="#CBD5E1" />
                                        </Pressable>
                                    )}
                                </Pressable>

                                {/* iOS inline picker renders inside the sheet */}
                                {showDatePicker && Platform.OS === 'ios' && (
                                    <View style={styles.iosPickerWrapper}>
                                        <DateTimePicker
                                            value={visitedAt ?? new Date()}
                                            mode="date"
                                            display="inline"
                                            maximumDate={new Date()}
                                            accentColor="#000000"
                                            textColor="#000000"
                                            onChange={(_event, date) => {
                                                if (date) setVisitedAt(date);
                                            }}
                                        />
                                        <Pressable
                                            onPress={() => setShowDatePicker(false)}
                                            style={styles.pickerDoneBtn}
                                        >
                                            <Text style={styles.pickerDoneBtnText}>Done</Text>
                                        </Pressable>
                                    </View>
                                )}

                                {/* Actions */}
                                <View style={styles.actionsRow}>
                                    <Pressable onPress={handleClose} style={styles.cancelBtn} disabled={loading}>
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={handleSave}
                                        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                                        disabled={!canSave}
                                    >
                                        {loading ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <>
                                                <Ionicons name="heart" size={16} color="#fff" />
                                                <Text style={styles.saveBtnText}>Save Memory</Text>
                                            </>
                                        )}
                                    </Pressable>
                                </View>
                            </ScrollView>
                        </View>{/* end sheet */}
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* Android date picker — shown as a separate native dialog */}
            {showDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                    value={visitedAt ?? new Date()}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(_event, date) => {
                        setShowDatePicker(false);
                        if (date) setVisitedAt(date);
                    }}
                />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    kavContainer: {
        flex: 1,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingBottom: 0,
        flex: 1,
        marginTop: 60,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -6 },
        elevation: 20,
    },
    handleWrapper: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 36,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFF1F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    headerSub: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 1,
    },
    scrollContent: {
        paddingBottom: 8,
    },
    coordsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#FFF1F2',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    coordsBadgeText: {
        fontSize: 11,
        color: '#F43F5E',
        fontWeight: '600',
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.6,
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        fontSize: 15,
        color: '#1E293B',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        marginBottom: 4,
    },
    inputActive: {
        borderColor: '#F43F5E',
    },
    multiline: {
        minHeight: 80,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    datePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateText: {
        flex: 1,
        fontSize: 15,
        color: '#CBD5E1',
    },
    dateTextActive: {
        color: '#1E293B',
    },
    iosPickerWrapper: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 4,
        borderWidth: 1.5,
        borderColor: '#F43F5E',
    },
    pickerDoneBtn: {
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FFF1F2',
    },
    pickerDoneBtnText: {
        color: '#000000',
        fontWeight: '700',
        fontSize: 15,
    },
    errorText: {
        fontSize: 12,
        color: '#F43F5E',
        marginBottom: 4,
        marginLeft: 4,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#64748B',
        fontWeight: '700',
        fontSize: 15,
    },
    saveBtn: {
        flex: 2,
        backgroundColor: '#F43F5E',
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    saveBtnDisabled: {
        backgroundColor: '#FDA4AF',
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});
