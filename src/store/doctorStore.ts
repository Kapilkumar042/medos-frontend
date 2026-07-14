import { create } from "zustand";
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from "@/api/doctors";

export interface Doctor {
  id: number;

  first_name: string;
  last_name: string;

  gender: string;

  email: string;
  phone: string;
  alt_phone?: string;

  specialization: string;
  qualification: string;
  registration_no: string;

  experience_years: number;

  department: string;
  designation: string;

  address?: string;
  city?: string;
  state?: string;
  pincode?: string;

  normal_fee: number;
  on_call_fee: number;
  emergency_fee?: number;
  follow_up_fee?: number;

  available_days?: string;
  start_time?: string;
  end_time?: string;

  status: string;
}

interface DoctorState {
  doctors: Doctor[];

  loading: boolean;

  fetchDoctors: () => Promise<void>;

  addDoctor: (data: any) => Promise<void>;

  updateDoctor: (id: number, data: any) => Promise<void>;

  removeDoctor: (id: number) => Promise<void>;
}

export const useDoctorStore = create<DoctorState>((set) => ({
  doctors: [],

  loading: false,

  fetchDoctors: async () => {
    set({ loading: true });

    try {
      const data = await getDoctors();

      set({
        doctors: data,
      });
    } finally {
      set({
        loading: false,
      });
    }
  },

  addDoctor: async (payload) => {
    const doctor = await createDoctor(payload);

    set((state) => ({
      doctors: [doctor, ...state.doctors],
    }));
  },

  updateDoctor: async (id, payload) => {
    const doctor = await updateDoctor(id, payload);

    set((state) => ({
      doctors: state.doctors.map((d) => (d.id === id ? doctor : d)),
    }));
  },

  removeDoctor: async (id) => {
    await deleteDoctor(id);

    set((state) => ({
      doctors: state.doctors.filter((d) => d.id !== id),
    }));
  },
}));
