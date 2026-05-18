import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email) => {
        await new Promise((r) => setTimeout(r, 600));
        set({
          isAuthenticated: true,
          user: {
            id: "u1",
            name: "Dr. Aarav Mehta",
            email,
            role: "Administrator",
          },
        });
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "medos-auth" },
  ),
);
