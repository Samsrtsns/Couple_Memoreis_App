import React from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import { openRevenueCatPaywall } from '@/src/services/revenuecat';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function PremiumUpsellModal({
  visible,
  onClose,
  title = "Sınırına Ulaştın",
  message = "Base plan limitine ulaştın. Sınırsız anı, konum ve fotoğraf eklemek için Premium'a yükselt.",
}: Props) {
  const handleUpgrade = async () => {
    console.log('[RC PAYWALL] PremiumUpsellModal — upgrade tapped, opening paywall...');
    const result = await openRevenueCatPaywall();
    console.log('[RC PAYWALL] PremiumUpsellModal — paywall result:', result);

    if (result.includes("PURCHASED") || result.includes("RESTORED")) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="star" size={32} color="#F59E0B" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={{ width: '100%', marginTop: 8 }}>
            <PrimaryButton title="Premium'a Yükselt" onPress={handleUpgrade} />
          </View>

          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Daha Sonra</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#FEF3C7',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  closeText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 15,
  },
});
