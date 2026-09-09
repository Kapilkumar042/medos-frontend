import axios from "axios";
import type { CatalogKind, CatalogItem } from "@/store/catalogStore";

const API = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const normalizePayload = (kind: CatalogKind, payload: any) => {
  if (kind === "lab") {
    const { name, sampleType, reportTime, ...rest } = payload;
    return {
      ...rest,
      test_name: name,
      sample_type: sampleType,
      report_time: reportTime,
    };
  }
  return payload;
};

const normalizeResponse = (kind: CatalogKind, item: any) => {
  if (kind === "lab") {
    return {
      ...item,
      name: item.test_name ?? item.name,
      sampleType: item.sample_type ?? item.sampleType,
      reportTime: item.report_time ?? item.reportTime,
    };
  }
  return item;
};

export const catalogApi = {
  list: (kind: CatalogKind) =>
    API.get(`/${kind}`).then((r) =>
      Array.isArray(r.data)
        ? r.data.map((item: any) => normalizeResponse(kind, item))
        : normalizeResponse(kind, r.data),
    ),

  create: (kind: CatalogKind, item: Omit<CatalogItem, "id" | "createdAt">) =>
    API.post(`/${kind}`, normalizePayload(kind, item)).then((r) => normalizeResponse(kind, r.data)),

  update: (kind: CatalogKind, id: string, patch: Partial<CatalogItem>) =>
    API.put(`/${kind}/${id}`, normalizePayload(kind, patch)).then((r) =>
      normalizeResponse(kind, r.data),
    ),

  remove: (kind: CatalogKind, id: string) => API.delete(`/${kind}/${id}`).then((r) => r.data),

  importCatalog: (kind: CatalogKind, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return API.post(`/${kind}/import`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },
};
