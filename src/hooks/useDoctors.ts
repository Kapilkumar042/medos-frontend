import { useEffect, useState } from "react";
import { opdApi } from "@/lib/opd-api";

export interface Doctor {
  id: number;
  full_name: string;
  hospital_id: number;
  user_id: number;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  registration_no: string;
  room_no: string;
  is_available: boolean;
}

export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    opdApi
      .listDoctors()
      .then(setDoctors)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { doctors, loading };
}
