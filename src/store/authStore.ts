import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

export type ModuleKey =
  | "Overview"
  | "OPD"
  | "IPD"
  | "Laboratory"
  | "Radiology"
  | "Pharmacy"
  | "Billing"
  | "HR"
  | "Settings";

export const ALL_MODULES: ModuleKey[] = [
  "Overview",
  "OPD",
  "IPD",
  "Laboratory",
  "Radiology",
  "Pharmacy",
  "Billing",
  "HR",
  "Settings",
];

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "user";
  allowedModules: ModuleKey[];
  avatar?: string;
}

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "user";
  allowedModules: ModuleKey[];
  avatar?: string;
}

export interface HospitalInfo {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  modules: ModuleKey[];
  registeredAt: string;
}

interface AuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  users: ManagedUser[];
  hospital: HospitalInfo | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  registerHospital: (data: {
    hospitalName: string;
    hospitalEmail: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    modules: ModuleKey[];
  }) => Promise<void>;
}

const seedUsers: ManagedUser[] = [
  {
    id: "u-1",
    name: "Dr. Aarav Mehta",
    email: "demo@medos.health",
    password: "demo1234",
    role: "user",
    allowedModules: [...ALL_MODULES],
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      users: seedUsers,
      hospital: null,
      registerHospital: async (data) => {
        const base = import.meta.env.VITE_APP_API_URL ?? "";
        try {
          const payload = {
            hospital_name: data.hospitalName,
            hospital_email: data.hospitalEmail,
            phone: data.phone,
            password: data.password,
            modules: data.modules,
          };

          // If your API path is /api/auth/register, change the URL accordingly.
          const res = await axios.post(`${base}/auth/register`, payload, {
            headers: { "Content-Type": "application/json" },
            // withCredentials: true, // enable if backend uses cookies
          });

          // Accept various response shapes (adjust as your backend returns)
          const resp = res.data || {};
          // Optionally persist token if returned
          if (resp.access_token || resp.token) {
            const token = resp.access_token ?? resp.token;
            localStorage.setItem("authToken", token);
            // optionally set token in store state if you add `token` to AuthState
            set({ isAuthenticated: true });
          }

          // Set hospital and create admin user in local store for demo/fallback
          set((s) => ({
            users: [
              ...s.users,
              {
                id: resp.user_id ? String(resp.user_id) : `u-${Date.now()}`,
                name: data.hospitalName,
                email: data.email,
                password: data.password,
                role: "user",
                allowedModules: data.modules,
              },
            ],
            hospital: {
              name: data.hospitalName,
              email: data.hospitalEmail,
              phone: data.phone,
              address: data.address,
              modules: data.modules,
              registeredAt: new Date().toISOString(),
            },
          }));
        } catch (err: any) {
          const msg = axios.isAxiosError(err)
            ? err.response?.data?.message || err.response?.data || err.message
            : "Registration failed";
          throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
        }
      },
      login: async (email, password) => {
        const base = import.meta.env.VITE_APP_API_URL;
        const res = await axios.post(`${base}/auth/login`, { email, password });
        if (res.status === 200) {
          const data = res.data;
          set({
            isAuthenticated: true,
            user: {
              id: String(data.user_id),
              name: data.full_name,
              email,
              role: data.role,
              allowedModules: [],
            },
          });
          localStorage.setItem("authToken", data.access_token);
        } else {
          throw new Error("Invalid credentials");
        }
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "medos-auth" },
  ),
);
