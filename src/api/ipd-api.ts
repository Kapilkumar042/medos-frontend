import axios from "axios";
import { toast } from "sonner";

const API = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* --------------------------
   IPD Admission
---------------------------*/
export type IpdAdmissionFilters = {
  start_date?: string;
  end_date?: string;
  status?: "Admitted" | "Observation" | "Pending" | "Discharged";
  dues_only?: boolean;
};

export const admitNewPatient = async (
  data: any
) => {
  const res = await API.post(
    "/ipd/admit-new",
    data
  );

  return res.data;
};

export const admitFromOpd = async (
  data: any
) => {
  const res = await API.post(
    "/ipd/admit/opd",
    data
  );

  return res.data;
};

export const admitExistingPatient = async (
  data: any
) => {
  const res = await API.post(
    "/ipd/admit/existing",
    data
  );

  return res.data;
};

export const admitFromOPD = async (
  data: any
) => {
  const res = await API.post(
    "/ipd/admit/opd",
    data
  );

  return res.data;
};

export const getAdmissions = async (filters?: IpdAdmissionFilters) => {
  const res = await API.get("/ipd", {
    params: {
      ...filters,
      dues_only: filters?.dues_only ? true : undefined,
    },
  });

  const data = res.data;
  return Array.isArray(data) ? data : data.results ?? data.data ?? [];
};

export const getAdmission = async (
  id: number
) => {
  const res = await API.get(
    `/ipd/${id}`
  );

  return res.data;
};

export const printIPDAdmission = async (
  admissionId: number,
  popup?: Window | null,
) => {
  const target = popup ?? window.open("", "_blank");

  if (!target) {
    toast.error("Please allow pop-ups to print the admission");
    return;
  }

  try {
    const response = await API.get(`/ipd/${admissionId}/print`, {
      responseType: "text",
    });

    target.document.open();
    target.document.write(response.data);
    target.document.close();
  } catch {
    target.close();
    toast.error("Failed to open admission print");
  }
};

export const exportIPDPatients = async (params: {
  start_date: string;
  end_date: string;
  status?: string;
  dues_only?: boolean;
  file_format: "xlsx" | "pdf";
}) => {
  const res = await API.get("/ipd/export", {
    params: {
      ...params,
      dues_only: params.dues_only || undefined,
    },
    responseType: "blob",
  });

  return res.data;
};



export const updateAdmission = async (
  admissionId: number,
  data: Record<string, unknown>
) => {
  const res = await API.put(`/ipd/${admissionId}`, data);
  return res.data;
};

export const deleteAdmission = async (admissionId: number) => {
  const res = await API.delete(`/ipd/${admissionId}`);
  return res.data;
};
export const getIPDPatientPaymentSummary = async (filters?: IpdAdmissionFilters) => {
  const res = await API.get("/ipd/payment-summary", { params: filters });
  return res.data;
};
export const dischargePatient = async (
  admissionId: number
) => {
  const res = await API.put(
    `/ipd/${admissionId}/discharge`
  );

  return res.data;
};

/* --------------------------
   IPD Advance Payment
---------------------------*/

export const addAdvancePayment = async (
  admissionId: number,
  data: {
    amount: number;
    payment_mode: string;
  }
) => {
  const res = await API.post(
    `/ipd/${admissionId}/payment`,
    data
  );

  return res.data;
};

export const getPaymentHistory = async (
  admissionId: number
) => {
  const res = await API.get(
    `/ipd/${admissionId}/payments`
  );

  return res.data;
};

/* --------------------------
   IPD Billing
---------------------------*/

export const createIPDBill = async (
  data: any
) => {
  const res = await API.post(
    "/ipd/billing",
    data
  );

  return res.data;
};

export const getIPDBills = async () => {
  const res = await API.get("/ipd/billing");
  return res.data;
};

export const getIPDBill = async (billId: number) => {
  const res = await API.get(`/ipd/billing/${billId}`);
  return res.data;
};
export const updateIPDBill = async (billId: number, data: any) => {
  const res = await API.put(`/ipd/billing/${billId}`, data);
  return res.data;
};
// src/api/ipd-api.ts
export const printIPDBill = async (
  billId: number,
  popup?: Window | null
) => {
  const target = popup ?? window.open("", "_blank", "noopener,noreferrer");

  if (!target) {
    alert("Popup blocked. Please allow pop-ups to print the bill.");
    return;
  }

  try {
    const response = await API.get(`/ipd/billing/${billId}/print`, {
      responseType: "text",
    });

    target.document.open();
    target.document.write(response.data);
    target.document.close();
  } catch (error) {
    target.close();
    alert("Failed to open IPD bill print.");
  }
};


// export const getIPDStats = async () => {
//   const res = await API.get(
//     "/api/ipd/stats"
//   );

//   return res.data;
// };
// export const getActiveAdmissions =
//   async () => {
//     const res = await API.get(
//       "/api/ipd/active"
//     );

//     return res.data;
//   };
// export const getBedStatus =
//   async () => {
//     const res = await API.get(
//       "/api/beds"
//     );

//     return res.data;
//   };

// export const getTodayCollection =
//   async () => {
//     const res = await API.get(
//       "/api/ipd-billing/today-collection"
//     );

//     return res.data;
//   };