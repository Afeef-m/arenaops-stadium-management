import { api } from './axios';

// UserData contains only identity/profile info — auth tokens are managed by HttpOnly cookies
export interface UserData {
    userId: string;
    roles: string[];
    isNewUser: boolean;
    fullName: string;
    email: string;
}

export interface AuthResponse {
    success: boolean;
    data: UserData;
    message: string | null;
    error: string | null;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    email: string;
    password: string;
    fullName: string;
    role?: string;
}

export interface ResetPasswordPayload {
    email: string;
    otp: string;
    newPassword: string;
}

export const authService = {
    login: async (payload: LoginPayload): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/api/auth/login', payload);
        return response.data;
    },

    register: async (payload: RegisterPayload): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/api/auth/register', payload);
        return response.data;
    },

    // No body needed — refreshToken is sent automatically via HttpOnly cookie
    refreshToken: async (): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/api/auth/refresh', {});
        return response.data;
    },

    // No body needed — both tokens are sent automatically via HttpOnly cookies
    logout: async (): Promise<{ success: boolean; message: string }> => {
        const response = await api.post('/api/auth/logout');
        return response.data;
    },

    googleLogin: async (code: string, redirectUri: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/api/auth/google', { code, redirectUri });
        return response.data;
    },

    forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.post('/api/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (payload: ResetPasswordPayload): Promise<{ success: boolean; message: string }> => {
        const response = await api.post('/api/auth/reset-password', payload);
        return response.data;
    }
};
