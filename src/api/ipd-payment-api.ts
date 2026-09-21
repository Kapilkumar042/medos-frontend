import axios from "axios";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_APP_API_URL,
});

API.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "authToken"
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);

export const collectAdvance =
  async (
    admissionId: number,
    data: any
  ) => {
    const res = await API.post(
      `/api/ipd-payments/${admissionId}`,
      data
    );

    return res.data;
  };

export const getPaymentHistory =
  async (
    admissionId: number
  ) => {
    const res = await API.get(
      `/api/ipd-payments/${admissionId}`
    );

    return res.data;
  };