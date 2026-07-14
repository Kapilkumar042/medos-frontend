import axios from "axios";

const API_URL = import.meta.env.VITE_APP_API_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
});

export const getDoctors = async () => {
  const res = await axios.get(`${API_URL}/doctors`, {
    headers: authHeaders(),
  });

  return res.data;
};

export const createDoctor = async (payload: any) => {
  const res = await axios.post(`${API_URL}/doctors`, payload, {
    headers: authHeaders(),
  });

  return res.data;
};

export const updateDoctor = async (id: number, payload: any) => {
  const res = await axios.put(`${API_URL}/doctors/${id}`, payload, {
    headers: authHeaders(),
  });

  return res.data;
};

export const deleteDoctor = async (id: number) => {
  const res = await axios.delete(`${API_URL}/doctors/${id}`, {
    headers: authHeaders(),
  });

  return res.data;
};
