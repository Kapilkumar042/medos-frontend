import { useEffect, useState } from "react";
import { opdApi } from "@/lib/opd-api";

export interface Doctor {
  first_name: string;
  last_name: string;
  id: number;
  full_name: string;
  hospital_id: number;
  user_id: number;
  specialization: string;
  qualification: string;
  experience_years: number;
  normal_fee: number;
  follow_up_free?: boolean | null;
  follow_up_period_days?: number | null;
  free_follow_up_count?: number | null;
  registration_no: string;
  room_no: string;
  status: boolean;
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
