import { useAppSelector } from "./useAppSelector";

export function useAuth() {
  const auth = useAppSelector((s) => s.auth);
  const isAuthenticated = !!auth.accessToken && !!auth.user;
  return { ...auth, isAuthenticated };
}