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

export const getQueue = async () => {
  const res = await API.get("/api/opd-queue");
  return res.data;
};

export const callToken = async (id: number) => {
  const res = await API.put(`/api/opd-queue/${id}/call`);
  return res.data;
};

export const startConsultation = async (id: number) => {
  const res = await API.put(`/api/opd-queue/${id}/consultation`);

  return res.data;
};

export const completeConsultation = async (id: number) => {
  const res = await API.put(`/api/opd-queue/${id}/complete`);

  return res.data;
};

export const skipToken = async (id: number) => {
  const res = await API.put(`/api/opd-queue/${id}/skip`);

  return res.data;
};

export const requeueToken = async (id: number) => {
  const res = await API.put(`/api/opd-queue/${id}/requeue`);

  return res.data;
};

export const cancelToken = async (id: number) => {
  const res = await API.put(`/api/opd-queue/${id}/cancel`);

  return res.data;
};
