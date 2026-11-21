import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse } from '../types/auth';

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
export const AUTH_TOKEN_KEY = 'calwill_fiorella_access_token';
export const REFRESH_TOKEN_KEY = 'calwill_fiorella_refresh_token';
const LOGIN_ROUTE = '/iniciar_sesion';

type ApiRequestOptions = Omit<AxiosRequestConfig, 'baseURL' | 'data' | 'url'> & {
  body?: unknown;
  credentials?: RequestCredentials;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _refreshRetry?: boolean;
};

const apiClient = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: true,
});

let refreshRequest: Promise<AuthResponse> | null = null;

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setStoredToken = (token: string | null): void => {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const getStoredRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setStoredRefreshToken = (token: string | null): void => {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const clearStoredTokens = (): void => {
  setStoredToken(null);
  setStoredRefreshToken(null);
};

const handleUnauthorized = (): void => {
  clearStoredTokens();
  if (typeof window !== 'undefined') {
    window.location.href = LOGIN_ROUTE;
  }
};

const getRequestPath = (config: Pick<InternalAxiosRequestConfig, 'url' | 'baseURL'>): string =>
  new URL(config.url ?? '', config.baseURL ?? BASE_API_URL).pathname;

apiClient.interceptors.request.use((config) => {
  const requestPath = getRequestPath(config);
  const isAuthExchange = requestPath.endsWith('/auth/login')
    || requestPath.endsWith('/auth/refresh')
    || requestPath.endsWith('/auth/change-expired-password');
  const token = isAuthExchange ? null : getStoredToken();

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

apiClient.interceptors.response.use(undefined, (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
    return Promise.reject(error);
  }

  const requestConfig = error.config as RetryableRequestConfig;
  const requestPath = getRequestPath(requestConfig);
  const isLoginRequest = requestPath.endsWith('/auth/login')
    || requestPath.endsWith('/auth/change-expired-password');
  const isRefreshRequest = requestPath.endsWith('/auth/refresh');

  if (isLoginRequest) return Promise.reject(error);

  if (isRefreshRequest || requestConfig._refreshRetry) {
    handleUnauthorized();
    return Promise.reject(error);
  }

  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    handleUnauthorized();
    return Promise.reject(error);
  }

  requestConfig._refreshRetry = true;
  if (!refreshRequest) {
    refreshRequest = axios.post<AuthResponse>(
      `${BASE_API_URL}/auth/refresh`,
      { refreshToken },
      { withCredentials: true },
    )
      .then(({ data }) => {
        setStoredToken(data.accessToken);
        setStoredRefreshToken(data.refreshToken);
        return data;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest
    .then(({ accessToken }) => {
      requestConfig.headers.set('Authorization', `Bearer ${accessToken}`);
      return accessToken;
    })
    .catch((refreshError: unknown) => {
      handleUnauthorized();
      return Promise.reject(refreshError);
    })
    .then(() => apiClient.request(requestConfig));
});

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const responseData: unknown = error.response?.data;

    if (typeof responseData === 'string' && responseData.trim()) {
      return responseData;
    }

    if (typeof responseData === 'object' && responseData !== null) {
      const errorResponse = responseData as { message?: unknown; error?: unknown; detail?: unknown };
      if (typeof errorResponse.message === 'string' && errorResponse.message.trim()) {
        return errorResponse.message;
      }
      if (typeof errorResponse.detail === 'string' && errorResponse.detail.trim()) {
        return errorResponse.detail;
      }
      if (typeof errorResponse.error === 'string' && errorResponse.error.trim()) {
        return errorResponse.error;
      }
    }

    if (error.response?.status === 401) {
      return 'Sesión expirada. Iniciá sesión de nuevo.';
    }

    return error.message || 'Error en la petición de la API';
  }

  return error instanceof Error ? error.message : 'Error en la petición de la API';
};

export const apiRequest = async <T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const { body, credentials, ...requestOptions } = options;

  try {
    const response = await apiClient.request<T>({
      ...requestOptions,
      url: path.startsWith('/') ? path : `/${path}`,
      data: body,
      withCredentials: credentials !== 'omit',
    });

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export default {
  apiRequest,
  getStoredToken,
  setStoredToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
  clearStoredTokens,
};
