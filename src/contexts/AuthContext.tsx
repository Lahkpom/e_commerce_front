import type { ReactNode } from 'react';
import { createContext, useEffect, useState } from 'react';
import type {
  AuthResponse,
  AuthState,
  ChangePasswordRequest,
  ExpiredPasswordResetRequest,
  LoginCredentials,
  RegisterRequest,
  UserResponse,
  UserRole,
} from '../types/auth';
import {
  apiRequest,
  clearStoredTokens,
  getStoredRefreshToken,
  getStoredToken,
  setStoredRefreshToken,
  setStoredToken,
} from '../services/api';

type AuthResult<T> = { data: T | null; error: Error | null; passwordExpired?: boolean };
type ProfileUpdates = Partial<Pick<UserResponse, 'userName' | 'userPhone' | 'taxIdType' | 'taxIdNumber'>>;

interface AuthContextValue extends AuthState {
  profile: UserResponse | null;
  role: UserRole | null;
  isAdmin: boolean;
  isCustomer: boolean;
  isWholesaler: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResult<AuthResponse>>;
  signIn: (email: string, password: string) => Promise<AuthResult<AuthResponse>>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  register: (request: RegisterRequest) => Promise<AuthResult<UserResponse>>;
  updateProfile: (updates: ProfileUpdates) => Promise<AuthResult<UserResponse>>;
  changePassword: (payload: ChangePasswordRequest) => Promise<AuthResult<UserResponse>>;
  changeExpiredPassword: (
    payload: ExpiredPasswordResetRequest,
  ) => Promise<AuthResult<AuthResponse>>;
}

const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextValue | null>(null);

const getError = (error: unknown, fallback: string): Error =>
  error instanceof Error ? error : new Error(fallback);

const isExpiredPasswordError = (error: Error): boolean =>
  /expiró|restablezca su clave/i.test(error.message);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  const clearSession = () => {
    setAuthState({ ...initialAuthState, isLoading: false });
    setProfile(null);
    setRole(null);
    clearStoredTokens();
  };

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const user = await apiRequest<UserResponse>('/auth/me');
        setAuthState({
          user,
          token: getStoredToken(),
          isAuthenticated: true,
          isLoading: false,
        });
        setProfile(user);
        setRole(user.userRole);
      } catch (error) {
        console.error('Error validating session:', error);
        clearSession();
      }
    };

    if (getStoredToken()) {
      void restoreSession();
    } else {
      setAuthState({ ...initialAuthState, isLoading: false });
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResult<AuthResponse>> => {
    try {
      const data = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: credentials,
      });

      setStoredToken(data.accessToken);
      setStoredRefreshToken(data.refreshToken);
      setAuthState({
        user: data.user,
        token: data.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
      setProfile(data.user);
      setRole(data.user.userRole);

      return { data, error: null };
    } catch (error) {
      const loginError = getError(error, 'Error de autenticación');
      return {
        data: null,
        error: loginError,
        passwordExpired: isExpiredPasswordError(loginError),
      };
    }
  };

  const signIn = (email: string, password: string) => login({ email, password });

  const changeExpiredPassword = async (
    payload: ExpiredPasswordResetRequest,
  ): Promise<AuthResult<AuthResponse>> => {
    try {
      const data = await apiRequest<AuthResponse>('/auth/change-expired-password', {
        method: 'POST',
        body: payload,
      });

      setStoredToken(data.accessToken);
      setStoredRefreshToken(data.refreshToken);
      setAuthState({
        user: data.user,
        token: data.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
      setProfile(data.user);
      setRole(data.user.userRole);

      return { data, error: null };
    } catch (error) {
      return { data: null, error: getError(error, 'No se pudo renovar la contraseña') };
    }
  };

  const logout = async (): Promise<void> => {
    const refreshToken = getStoredRefreshToken();
    try {
      if (refreshToken) {
        await apiRequest<void>('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
        });
      }
    } finally {
      clearSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/iniciar_sesion';
      }
    }
  };

  const register = async (request: RegisterRequest): Promise<AuthResult<UserResponse>> => {
    try {
      const data = await apiRequest<UserResponse>('/auth/register', {
        method: 'POST',
        body: request,
      });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: getError(error, 'Error en registro') };
    }
  };

  const updateProfile = async (updates: ProfileUpdates): Promise<AuthResult<UserResponse>> => {
    if (!authState.user) {
      return { data: null, error: new Error('No hay usuario autenticado') };
    }

    try {
      const data = await apiRequest<UserResponse>(`/users/${encodeURIComponent(authState.user.userId)}`, {
        method: 'PUT',
        body: {
          name: updates.userName ?? authState.user.userName,
          phone: updates.userPhone === undefined ? authState.user.userPhone : updates.userPhone || null,
          taxIdType: updates.taxIdType === undefined ? authState.user.taxIdType : updates.taxIdType || null,
          taxIdNumber: updates.taxIdNumber === undefined ? authState.user.taxIdNumber : updates.taxIdNumber || null,
        },
      });
      setAuthState((current) => ({ ...current, user: data }));
      setProfile(data);
      setRole(data.userRole);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: getError(error, 'Error actualizando perfil') };
    }
  };

  const changePassword = async (payload: ChangePasswordRequest): Promise<AuthResult<UserResponse>> => {
    if (!authState.user) {
      return { data: null, error: new Error('No hay usuario autenticado') };
    }

    try {
      const data = await apiRequest<UserResponse>(
        `/users/${encodeURIComponent(authState.user.userId)}/password`,
        {
          method: 'PATCH',
          body: payload,
        },
      );
      setAuthState((current) => ({ ...current, user: data }));
      setProfile(data);
      setRole(data.userRole);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: getError(error, 'Error actualizando la contraseña') };
    }
  };

  const isAdmin = ['ADMIN', 'OPERATOR'].includes(role ?? '');
  const isCustomer = role === 'CUSTOMER';
  const isWholesaler = role === 'WHOLESALER';
  const signOut = logout;

  const value: AuthContextValue = {
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    profile,
    role,
    isAdmin,
    isCustomer,
    isWholesaler,
    login,
    signIn,
    logout,
    signOut,
    register,
    updateProfile,
    changePassword,
    changeExpiredPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
