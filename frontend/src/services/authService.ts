import { fetchApi, getCookie } from './apiClient';
import { UserResponse } from '../types';

export interface AuthenticationResponse {
  token: string;
  authenticated: boolean;
}

// Decode JWT token payload helper
export function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
}

export const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Strict`;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

export const authService = {
  login: async (username: string, password: string): Promise<AuthenticationResponse> => {
    return fetchApi<AuthenticationResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
  getMyInfo: async (): Promise<UserResponse> => {
    return fetchApi<UserResponse>('/users/my-info');
  },
  logout: () => {
    deleteCookie('token');
  },
  getToken: (): string | null => {
    return getCookie('token');
  },
  getRoleFromToken: (): string | null => {
    const token = getCookie('token');
    if (!token) return null;
    const decoded = decodeJwt(token);
    if (!decoded || !decoded.scope) return null;
    const scope = decoded.scope as string;
    // Strip ROLE_ prefix if present
    if (scope.startsWith('ROLE_')) {
      return scope.replace('ROLE_', '');
    }
    return scope;
  }
};
