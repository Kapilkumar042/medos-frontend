import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import {
  getHospitalProfile,
  resolveHospitalAssetUrl,
} from "@/api/hospitalApi";

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
  logo?: string;
  modules: ModuleKey[];
  registeredAt: string;
}

interface AuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  expiresAt: number | null;
  users: ManagedUser[];
  hospital: HospitalInfo | null;
  setHospital: (hospital: HospitalInfo | ((current: HospitalInfo | null) => HospitalInfo)) => void;
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
    email: "demo@Ncuresoft.health",
    password: "demo1234",
    role: "user",
    allowedModules: [...ALL_MODULES],
  },
];

export const AUTH_SESSION_DURATION_MS = 60 * 60 * 1000;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      expiresAt: null,
      users: seedUsers,
      hospital: null,
      setHospital: (hospital) =>
        set((state) => ({
          hospital: typeof hospital === "function" ? hospital(state.hospital) : hospital,
        })),
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
            set({
              isAuthenticated: true,
              expiresAt: Date.now() + AUTH_SESSION_DURATION_MS,
            });
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
              logo: resp.logo_url ?? resp.logo,
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

  if (res.status !== 200) throw new Error("Invalid credentials");

  const data = res.data;
  localStorage.setItem("authToken", data.access_token);

  set({
    isAuthenticated: true,
    expiresAt: Date.now() + AUTH_SESSION_DURATION_MS,
    user: {
      id: String(data.user_id),
      name: data.full_name,
      email,
      role: data.role,
      allowedModules: [],
    },
    hospital: null,
  });
  try {
  const response = await getHospitalProfile();
  const profile = response?.data ?? response;

  set({
    hospital: {
      name: profile?.hospital_name ?? profile?.name ?? "",
      email: profile?.hospital_email ?? profile?.email ?? email,
      phone: profile?.phone ?? "",
      address: profile?.address ?? "",
      logo: resolveHospitalAssetUrl(
        profile?.logo_image ?? profile?.logo_url ?? profile?.logo,
      ),
      modules: Array.isArray(profile?.modules) ? profile.modules : [],
      registeredAt: profile?.created_at ?? new Date().toISOString(),
    },
  });
} catch (error) {
  console.error("Failed to load hospital profile after login", error);
}
},
      logout: () => {
  localStorage.removeItem("authToken");
  set({
    user: null,
    hospital: null,
    isAuthenticated: false,
    expiresAt: null,
  });
},
    }),
    { name: "medos-auth" },
  ),
);
