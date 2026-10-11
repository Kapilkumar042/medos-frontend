import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  AUTH_SESSION_DURATION_MS,
  useAuthStore,
} from "@/store/authStore";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    // SSR-safe: hydrate from persisted localStorage on client
    if (typeof window !== "undefined") {
      const auth = useAuthStore.getState();
      if (auth.expiresAt !== null && auth.expiresAt <= Date.now()) {
        auth.logout();
      } else if (auth.isAuthenticated && auth.expiresAt === null) {
        useAuthStore.setState({
          expiresAt: Date.now() + AUTH_SESSION_DURATION_MS,
        });
      }

      const currentAuth = useAuthStore.getState();
      if (!currentAuth.isAuthenticated) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: AppLayout,
});
