import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type { Session, User } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setGoogleAuthInProgress } from "@/src/context/AuthContext";
import { supabase } from "@/src/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const APP_SCHEME = "forlovers";
const OAUTH_REDIRECT_PATH = "auth/callback";

// Google provider configuration in Supabase should include this callback URL:
// https://xktadrdupgkxppgzkcpf.supabase.co/auth/v1/callback
// On mobile, redirectTo must point back to the app scheme.
const REDIRECT_TO = Linking.createURL(OAUTH_REDIRECT_PATH, {
  scheme: APP_SCHEME,
});

function log(tag: string, ...args: unknown[]) {
  console.log(`[GOOGLE AUTH ${tag}]`, ...args);
}

type SignInWithGoogleOptions = {
  setLoading?: (value: boolean) => void;
};

export type GoogleAuthResult = {
  session: Session;
  user: User;
  isNewUser: boolean;
  hasNameInProfile: boolean;
};

function getTokenFromUrl(url: string, key: string): string | null {
  const [withoutFragment, fragment = ""] = url.split("#");
  const query = withoutFragment.includes("?")
    ? withoutFragment.split("?")[1]
    : "";

  const queryParams = new URLSearchParams(query);
  const fragmentParams = new URLSearchParams(fragment);

  return queryParams.get(key) ?? fragmentParams.get(key);
}

export async function signInWithGoogle(
  options: SignInWithGoogleOptions = {},
): Promise<GoogleAuthResult | null> {
  const { setLoading } = options;
  log("START", "Google sign-in started");
  log("CONFIG", { redirectTo: REDIRECT_TO });
  setLoading?.(true);

  try {
    log("OAUTH", "Requesting OAuth URL from Supabase");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: REDIRECT_TO,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) throw new Error(error.message);
    if (!data?.url) throw new Error("Google OAuth URL could not be created.");
    log("OAUTH", "OAuth URL received");

    log("BROWSER", "Opening auth session in browser");
    const authResult = await WebBrowser.openAuthSessionAsync(
      data.url,
      REDIRECT_TO,
    );
    log("BROWSER", "Auth session finished with type:", authResult.type);

    if (authResult.type !== "success" || !authResult.url) {
      log("CANCELLED", "User cancelled or no callback URL returned");
      return null;
    }
    log("CALLBACK", "Callback URL received");

    const oauthError =
      getTokenFromUrl(authResult.url, "error") ??
      getTokenFromUrl(authResult.url, "error_code");
    const oauthErrorDescription = getTokenFromUrl(
      authResult.url,
      "error_description",
    );

    if (oauthError) {
      log("ERROR", "OAuth returned error", {
        oauthError,
        oauthErrorDescription,
      });
      throw new Error(oauthErrorDescription ?? oauthError);
    }

    const accessToken = getTokenFromUrl(authResult.url, "access_token");
    const refreshToken = getTokenFromUrl(authResult.url, "refresh_token");
    log("TOKEN", "Token parse result", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.length ?? 0,
      refreshTokenLength: refreshToken?.length ?? 0,
    });

    if (!accessToken || !refreshToken) {
      throw new Error("OAuth tokens are missing in Google callback URL.");
    }

    setGoogleAuthInProgress(true);
    log("SESSION", "Setting Supabase session");
    const { data: sessionData, error: sessionError } =
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

    if (sessionError) throw new Error(sessionError.message);

    const session = sessionData.session ?? null;
    const user = session?.user ?? null;
    if (!user) throw new Error("Google authentication completed but no user.");

    const createdAtMs = user.created_at ? new Date(user.created_at).getTime() : 0;
    const lastSignInAtMs = user.last_sign_in_at
      ? new Date(user.last_sign_in_at).getTime()
      : 0;
    const isNewUser =
      !!createdAtMs &&
      !!lastSignInAtMs &&
      Math.abs(lastSignInAtMs - createdAtMs) < 15_000;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    const firstName = profileData?.first_name?.trim() ?? "";
    const lastName = profileData?.last_name?.trim() ?? "";
    const hasNameInProfile = firstName.length > 0 && lastName.length > 0;
    const hasNameInMetadata =
      typeof user.user_metadata?.given_name === "string" &&
      typeof user.user_metadata?.family_name === "string" &&
      user.user_metadata.given_name.trim().length > 0 &&
      user.user_metadata.family_name.trim().length > 0;
    const hasName = hasNameInProfile || hasNameInMetadata;
    const shouldCollectName = isNewUser || !hasName;

    // Ensure profile row exists immediately after OAuth so auth-state listeners
    // can hydrate profile-dependent UI without waiting for a refresh/restart.
    const fallbackFirstName =
      typeof user.user_metadata?.given_name === "string"
        ? user.user_metadata.given_name.trim()
        : "";
    const fallbackLastName =
      typeof user.user_metadata?.family_name === "string"
        ? user.user_metadata.family_name.trim()
        : "";
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        first_name: firstName || fallbackFirstName || null,
        last_name: lastName || fallbackLastName || null,
      },
      { onConflict: "id" },
    );

    if (shouldCollectName) {
      log("FLAG", "User requires onboarding name step — setting pendingGoogleOnboarding");
      await AsyncStorage.setItem("pendingGoogleOnboarding", "true");
    } else {
      log("FLAG", "Existing user with name — removing pendingGoogleOnboarding flag");
      await AsyncStorage.removeItem("pendingGoogleOnboarding");
    }

    log("SUCCESS", "Authenticated user", {
      id: user.id,
      email: user.email,
      isAnonymous: user.is_anonymous,
      isNewUser,
      hasNameInProfile: hasName,
    });

    return {
      session,
      user,
      isNewUser,
      hasNameInProfile: hasName,
    };
  } catch (error) {
    log("FAIL", error);
    throw error instanceof Error
      ? error
      : new Error("Google sign-in failed unexpectedly.");
  } finally {
    setGoogleAuthInProgress(false);
    log("END", "Google sign-in finished");
    setLoading?.(false);
  }
}
