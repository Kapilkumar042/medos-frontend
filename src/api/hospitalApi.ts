import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

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
