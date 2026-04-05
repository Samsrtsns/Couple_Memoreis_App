import { Platform, Alert } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import Constants from 'expo-constants';

// Safely import native modules
let Purchases: any;
let RevenueCatUI: any;
let PAYWALL_RESULT: any;

try {
    Purchases = require('react-native-purchases').default;
    const PurchasesUI = require('react-native-purchases-ui');
    RevenueCatUI = PurchasesUI.default;
    PAYWALL_RESULT = PurchasesUI.PAYWALL_RESULT;
} catch (e) {
    // Native modules not available (Expo Go)
}

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || 'placeholder';
const ENTITLEMENT_ID = 'Memories Premium';

// Check if we should use mock mode (Expo Go or missing native module)
const isMockMode = Constants.appOwnership === 'expo' || !Purchases;

export const initRevenueCat = async () => {
    if (isMockMode) {
        console.log('[RevenueCat] Running in Mock Mode (Expo Go)');
        return;
    }

    const { LOG_LEVEL } = require('react-native-purchases');
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    }
};

/**
 * Sync RevenueCat premium status with Supabase profile
 */
export const syncPremiumStatus = async (userId: string, customerInfo: any) => {
    let isPremium = false;
    
    if (isMockMode) {
        // In mock mode, we assume the user's current Supabase state is the truth
        // or we just skip this sync to avoid overwriting with 'base'
        return;
    } else {
        isPremium = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
    }
    
    const { error } = await supabase
        .from('profiles')
        .update({ user_type: isPremium ? 'premium' : 'base' })
        .eq('id', userId);

    if (error) {
        console.error('[syncPremiumStatus] Error updating profile:', error.message);
    }
};

/**
 * Identify user in RevenueCat
 */
export const identifyUser = async (userId: string) => {
    if (isMockMode) return null;

    try {
        const { customerInfo } = await Purchases.logIn(userId);
        await syncPremiumStatus(userId, customerInfo);
        return customerInfo;
    } catch (e) {
        console.error('[identifyUser] Error:', e);
        return null;
    }
};

/**
 * Present RevenueCat Paywall or Mock Alert
 */
export const presentPremiumPaywall = async (userId: string): Promise<boolean> => {
    if (isMockMode) {
        return new Promise((resolve) => {
            Alert.alert(
                "🚀 Premium Simülasyonu",
                "Şu an Expo Go (Mock Modu) kullanıyorsunuz. Gerçek ödeme ekranı yerine satın alımı simüle etmek ister misiniz?",
                [
                    { 
                        text: "Vazgeç", 
                        onPress: () => resolve(false), 
                        style: "cancel" 
                    },
                    { 
                        text: "Satın Al (Simüle Et)", 
                        onPress: async () => {
                            const { error } = await supabase
                                .from('profiles')
                                .update({ user_type: 'premium' })
                                .eq('id', userId);
                            
                            if (error) {
                                Alert.alert("Hata", "Profil güncellenemedi: " + error.message);
                                resolve(false);
                            } else {
                                resolve(true);
                            }
                        } 
                    }
                ]
            );
        });
    }

    try {
        const paywallResult = await RevenueCatUI.presentPaywall();

        if (paywallResult === PAYWALL_RESULT.PURCHASED || paywallResult === PAYWALL_RESULT.RESTORED) {
            const customerInfo = await Purchases.getCustomerInfo();
            await syncPremiumStatus(userId, customerInfo);
            return true;
        }
        return false;
    } catch (e) {
        console.error('[presentPremiumPaywall] Error:', e);
        return false;
    }
};

/**
 * Check current entitlement status
 */
export const isUserPremium = async (): Promise<boolean> => {
    if (isMockMode) return false; // Default to false in mock, let Supabase decide

    try {
        const customerInfo = await Purchases.getCustomerInfo();
        return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
    } catch {
        return false;
    }
};
