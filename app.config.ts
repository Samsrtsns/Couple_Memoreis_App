import 'dotenv/config';

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export default {
  expo: {
    name: 'forLovers',
    slug: 'forLovers',
    version: '1.0.4',
    orientation: 'portrait',
    icon: './assets/images/app_icon_expo.png',
    scheme: 'forlovers',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/images/app_icon_png.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      buildNumber: '4',
      config: {
        googleMapsApiKey,
      },
      bundleIdentifier: 'com.sametkatidev.forLovers',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      appleTeamId: 'U278U8U2L4',
    },
    android: {
      softwareKeyboardLayoutMode: 'resize',
      versionCode: 2,
      adaptiveIcon: {
        backgroundColor: '#ffffff',
        foregroundImage: './assets/images/app_icon_expo.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
      permissions: [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
      ],
      package: 'com.sametkatidev.forlovers',
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/app_icon_png.png',
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      '@react-native-community/datetimepicker',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow forLovers to use your location to save shared places.',
        },
      ],
      'expo-font',
      '@react-native-google-signin/google-signin',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'f9898aec-68a4-4543-b497-43aadff4048e',
      },
    },
  },
};
