import { useCallback } from "react";
import { useAppDispatch } from "./useAppDispatch";
import { useAppSelector } from "./useAppSelector";
import { logout } from "../store/slices/authSlice";
import { clearRestaurant } from "../store/slices/restaurantSlice";
import { authService } from "../services/auth.service";
import { useNavigate } from "react-router-dom";

export function useLogout() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const refreshToken = useAppSelector((s) => s.auth.refreshToken);

    const handleLogout = useCallback(async () => {
        try {
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
        } catch {
            // ignore — still clear local state
        } finally {
            dispatch(logout());
            dispatch(clearRestaurant());
            localStorage.removeItem("fb_auth_state");
            sessionStorage.clear();
            navigate("/auth", { replace: true });
        }
    }, [dispatch, navigate, refreshToken]);

    return handleLogout;
}