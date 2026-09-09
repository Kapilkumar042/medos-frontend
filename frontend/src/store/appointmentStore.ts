import { create } from "zustand";

export interface AppointmentRecord {
  id: number;
  token: number;
  patient_name: string;
  phone: string;
  blood_group?: string;
  gender: string;
  age?: number;
  doctor_id?: number;
  department?: string;
  service: string;
  other_service?: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  notes?: string;
  status: AppointmentStatus;
  created_at: string;
}

export type AppointmentStatus =
  | "Scheduled"
  | "Accepted"
  | "Cancelled"
  | "Re-scheduled"
  | "Call Requested"
  | "Completed";

export type ServiceType = "Consultant" | "Lab Test" | "Radiology" | "Other";

import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from "@/api/appointmentApi";

interface AppointmentState {
  items: AppointmentRecord[];

  fetchAppointments: () => Promise<void>;

  addAppointment: (payload: any) => Promise<void>;

  changeStatus: (id: number, status: string) => Promise<void>;

  removeAppointment: (id: number) => Promise<void>;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  items: [],

  fetchAppointments: async () => {
    const data = await getAppointments();

    set({
      items: data,
    });
  },

  addAppointment: async (payload) => {
    await createAppointment(payload);

    const data = await getAppointments();

    set({
      items: data,
    });
  },

  changeStatus: async (id, status) => {
    await updateAppointmentStatus(id, status);

    const data = await getAppointments();

    set({
      items: data,
    });
  },

  removeAppointment: async (id) => {
    await deleteAppointment(id);

    const data = await getAppointments();

    set({
      items: data,
    });
  },
}));
