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

export const getAppointments = async () => {
  const res = await API.get("/api/appointments");
  return res.data;
};

export const createAppointment = async (data: any) => {
  const res = await API.post("/api/appointments", data);
  return res.data;
};
export const getPublicHospital = async (hospitalId: number) => {
  const res = await API.get(`/public/appointments/hospitals/${hospitalId}`);
  return res.data;
};
export const createPublicAppointment = async (data: any) => {
  const res = await API.post("/public/appointments", data);
  return res.data;
};
export const getPublicDoctors = async (hospitalId: number) => {
  const res = await API.get(`/public/appointments/hospitals/${hospitalId}/doctors`);

  return res.data;
};

export const updateAppointment = async (id: number, data: any) => {
  const res = await API.put(`/api/appointments/${id}`, data);

  return res.data;
};

export const deleteAppointment = async (id: number) => {
  const res = await API.delete(`/api/appointments/${id}`);

  return res.data;
};

export const updateAppointmentStatus = async (id: number, status: string) => {
  const res = await API.put(`/api/appointments/${id}/status`, { status });

  return res.data;
};

export const acceptAppointment = async (id: number) => {
  const res = await API.put(`/api/appointments/${id}/accept`);

  return res.data;
};
