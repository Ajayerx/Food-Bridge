import React, { useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { hydrateFromStorage, logout } from "../store/slices/authSlice";
import { AuthPage } from "../features/auth/AuthPage";
import { VendorRegisterPage } from "../features/auth/VendorRegisterPage";
import LandingPage from "../features/landing/LandingPage";
import { AdminLayout } from "../components/layout/AdminLayout";
import { VendorLayout } from "../components/layout/VendorLayout";
import { ManagerLayout } from "../components/layout/ManagerLayout";
import { KitchenLayout } from "../components/layout/KitchenLayout";
import { WaiterLayout } from "../components/layout/WaiterLayout";
import { AdminDashboardPage } from "../features/restaurants/AdminDashboard";
import { AdminRestaurantsPage } from "../features/restaurants/AdminRestaurantsPage";
import { AdminUsersPage } from "../features/users/AdminUsersPage";
import { AdminReportsPage } from "../features/reports/AdminReportsPage";
import { VendorDashboard } from "../features/restaurants/VendorDashboard";
import { VendorOrdersBoard } from "../features/orders/VendorOrdersBoard";
import { VendorMenuPage } from "../features/restaurants/VendorMenuPage";
import { VendorStaffPage } from "../features/restaurants/VendorStaffPage";
import { VendorTablesPage } from "../features/restaurants/VendorTablesPage";
import { VendorAgentsPage } from "../features/restaurants/VendorAgentsPage";
import { VendorCouponsPage } from "../features/coupons/VendorCouponsPage";
import { VendorReportsPage } from "../features/reports/VendorReportsPage";
import { SupportTicketsPage } from "../features/support/SupportTicketsPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { VendorReviewsPage } from "../features/reviews/VendorReviewsPage";
import { WaiterTablesPage } from "../features/restaurants/Waitertablespage";

function isJwtExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// ─── RequireAuth ──────────────────────────────────────────────────────────────
const RequireAuth: React.FC<{ allowedRoles?: string[] }> = ({
  allowedRoles,
}) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated)
    return <Navigate to="/auth" state={{ from: location }} replace />;

  if (allowedRoles && user && !allowedRoles.includes(user.roleType))
    return <Navigate to="/" replace />;

  return <Outlet />;
};

// ─── RequireStaffRole ─────────────────────────────────────────────────────────
const RequireStaffRole: React.FC<{ allowedStaffRoles: string[] }> = ({
  allowedStaffRoles,
}) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/auth" replace />;

  if (!user.staffRole || !allowedStaffRoles.includes(user.staffRole))
    return <Navigate to="/" replace />;

  return <Outlet />;
};

// ─── RoleBasedHome ────────────────────────────────────────────────────────────
const RoleBasedHome: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;

  if (user.roleType === "Admin")
    return <Navigate to="/admin/dashboard" replace />;
  if (user.roleType === "Vendor")
    return <Navigate to="/vendor/dashboard" replace />;

  if (user.roleType === "Staff") {
    switch (user.staffRole) {
      case "manager":
        return <Navigate to="/manager/dashboard" replace />;
      case "kitchen":
        return <Navigate to="/kitchen/orders" replace />;
      case "waiter":
        return <Navigate to="/waiter/orders" replace />;
      case "cashier":
        return <Navigate to="/waiter/orders" replace />;
      default:
        return <Navigate to="/auth" replace />;
    }
  }

  return <Navigate to="/auth" replace />;
};

// ─── AppRouter ────────────────────────────────────────────────────────────────
export const AppRouter: React.FC = () => {
  const dispatch = useAppDispatch();
  const { hydrated } = useAuth();

  useEffect(() => {
    const stored = localStorage.getItem("fb_auth_state");
    if (!stored) {
      dispatch(logout());
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      const accessExpired = isJwtExpired(parsed.accessToken);
      const refreshExpired = isJwtExpired(parsed.refreshToken);
      if (accessExpired && refreshExpired) {
        localStorage.removeItem("fb_auth_state");
        dispatch(logout());
        return;
      }
      dispatch(hydrateFromStorage(parsed));
    } catch {
      localStorage.removeItem("fb_auth_state");
      dispatch(logout());
    }
  }, [dispatch]);

  if (!hydrated) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <span>Loading…</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/register" element={<VendorRegisterPage />} />

      {/* Landing page - shown first */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected routes */}
        <Route element={<RequireAuth />}>
          <Route path="/home" element={<RoleBasedHome />} />

        {/* ── Admin ──────────────────────────────────────────────────────── */}
        <Route element={<RequireAuth allowedRoles={["Admin"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route
              path="/admin/restaurants"
              element={<AdminRestaurantsPage />}
            />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/support" element={<SupportTicketsPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* ── Vendor ─────────────────────────────────────────────────────── */}
        <Route element={<RequireAuth allowedRoles={["Vendor"]} />}>
          <Route element={<VendorLayout />}>
            <Route path="/vendor/dashboard" element={<VendorDashboard />} />
            <Route path="/vendor/orders" element={<VendorOrdersBoard />} />
            <Route path="/vendor/menu" element={<VendorMenuPage />} />
            <Route path="/vendor/tables" element={<VendorTablesPage />} />{" "}
            {/* ✅ separate */}
            <Route path="/vendor/staff" element={<VendorStaffPage />} />{" "}
            {/* ✅ separate */}
            <Route path="/vendor/agents" element={<VendorAgentsPage />} />
            <Route path="/vendor/coupons" element={<VendorCouponsPage />} />
            <Route path="/vendor/reviews" element={<VendorReviewsPage />} />
            <Route path="/vendor/reports" element={<VendorReportsPage />} />
          </Route>
        </Route>

        {/* ── Manager ────────────────────────────────────────────────────── */}
        <Route element={<RequireAuth allowedRoles={["Staff"]} />}>
          <Route element={<RequireStaffRole allowedStaffRoles={["manager"]} />}>
            <Route element={<ManagerLayout />}>
              <Route path="/manager/dashboard" element={<VendorDashboard />} />
              <Route path="/manager/orders" element={<VendorOrdersBoard />} />
              <Route path="/manager/menu" element={<VendorMenuPage />} />
              <Route
                path="/manager/tables"
                element={<VendorTablesPage />}
              />{" "}
              {/* ✅ separate */}
              <Route path="/manager/staff" element={<VendorStaffPage />} />{" "}
              {/* ✅ separate */}
              <Route path="/manager/reviews" element={<VendorReviewsPage />} />
              <Route path="/manager/reports" element={<VendorReportsPage />} />
            </Route>
          </Route>
        </Route>

        {/* ── Kitchen ────────────────────────────────────────────────────── */}
        <Route element={<RequireAuth allowedRoles={["Staff"]} />}>
          <Route element={<RequireStaffRole allowedStaffRoles={["kitchen"]} />}>
            <Route element={<KitchenLayout />}>
              <Route path="/kitchen/orders" element={<VendorOrdersBoard />} />
            </Route>
          </Route>
        </Route>

        {/* ── Waiter ─────────────────────────────────────────────────────── */}
        <Route element={<RequireAuth allowedRoles={["Staff"]} />}>
          <Route element={<RequireStaffRole allowedStaffRoles={["waiter"]} />}>
            <Route element={<WaiterLayout />}>
              <Route path="/waiter/orders" element={<VendorOrdersBoard />} />
              <Route path="/waiter/tables" element={<WaiterTablesPage />} />
              <Route
                path="/waiter/tables"
                element={<VendorTablesPage />}
              />{" "}
              {/* ✅ tables only, no staff */}
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
