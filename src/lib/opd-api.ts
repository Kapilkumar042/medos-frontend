// lib/opd-api.ts

import axios from "axios";
export function printHtmlInFrame(html: string) {
  const frame = document.createElement("iframe");
  frame.title = "Print";
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText =
    "position:fixed;left:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none";
  document.body.appendChild(frame);

  const printWindow = frame.contentWindow;
  const printDocument = frame.contentDocument;

  if (!printWindow || !printDocument) {
    frame.remove();
    throw new Error("Could not create print frame");
  }

  printWindow.addEventListener("afterprint", () => frame.remove(), { once: true });

  printDocument.open();
  printDocument.write(html);
  printDocument.close();

  requestAnimationFrame(() => {
    printWindow.focus();
    printWindow.print();
  });
}

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken"); // change key if yours is different
  if (token) {
    config.headers.Authorization = `bearer ${token}`;
  }
  return config;
});

export type OpdPatientSearchResult = {
  id: string;
  name: string;
  uhid?: string;
  gender?: string;
  mobile?: string;
  bloodGroup?: string;
};

export type AdmitFromOpdPayload = {
  patient_id: number;
  doctor_id?: number | null;
  ward?: string | null;
  room?: string | null;
  bed_no?: string | null;
  diagnosis?: string | null;
  admission_date?: string | null;
  department?: string | null;
  attendant_name?: string | null;
  emergency_contact?: string | null;
  expected_discharge_date?: string | null;
  notes?: string | null;
  package_name?: string | null;
  reason?: string | null;
  referral?: string | null;
  room_category?: string | null;
  insurance_policy?: string | null;
  insurer?: string | null;
  age_days?: number;
  age_months?: number;
  advance_amount?: number;
  payment_mode?: string | null;
};

export const opdApi = {
  // Patients
  // listPatients: () => api.get("/opd/patients").then((r) => r.data),
  listPatients: (params?: { start_date?: string; end_date?: string }) =>
  api.get("/opd/patients", { params }).then((r) => {
    const data = r.data;
    return Array.isArray(data) ? data : data.results ?? data.data ?? [];
  }),

  getPatient: (id: string) =>
    api.get(`/opd/patients/${id}`).then((r) => {
      const p = r.data;
      return {
        ...p,
        id: String(p.id),
        uhid: p.uhid,
        opdNo: p.opd_no ?? p.opdNo, // ← opd_no from backend
        bloodGroup: p.blood_group ?? p.bloodGroup,
        doctorId: String(p.doctor_id ?? p.doctorId ?? ""),
        dateTime: p.date_time
          ? p.date_time.slice(0, 10) // strip time portion for date input
          : (p.dateTime ?? ""),
        idProofType: p.id_proof_type ?? p.idProofType,
        idProofNumber: p.id_proof_number ?? p.idProofNumber,
        visitDate: p.visit_date ?? p.visitDate ?? "",
      };
    }),
exportPatients: async (params: {
    start_date: string;
    end_date: string;
    file_format: "xlsx" | "pdf";
  }) => {
    const response = await api.get("/opd/patients/export", {
      params,
      responseType: "blob",
    });

    return response.data;
  },

  searchPatients: (query: string): Promise<OpdPatientSearchResult[]> =>
  api
    .get("/opd/patients/search", { params: { q: query } })
    .then((response) => {
      const payload = response.data?.data ?? response.data;
      const patients = Array.isArray(payload)
        ? payload
        : payload?.results ?? payload?.items ?? [];

      return patients.map((patient: any) => ({
        id: String(patient.id),
        name: patient.name ?? "",
        uhid: patient.uhid ?? "",
        gender: patient.gender ?? "",
        mobile: patient.mobile ?? "",
        bloodGroup: patient.blood_group ?? patient.bloodGroup ?? "-",
      }));
    }),

      admitFromOpd: (payload: AdmitFromOpdPayload) =>
    api.post("/ipd/admit-from-opd", payload).then((response) => response.data), 
      
  createPatient: (data: any) => {
    const payload = {
      name: data.name,
      gender: data.gender,
      dob: data.dob,
      age: data.age,
      age_months: data.age_months,
      age_days: data.age_days,
      follow_up_date: data.follow_up_date ?? data.visitDate ?? null,
      mobile: data.mobile,
      address: data.address,
      blood_group: data.bloodGroup, // camelCase → snake_case
      doctor_id: data.doctorId, // camelCase → snake_case
      department: data.department,
      email: data.email,
      aadhaar: data.aadhaar,
      abha: data.abha,
      state: data.state,
      district: data.district,
      city_town: data.city_town,
      pincode: data.pincode,
      occupation: data.occupation,
      marital: data.marital,
      emergency: data.emergency,
      reference: data.reference,
      salutation: data.salutation,
      patient_type: data.patient_type,
      relation: data.relation,
      relative_name: data.relative_name,
      date_time: data.dateTime, // camelCase → snake_case
      id_proof_type: data.idProofType, // camelCase → snake_case
      id_proof_number: data.idProofNumber, // camelCase → snake_case
      religion: data.religion,
      education: data.education,
      consultant: data.consultant,
      status: data.status,
    };
    return api.post("/opd/patients", payload).then((r) => r.data);
  },
  listDoctors: () => api.get("/doctors").then((r) => r.data),
  printPatient: (id: string | number) =>
    api
      .get(`/opd/patients/${id}/print`, {
        responseType: "text",
      })
      .then((r) => r.data),

  printBill: (id: string | number) =>
    api
      .get(`/opd/bills/${id}/print`, {
        responseType: "text",
      })
      .then((r) => r.data),

  getBillShareLink: (billId: string | number) =>
    api.get(`/opd/bills/${billId}/share-link`).then((response) => response.data),

  getPatientPaymentSummary: (params?: { start_date?: string; end_date?: string }) =>
  api.get("/opd/patients/payment-summary", { params }).then((r) => r.data),
  
  updatePatient: (id: string, data: any) =>
    api.put(`/opd/patients/${id}`, data).then((r) => r.data),
  updateVisit: (id: string | number, payload: any) =>
    api.put(`/opd/visits/${id}`, payload).then((r) => r.data),

  updateBill: (id: string | number, payload: any) =>
    api.put(`/opd/bills/${id}`, payload).then((r) => r.data),

  deletePatient: (id: string) => api.delete(`/opd/patients/${id}`),

  // Visits — fixed: now uses axios instead of fetch
  listVisits: () =>
    api.get("/opd/visits").then((r) => {
      const list = Array.isArray(r.data) ? r.data : (r.data.results ?? r.data.data ?? []);
      return list;
    }),
  createVisit: (payload: {
    patient_id: string | number;
    doctor_id: number;
    department: string;
    visit_date: string;
    symptoms?: string;
    notes?: string;
  }) => api.post("/opd/visits", payload).then((r) => r.data),

  // Bills
  createBill: (data: any) => api.post("/opd/bills", data).then((r) => r.data),

  listBills: () =>
    api.get("/opd/bills").then((r) => {
      const list = Array.isArray(r.data) ? r.data : (r.data.results ?? r.data.data ?? []);
      return list;
    }),

  getBill: (id: string | number) => api.get(`/opd/bills/${id}`).then((r) => r.data),
};
