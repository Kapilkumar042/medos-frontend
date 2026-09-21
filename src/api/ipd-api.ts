import axios from "axios";

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

export const getAdmissions = async () => {
  const res = await API.get(
    "/ipd"
  );

  return res.data;
};

export const getAdmission = async (
  id: number
) => {
  const res = await API.get(
    `/ipd/${id}`
  );

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
  const res = await API.get(
    "/ipd-billing"
  );

  return res.data;
};

export const getIPDBill = async (
  billId: number
) => {
  const res = await API.get(
    `/ipd-billing/${billId}`
  );

  return res.data;
};

export const printIPDBill = (
  billId: number
) => {
  const token =
    localStorage.getItem(
      "authToken"
    );

  window.open(
    `${import.meta.env.VITE_APP_API_URL}/api/ipd-billing/${billId}/print?token=${token}`,
    "_blank"
  );
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