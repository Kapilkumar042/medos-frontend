import axios from "axios";
import api from "./api";

const API_URL = import.meta.env.VITE_APP_API_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
});

export const getDoctors = async () => {
  const res = await api.get("/doctors");
  return res.data;
};

export const createDoctor = async (payload: any) => {
  const res = await api.post("/doctors", payload, {
    headers: authHeaders(),
  });

  return res.data;
};

export const updateDoctor = async (id: number, payload: any) => {
  const res = await api.put(`/doctors/${id}`, payload, {
    headers: authHeaders(),
  });

  return res.data;
};

export const deleteDoctor = async (id: number) => {
  const res = await api.delete(`/doctors/${id}`, {
    headers: authHeaders(),
  });

  return res.data;
};

export const importDoctors = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post(`/doctors/import`, formData, {
    headers: {
      ...authHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};
