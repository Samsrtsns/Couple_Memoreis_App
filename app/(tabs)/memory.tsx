import Screen from "@/src/components/Screen";
import { Text, View } from "react-native";

export default function MemoryScreen() {
    return (
        <Screen>
            <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 26, fontWeight: "700" }}>Memery</Text>
                <Text>Buraya albümler / anılar listesi gelecek.</Text>
            </View>
        </Screen>
    );
}