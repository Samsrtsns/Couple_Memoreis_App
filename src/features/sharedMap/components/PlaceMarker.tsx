/**
 * PlaceMarker — küçük kalp harita işareti (çerçeve yok).
 *
 * tracksViewChanges: native marker görüntüsünün güncellenmesi için kısa süre true.
 */

import { Ionicons } from "@expo/vector-icons";
import React, { memo, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import type { SharedPlace } from "../types/sharedPlace.types";

type Props = {
  place: SharedPlace;
  isSelected: boolean;
  onPress: (place: SharedPlace) => void;
};

function PlaceMarker({ place, isSelected, onPress }: Props) {
  const [tracksViews, setTracksViews] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTracksViews(true);
    timerRef.current && clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setTracksViews(false);
    }, 300);

    return () => {
      timerRef.current && clearTimeout(timerRef.current);
    };
  }, [isSelected]);

  return (
    <Marker
      coordinate={{ latitude: place.latitude, longitude: place.longitude }}
      onPress={() => onPress(place)}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViews}
    >
      <View style={styles.hitArea} pointerEvents="box-none">
        <Ionicons
          name="heart"
          size={isSelected ? 22 : 20}
          color={isSelected ? "#BE123C" : "#F43F5E"}
        />
      </View>
    </Marker>
  );
}

export default memo(PlaceMarker);

const styles = StyleSheet.create({
  hitArea: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 36,
    minHeight: 36,
  },
});
