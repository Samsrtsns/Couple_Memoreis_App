import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { ProfileData } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';
import { getCurrentSession } from '../services/authService';
import { getProfileWithPartner } from '../services/pairService';
import { identifyUser } from '../services/revenueCatService';

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

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // 1. Check persisted session
                const session = await getCurrentSession();

                if (session) {
                    // 2. We have a session, fetch profile data
                    try {
                        dispatch({ type: 'FETCH_PROFILE_START' });
                        const { profile, partner } = await getProfileWithPartner();
                        dispatch({
                            type: 'INITIALIZE',
                            payload: {
                                session,
                                user: session.user,
                                profile,
                                partner,
                            },
                        });
                    } catch (profileError) {
                        console.error('Error fetching profile during initialization:', profileError);
                        // If profile fetch fails, still initialize but without profile data
                        dispatch({
                            type: 'INITIALIZE',
                            payload: {
                                session,
                                user: session.user,
                                profile: null,
                                partner: null,
                            },
                        });
                    }
                } else {
                    // 3. No session
                    dispatch({
                        type: 'INITIALIZE',
                        payload: { session: null, user: null, profile: null, partner: null },
                    });
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                // Even on top-level error (e.g. storage issue), we must mark as initialized so app isn't stuck
                dispatch({
                    type: 'INITIALIZE',
                    payload: { session: null, user: null, profile: null, partner: null },
                });
            }
        };

        initializeAuth();

        // Listen for Auth changes (Token refresh, login, logout natively on Android/iOS storage)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth event:', event);

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'PASSWORD_RECOVERY') {
                if (session) {
                    // If it's a password recovery, we don't necessarily want to fetch the full profile 
                    // and redirect to home yet. The session is valid for updating the user.
                    if (event === 'PASSWORD_RECOVERY') {
                        console.log('Password recovery mode detected');
                        // We still need to set the session in state so the user is "authenticated" 
                        // enough to call updateUser, but we might want a different action 
                        // or just skip the profile fetch to avoid redirects.
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
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!state.user?.id) return;

        // Identify user in RevenueCat
        identifyUser(state.user.id).then(() => {
            // After identifying, the profile might have been updated to premium
            // if they were premium in RevenueCat but base in Supabase
            refreshProfile();
        }).catch(err => console.error('[RevenueCatIdentify] Failed:', err));
        
        // Subscribe to profile updates (for automatic match detection)
        const profileSubscription = supabase
            .channel(`profile-updates-${state.user.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${state.user.id}` },
                (payload) => {
                    console.log('Profile updated via realtime:', payload);
                    // Dynamically refresh profile to catch the new partner_id
                    refreshProfile();
                }
            )
            .subscribe();

        return () => {
            profileSubscription.unsubscribe();
        };
    }, [state.user?.id]); // Using state.user?.id ensures it reinits when user changes

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
