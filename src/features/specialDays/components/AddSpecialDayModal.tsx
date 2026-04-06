import { fromISODateString, toISODateString } from '@/src/features/memories/utils/date.utils';
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
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: { title: string; special_date: string }) => Promise<void>;
    /** Doluysa düzenleme modu — başlık ve tarih doldurulur */
    initialValues?: { title: string; special_date: string } | null;
    /** Aynı görünür kalırken formun yanlış sıfırlanmaması için (örn. editing?.id ?? "create") */
    formKey: string;
};

export function AddSpecialDayModal({ visible, onClose, onSubmit, initialValues, formKey }: Props) {
    const [title, setTitle] = useState('');
    const [dayDate, setDayDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const isEdit = initialValues != null;

    useEffect(() => {
        if (!visible) return;
        if (initialValues) {
            setTitle(initialValues.title);
            setDayDate(fromISODateString(initialValues.special_date));
        } else {
            setTitle('');
            setDayDate(new Date());
        }
        setShowDatePicker(false);
        setLoading(false);
    }, [visible, formKey]);

    const handleClose = () => {
        setShowDatePicker(false);
        setLoading(false);
        onClose();
    };

    const onDateChange = (_: unknown, date?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (date) setDayDate(date);
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert('Eksik bilgi', 'Lütfen bir başlık girin.');
            return;
        }

        setLoading(true);
        try {
            await onSubmit({
                title: title.trim(),
                special_date: toISODateString(dayDate),
            });
            onClose();
        } catch (e: unknown) {
            Alert.alert('Kaydedilemedi', e instanceof Error ? e.message : 'Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const displayDate = dayDate.toLocaleDateString('tr-TR', {
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
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={handleClose}
                            style={styles.headerBtn}
                            disabled={loading}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Text style={styles.cancelText}>Vazgeç</Text>
                        </TouchableOpacity>

                        <Text style={styles.headerTitle}>
                            {isEdit ? 'Özel günü düzenle' : 'Yeni özel gün'}
                        </Text>

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
                        <View style={styles.field}>
                            <Text style={styles.label}>Başlık</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="örn: Tanışma günümüz"
                                placeholderTextColor="#c9a0b2"
                                value={title}
                                onChangeText={setTitle}
                                returnKeyType="done"
                                editable={!loading}
                                maxLength={120}
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Tarih</Text>
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
                                    style={{ marginLeft: 'auto' }}
                                />
                            </TouchableOpacity>
                        </View>

                        {showDatePicker &&
                            (Platform.OS === 'ios' ? (
                                <View style={styles.iosDateWrapper}>
                                    <DateTimePicker
                                        value={dayDate}
                                        mode="date"
                                        display="spinner"
                                        onChange={onDateChange}
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
                                    value={dayDate}
                                    mode="date"
                                    display="default"
                                    onChange={onDateChange}
                                />
                            ))}

                        <View style={{ height: 24 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

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
    field: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#5c3d4a',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFE4E8',
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#2d1020',
    },
    dateTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFE4E8',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    dateText: {
        fontSize: 16,
        color: '#2d1020',
        fontWeight: '500',
    },
    iosDateWrapper: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#FFE4E8',
    },
    iosDoneBtnWrapper: {
        paddingVertical: 12,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#FFF2F2',
    },
    iosDoneBtn: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FF8A8A',
    },
});
