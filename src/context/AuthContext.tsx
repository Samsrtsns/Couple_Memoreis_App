import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { ProfileData } from '../hooks/useProfile';
import { getCurrentSession } from '../services/authService';
import { getProfileWithPartner } from '../services/pairService';

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
    }, []);

    const refreshProfile = async () => {
        if (!state.session?.user) return;
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
