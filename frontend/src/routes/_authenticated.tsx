import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    // SSR-safe: hydrate from persisted localStorage on client
    if (typeof window !== "undefined") {
      const auth = useAuthStore.getState();
      if (!auth.isAuthenticated) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: AppLayout,
});
