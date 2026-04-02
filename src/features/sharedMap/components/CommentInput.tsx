/**
 * CommentInput — text input bar for adding comments.
 *
 * Shows a disabled state while submitting and clears after success.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

type Props = {
    onSubmit: (text: string) => Promise<void>;
    loading?: boolean;
    error?: string | null;
    initialValue?: string;
};

export default function CommentInput({ onSubmit, loading = false, error, initialValue = '' }: Props) {
    const [text, setText] = useState(initialValue);

    const handleSubmit = async () => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;
        await onSubmit(trimmed);
        setText('');
    };

    const canSubmit = text.trim().length > 0 && !loading;

    return (
        <View>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.container}>
                <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder="Write a memory note…"
                    placeholderTextColor="#CBD5E1"
                    style={styles.input}
                    multiline
                    maxLength={1000}
                    returnKeyType="send"
                    onSubmitEditing={handleSubmit}
                    blurOnSubmit
                    underlineColorAndroid="transparent"
                />
                <Pressable
                    onPress={handleSubmit}
                    disabled={!canSubmit}
                    style={[styles.sendBtn, !canSubmit && styles.sendBtnDisabled]}
                    android_ripple={null}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="send" size={16} color="#fff" />
                    )}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 10 : 4,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#1E293B',
        maxHeight: 80,
        paddingTop: Platform.OS === 'ios' ? 2 : 0,
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F43F5E',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#F43F5E',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    sendBtnDisabled: {
        backgroundColor: '#FDA4AF',
        shadowOpacity: 0,
        elevation: 0,
    },
    errorText: {
        fontSize: 12,
        color: '#F43F5E',
        marginBottom: 6,
        marginLeft: 4,
    },
});
