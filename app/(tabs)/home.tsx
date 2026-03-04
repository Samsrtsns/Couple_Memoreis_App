import Screen from "@/src/components/Screen";
import { Text, View } from "react-native";

export default function HomeScreen() {
    return (
        <Screen>
            <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 26, fontWeight: "700" }}>Ana Ekran</Text>
                <Text>Buraya dashboard / sayaçlar / özel günler gelecek.</Text>
            </View>
        </Screen>
    );
}