import Screen from "@/src/components/Screen";
import { Text, View } from "react-native";

export default function MapScreen() {
    return (
        <Screen>
            <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 26, fontWeight: "700" }}>Harita</Text>
                <Text>Buraya pinler / harita görünümü gelecek.</Text>
            </View>
        </Screen>
    );
}