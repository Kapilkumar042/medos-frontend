// lib/opd-api.ts

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
});

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken"); // change key if yours is different
  if (token) {
    config.headers.Authorization = `bearer ${token}`;
  }
  return config;
});

export const opdApi = {
  // Patients
  listPatients: () => api.get("/opd/patients").then((r) => r.data),

  getPatient: (id: string) => api.get(`/opd/patients/${id}`).then((r) => r.data),

  createPatient: (data: any) => {
    const payload = {
      name: data.name,
      gender: data.gender,
      dob: data.dob,
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
    };
    return api.post("/opd/patients", payload).then((r) => r.data);
  },
  listDoctors: () => api.get("/doctors/").then((r) => r.data),

  updatePatient: (id: string, data: any) =>
    api.put(`/opd/patients/${id}`, data).then((r) => r.data),

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
};
