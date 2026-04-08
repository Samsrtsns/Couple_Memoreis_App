import { View } from "react-native";

/**
 * İlk rota: kısa yükleme; native splash ile aynı düz beyaz (#fff).
 * Yönlendirme app/_layout NavigationRoot'ta (auth + hasLaunched).
 */
export default function Index() {
    return <View className="flex-1 bg-white" />;
}
