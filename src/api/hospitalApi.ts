import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

export const resolveHospitalAssetUrl = (assetPath?: string | null) => {
  if (!assetPath) return "";
  if (assetPath.startsWith("blob:") || assetPath.startsWith("data:") || /^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  const baseUrl = String(import.meta.env.VITE_APP_API_URL ?? "").replace(/\/$/, "");
  return `${baseUrl}/${assetPath.replace(/^\//, "")}`;
};

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const generateHospitalQR = async () => {
  const res = await API.get("/api/hospital/generate-qr");

  return res.data;
};

export const getHospitalProfile = async () => {
  const res = await API.get("/hospital/profile");
  return res.data;
};

export const updateHospitalProfile = async (data: FormData) => {
  const res = await API.put("/hospital/profile", data);
  return res.data;
};
