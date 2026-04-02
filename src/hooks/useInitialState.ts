import { getCurrentSession } from "@/src/services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";

/**
 * Uygulamanın başlangıç durumunu kontrol eden ve kullanıcıyı 
 * doğru ekrana (Onboarding, Login veya Home) yönlendiren özel hook.
 */
export function useInitialState() {
    // Kontrol işleminin devam edip etmediğini tutan state
    const [isChecking, setIsChecking] = useState(true);

    // Hook yüklendiğinde kontrol işlemini başlat
    useEffect(() => {
        checkInitialState();
    }, []);

    /**
     * Başlangıç durumunu kontrol eden ana fonksiyon
     */
    const checkInitialState = async () => {
        try {
            // Splash ekranının görünmesi için kısa bir süre bekle (1.5 saniye)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Uygulamanın daha önce açılıp açılmadığını kontrol et
            const hasLaunched = await AsyncStorage.getItem("hasLaunched");

            if (hasLaunched === null || hasLaunched === "false") {
                // Eğer uygulama ilk kez açılıyorsa Onboarding ekranına yönlendir
                router.replace("/(onboarding)/onboarding");
                return;
            }

            // Aktif bir kullanıcı oturumu olup olmadığını kontrol et
            const session = await getCurrentSession();

            if (session) {
                // Oturum varsa ana sayfaya yönlendir
                router.replace("/(tabs)/home");
            } else {
                // Oturum yoksa giriş sayfasına yönlendir
                router.replace("/(auth)/login");
            }
        } catch (error) {
            // Herhangi bir hata durumunda konsola hatayı yazdır ve login'e yönlendir
            console.error("Initial routing error:", error);
            router.replace("/(auth)/login");
        } finally {
            // İşlem bittiğinde yükleme durumunu kapat
            setIsChecking(false);
        }
    };

    // Yükleme durumunu dışarıya döndür
    return { isChecking };
}
