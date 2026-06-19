import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type RoleType = "Customer" | "Vendor" | "Admin" | "Agent" | "Staff";
export type StaffRole = "manager" | "waiter" | "kitchen" | "cashier" | null;

export interface AuthUser {
  id: string;
  name: string | null;
  mobileNumber: string;
  roleType: RoleType;
  staffRole?: StaffRole;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  hydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authStart(state) {
      state.loading = true;
    },
    authSuccess(
      state,
      action: PayloadAction<{
        user: AuthUser;
        accessToken: string;
        refreshToken: string;
      }>
    ) {
      state.loading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.hydrated = true; // ✅ FIX 1: mark hydrated so routes render immediately

      // ✅ FIX 2: persist to localStorage so session survives page refresh
      localStorage.setItem(
        "fb_auth_state",
        JSON.stringify({
          user: action.payload.user,
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
        })
      );
    },
    authFailure(state) {
      state.loading = false;
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.hydrated = true;

      // ✅ FIX 3: clear localStorage on logout
      localStorage.removeItem("fb_auth_state");
    },
    hydrateFromStorage(state, action: PayloadAction<Partial<AuthState>>) {
      return {
        ...state,
        ...action.payload,
        hydrated: true,
      };
    },
  },
});

export const {
  authStart,
  authSuccess,
  authFailure,
  logout,
  hydrateFromStorage,
} = authSlice.actions;

export default authSlice.reducer;