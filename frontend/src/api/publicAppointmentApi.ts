import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

export const getHospitalByCode = async (hospitalCode: string) => {
  const res = await API.get(`/api/public/hospital/${hospitalCode}`);

  return res.data;
};

export const bookAppointment = async (hospitalCode: string, data: any) => {
  const res = await API.post(`/api/public/hospital/${hospitalCode}/appointment`, data);

  return res.data;
};
