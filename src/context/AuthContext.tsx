import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ProfileData } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';
import { getCurrentSession } from '../services/authService';
import { getProfileWithPartner } from '../services/pairService';
import { identifyUser } from '../services/revenueCatService';

const AUTH_INIT_TIMEOUT_MS = 15_000;

// --- Types ---
type AuthState = {
    isInitialized: boolean;
    isLoggedIn: boolean;
    session: Session | null;
    user: User | null;
    profile: ProfileData | null;
    partner: ProfileData | null;
    isFetchingProfile: boolean;
};

type Action =
    | { type: 'INITIALIZE'; payload: { session: Session | null; user: User | null; profile: ProfileData | null; partner: ProfileData | null } }
    | { type: 'LOGIN_SUCCESS'; payload: { session: Session; user: User; profile: ProfileData | null; partner: ProfileData | null } }
    | { type: 'LOGOUT' }
    | { type: 'FETCH_PROFILE_START' }
    | { type: 'FETCH_PROFILE_SUCCESS'; payload: { profile: ProfileData | null; partner: ProfileData | null } }
    | { type: 'FETCH_PROFILE_ERROR' };

// --- Initial State ---
const initialState: AuthState = {
    isInitialized: false,
    isLoggedIn: false,
    session: null,
    user: null,
    profile: null,
    partner: null,
    isFetchingProfile: false,
};

// --- Reducer ---
function authReducer(state: AuthState, action: Action): AuthState {
    switch (action.type) {
        case 'INITIALIZE':
            return {
                ...state,
                isInitialized: true,
                isLoggedIn: !!action.payload.session,
                session: action.payload.session,
                user: action.payload.user,
                profile: action.payload.profile,
                partner: action.payload.partner,
            };
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                isInitialized: true,
                isLoggedIn: true,
                session: action.payload.session,
                user: action.payload.user,
                profile: action.payload.profile,
                partner: action.payload.partner,
            };
        case 'LOGOUT':
            return {
                ...state,
                isLoggedIn: false,
                session: null,
                user: null,
                profile: null,
                partner: null,
            };
        case 'FETCH_PROFILE_START':
            return {
                ...state,
                isFetchingProfile: true,
            };
        case 'FETCH_PROFILE_SUCCESS':
            return {
                ...state,
                isFetchingProfile: false,
                profile: action.payload.profile,
                partner: action.payload.partner,
            };
        case 'FETCH_PROFILE_ERROR':
            return {
                ...state,
                isFetchingProfile: false,
            };
        default:
            return state;
    }
}

// --- Context ---
type AuthContextType = {
    state: AuthState;
    dispatch: React.Dispatch<Action>;
    refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(authReducer, initialState);
    const stateRef = useRef(state);
    stateRef.current = state;

    // Manage Supabase auto-refresh based on app foreground/background state.
    useEffect(() => {
        const sub = AppState.addEventListener('change', (status: AppStateStatus) => {
            if (status === 'active') {
                supabase.auth.startAutoRefresh();
            } else {
                supabase.auth.stopAutoRefresh();
            }
        });
        return () => sub.remove();
    }, []);

    useEffect(() => {
        let didInit = false;

        const safeInitialize = (payload: {
            session: Session | null;
            user: User | null;
            profile: ProfileData | null;
            partner: ProfileData | null;
        }) => {
            if (didInit) return;
            didInit = true;
            dispatch({ type: 'INITIALIZE', payload });
        };

        const initializeAuth = async () => {
            try {
                const session = await getCurrentSession();
                if (didInit) return;

                if (session) {
                    try {
                        dispatch({ type: 'FETCH_PROFILE_START' });
                        const { profile, partner } = await getProfileWithPartner();
                        safeInitialize({ session, user: session.user, profile, partner });
                    } catch (profileError) {
                        console.error('Error fetching profile during initialization:', profileError);
                        safeInitialize({ session, user: session.user, profile: null, partner: null });
                    }
                } else {
                    safeInitialize({ session: null, user: null, profile: null, partner: null });
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                if (didInit) return;
                try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
                safeInitialize({ session: null, user: null, profile: null, partner: null });
            }
        };

        initializeAuth();

        const timeoutId = setTimeout(() => {
            if (!didInit) {
                console.warn('[Auth] Initialization timed out after', AUTH_INIT_TIMEOUT_MS, 'ms');
                safeInitialize({ session: null, user: null, profile: null, partner: null });
            }
        }, AUTH_INIT_TIMEOUT_MS);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth event:', event);

            if (!didInit && (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
                return;
            }

            if (event === 'USER_UPDATED') {
                if (session) {
                    const current = stateRef.current;
                    dispatch({
                        type: 'LOGIN_SUCCESS',
                        payload: {
                            session,
                            user: session.user,
                            profile: current.profile,
                            partner: current.partner,
                        },
                    });
                }
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'PASSWORD_RECOVERY') {
                if (session) {
                    if (event === 'PASSWORD_RECOVERY') {
                        console.log('Password recovery mode detected');
                    }

                    try {
                        dispatch({ type: 'FETCH_PROFILE_START' });
                        const { profile, partner } = await getProfileWithPartner();
                        dispatch({
                            type: 'LOGIN_SUCCESS',
                            payload: { session, user: session.user, profile, partner },
                        });
                    } catch (error) {
                        dispatch({
                            type: 'LOGIN_SUCCESS',
                            payload: { session, user: session.user, profile: null, partner: null },
                        });
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                dispatch({ type: 'LOGOUT' });
            }
        });

        return () => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!state.user?.id) return;

        identifyUser(state.user.id).then(() => {
            refreshProfile();
        }).catch(err => console.error('[RevenueCatIdentify] Failed:', err));

        const profileSubscription = supabase
            .channel(`profile-updates-${state.user.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${state.user.id}` },
                (payload) => {
                    console.log('Profile updated via realtime:', payload);
                    refreshProfile();
                }
            )
            .subscribe();

        return () => {
            profileSubscription.unsubscribe();
        };
    }, [state.user?.id]);

    const refreshProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        try {
            dispatch({ type: 'FETCH_PROFILE_START' });
            const { profile, partner } = await getProfileWithPartner();
            dispatch({
                type: 'FETCH_PROFILE_SUCCESS',
                payload: { profile, partner },
            });
        } catch (error) {
            console.error('Error refreshing profile:', error);
            dispatch({ type: 'FETCH_PROFILE_ERROR' });
        }
    };

    return (
        <AuthContext.Provider value={{ state, dispatch, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

// --- Custom Hook ---
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
