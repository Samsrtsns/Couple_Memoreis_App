import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { supabase } from "@/src/lib/supabase";

const IOS_CLIENT_ID =
  "44114191155-ie86vc3812stbq70mc8s3k7e7p4r9hid.apps.googleusercontent.com";
const WEB_CLIENT_ID =
  "44114191155-sieitoa5oscf3tshl6258iumhfjnv3tg.apps.googleusercontent.com";

GoogleSignin.configure({
  iosClientId: IOS_CLIENT_ID,
  webClientId: WEB_CLIENT_ID,
});

export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    if (response.type !== "success") {
      return null;
    }

    const idToken = response.data?.idToken;
    if (!idToken) {
      throw new Error("Google Sign-In did not return an ID token.");
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });

    if (error) throw new Error(error.message);

    if (data.user) {
      const meta = data.user.user_metadata;
      const firstName = meta?.full_name?.split(" ")[0] ?? meta?.name ?? "";
      const lastName =
        meta?.full_name?.split(" ").slice(1).join(" ") ??
        meta?.family_name ??
        "";

      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          email: data.user.email,
        },
        { onConflict: "id" },
      );
    }

    return data;
  } catch (error) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          return null;
        case statusCodes.IN_PROGRESS:
          return null;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          throw new Error("Google Play Services is not available.");
        default:
          throw error;
      }
    }
    throw error;
  }
}
