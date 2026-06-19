
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import restaurantReducer from "./slices/restaurantSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    restaurant: restaurantReducer,
  },
});


// Auto-persist auth state to localStorage on every change
store.subscribe(() => {
  const { auth } = store.getState();
  if (auth.user && auth.accessToken) {
    localStorage.setItem(
      "fb_auth_state",
      JSON.stringify({
        user: auth.user,
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
      })
    );
  }
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
