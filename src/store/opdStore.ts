import { create } from "zustand";
import { persist } from "zustand/middleware";
import { opdApi } from "@/lib/opd-api";
export interface OpdPatient {
  id: string;
  uhid: string;
  abha?: string;
  aadhaar?: string;
  opdNo?: string;
  name: string;
  gender: "Male" | "Female" | "Other";
  salutation?: string;
  patient_type?: string;
  relation?: string;
  dob: string;
  dateTime?: string;
  mobile: string;
  relative_name?: string;
  email?: string;
  address: string;
  bloodGroup: string;
  marital?: string;
  occupation?: string;
  emergency?: string;
  doctorId: string;
  department: string;
  consultant?: string;
  idProofType?: string;
  idProofNumber?: string;
  state?: string;
  district?: string;
  city_town?: string;
  religion?: string;
  pincode?: string;
  education?: string;
  reference?: string;
  visitDate: string;
  symptoms?: string;
  notes?: string;
  items?: Array<{
    category: "Advance" | "Lab Test" | "Radiology" | "Other" | "Doctor Fee";
    name: string;
    code?: string;
    qty: number;
    amount: number;
    discount: number;
    remarks?: string;
  }>;
  discount?: number;
  gstPct?: number;
  totalDiscountAmt?: number;
  totalDiscountPct?: number;
  paymentType?: "Single Paymode" | "Multi Paymode";
  payMode1?: "CASH" | "CARD" | "UPI" | "CHEQUE" | "INSURANCE";
  amount1?: number;
  remark?: string;
  discountSource?: "Hospital Discount" | "Doctor Discount";
  registeredAt: string;
  status: "Registered" | "Billed" | "Transferred to IPD";
  netAmount?: number;
}
type PatientDateFilter = {
  start_date?: string;
  end_date?: string;
};
interface OpdState {
  patients: OpdPatient[];
  loading: boolean;
  loadPatients: (filter?: PatientDateFilter) => Promise<void>;
  addPatient: (
    patient: Omit<OpdPatient, "id" | "uhid" | "opdNo" | "registeredAt">,
  ) => Promise<OpdPatient>;
  updatePatient: (id: string, patch: Partial<OpdPatient>) => Promise<OpdPatient>; // ← CHANGE FROM Promise<void>
  removePatient: (id: string) => Promise<void>;
  getPatient: (id: string) => OpdPatient | undefined;
}


export const useOpdStore = create<OpdState>()(
  persist(
    (set, get) => ({
      patients: [],
      loading: false,

     loadPatients: async (filter) => {
  set({ loading: true });

  try {
    const patients = await opdApi.listPatients(filter);

    set({
      patients,
      loading: false,
    });
  } catch (err) {
    console.error(err);
    set({ loading: false });
  }
},

      addPatient: async (payload) => {
        const patient = await opdApi.createPatient(payload);

        set((s) => ({
          patients: [patient, ...s.patients],
        }));

        return patient;
      },

      updatePatient: async (id, patch) => {
        const updated = await opdApi.updatePatient(id, patch);

        set((s) => ({
          patients: s.patients.map((p) => (p.id === id ? updated : p)),
        }));
        return updated as OpdPatient;
      },

      removePatient: async (id) => {
        await opdApi.deletePatient(id);

        set((s) => ({
          patients: s.patients.filter((p) => p.id !== id),
        }));
      },

      getPatient: (id) => get().patients.find((p) => p.id === id),
    }),
    {
      name: "medos-opd-patients",
    },
  ),
);
