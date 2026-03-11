import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { authService, LoginPayload, RegisterPayload, UserData, ResetPasswordPayload } from "@/services/authService";

interface AuthState {
    loading: boolean;
    error: string | null;
    user: UserData | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    loading: false,
    error: null,
    user: null,
    isAuthenticated: false,
};

// Async Thunks
export const loginUser = createAsyncThunk(
    "auth/login",
    async (payload: LoginPayload, { rejectWithValue }) => {
        try {
            const response = await authService.login(payload);
            if (response.success) {
                localStorage.setItem("accessToken", response.data.accessToken);
                localStorage.setItem("refreshToken", response.data.refreshToken);
                localStorage.setItem("user", JSON.stringify(response.data));
                return response.data;
            } else {
                return rejectWithValue(response.message || "Login failed");
            }
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || "Login failed");
        }
    }
);

export const registerUser = createAsyncThunk(
    "auth/register",
    async (payload: RegisterPayload, { rejectWithValue }) => {
        try {
            const response = await authService.register(payload);
            if (response.success) {
                localStorage.setItem("accessToken", response.data.accessToken);
                localStorage.setItem("refreshToken", response.data.refreshToken);
                localStorage.setItem("user", JSON.stringify(response.data));
                return response.data;
            } else {
                return rejectWithValue(response.message || "Registration failed");
            }
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || "Registration failed");
        }
    }
);

export const logoutUser = createAsyncThunk(
    "auth/logout",
    async (_, { rejectWithValue }) => {
        try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
        } catch (err) {
            // Ignore logout errors
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
        }
    }
);

export const googleLoginUser = createAsyncThunk(
    "auth/googleLogin",
    async ({ code, redirectUri }: { code: string; redirectUri: string }, { rejectWithValue }) => {
        try {
            const response = await authService.googleLogin(code, redirectUri);
            if (response.success) {
                localStorage.setItem("accessToken", response.data.accessToken);
                localStorage.setItem("refreshToken", response.data.refreshToken);
                localStorage.setItem("user", JSON.stringify(response.data));
                return response.data;
            } else {
                return rejectWithValue(response.message || "Google login failed");
            }
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || "Google login failed");
        }
    }
);

export const forgotPassword = createAsyncThunk(
    "auth/forgotPassword",
    async (email: string, { rejectWithValue }) => {
        try {
            const response = await authService.forgotPassword(email);
            return response;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || "Failed to send reset email");
        }
    }
);

export const resetPassword = createAsyncThunk(
    "auth/resetPassword",
    async (payload: ResetPasswordPayload, { rejectWithValue }) => {
        try {
            const response = await authService.resetPassword(payload);
            return response;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || "Password reset failed");
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        initializeAuth: (state) => {
            if (typeof window !== "undefined") {
                const userStr = localStorage.getItem("user");
                if (userStr) {
                    state.user = JSON.parse(userStr);
                    state.isAuthenticated = true;
                }
            }
        },
        loginStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        loginSuccess: (state, action: PayloadAction<any>) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.user = action.payload;
        },
        loginFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Login
        builder.addCase(loginUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(loginUser.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
            state.isAuthenticated = true;
            state.error = null;
        });
        builder.addCase(loginUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Register
        builder.addCase(registerUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(registerUser.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
            state.isAuthenticated = true;
            state.error = null;
        });
        builder.addCase(registerUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Logout
        builder.addCase(logoutUser.fulfilled, (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.error = null;
        });

        // Google Login
        builder.addCase(googleLoginUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(googleLoginUser.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
            state.isAuthenticated = true;
            state.error = null;
        });
        builder.addCase(googleLoginUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Forgot Password
        builder.addCase(forgotPassword.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(forgotPassword.fulfilled, (state) => {
            state.loading = false;
            state.error = null;
        });
        builder.addCase(forgotPassword.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Reset Password
        builder.addCase(resetPassword.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(resetPassword.fulfilled, (state) => {
            state.loading = false;
            state.error = null;
        });
        builder.addCase(resetPassword.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
    },
});

export const { initializeAuth, loginStart, loginSuccess, loginFailure, clearError } = authSlice.actions;

export default authSlice.reducer;
