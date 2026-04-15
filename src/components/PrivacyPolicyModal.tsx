import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, Pressable, ScrollView, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { EXTERNAL_LINKS } from '@/src/constants/externalLinks';
import { supabase } from '@/src/lib/supabase';
import { openExternalLink } from '@/src/utils/openExternalLink';
import PrimaryButton from './PrimaryButton';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PrivacyPolicyModal({ visible, onClose, onAccept }: Props) {
  const { t } = useTranslation();
  const [policy, setPolicy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPolicy = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, error: fetchError } = await supabase
        .from('legal_documents')
        .select('content')
        .eq('type', 'privacy_policy')
        .limit(1)
        .single();

      if (fetchError) throw fetchError;
      if (data) {
        setPolicy(data.content);
      }
    } catch (e) {
      console.error('Error fetching privacy policy:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchPolicy();
    }
  }, [visible]);

  const openPrivacyWebsite = () => {
    void openExternalLink(EXTERNAL_LINKS.privacyPolicy, {
      cannotOpen: t('common.linkCannotOpen'),
      failed: t('common.linkOpenFailed'),
    });
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop for closing */}
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <View style={styles.container}>
          {/* Bottom Sheet Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('privacyModal.title')}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748B" />
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.contentArea}>
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#ea5385" />
                <Text style={styles.loadingText}>{t('privacyModal.loading')}</Text>
              </View>
            ) : error ? (
              <View style={styles.centerContainer}>
                <Ionicons name="warning-outline" size={32} color="#F43F5E" />
                <Text style={styles.errorText}>{t('privacyModal.error')}</Text>
                <Pressable onPress={fetchPolicy} style={styles.retryBtn}>
                  <Text style={styles.retryText}>{t('privacyModal.retry')}</Text>
                </Pressable>
                <Pressable onPress={openPrivacyWebsite} style={styles.webLinkRow}>
                  <Ionicons name="open-outline" size={18} color="#2563EB" />
                  <Text style={styles.webLinkText}>{t('privacyModal.viewOnWebsite')}</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView 
                style={styles.scrollView} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollPadding}
              >
                <Text style={styles.policyText}>
                  {policy || t('privacyModal.empty')}
                </Text>
              </ScrollView>
            )}
          </View>

          {/* Footer Action */}
          <View style={styles.footer}>
            <Pressable onPress={openPrivacyWebsite} style={styles.webLinkRow}>
              <Ionicons name="open-outline" size={18} color="#2563EB" />
              <Text style={styles.webLinkText}>{t('privacyModal.viewOnWebsite')}</Text>
            </Pressable>
            <PrimaryButton 
              title={t('privacyModal.accept')} 
              onPress={onAccept}
              disabled={loading || error}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    width: '100%',
    height: SCREEN_HEIGHT * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  contentArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollPadding: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  policyText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: 'white',
    gap: 12,
  },
  webLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  webLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
});
