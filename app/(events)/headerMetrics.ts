import { Platform } from 'react-native';

/** Nav bar’da başlık satırının tipik iç yüksekliği (status bar hariç) — ikonları dikey ortalamak için */
export const HEADER_BAR_CONTENT_HEIGHT = Platform.OS === 'ios' ? 44 : 56;

export const HEADER_HIT = 36;
export const HEADER_ICON_SM = 24;
