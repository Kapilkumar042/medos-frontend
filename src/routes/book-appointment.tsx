import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createPublicAppointment, getPublicHospital, getPublicDoctors } from "@/api/appointmentApi";

export const Route = createFileRoute("/book-appointment")({
  component: PublicAppointmentPage,
});

type FormState = {
  patient_name: string;
  phone: string;
  gender: string;
  age: string;
  blood_group: string;
  service: string;
  other_service: string;
  doctor_id: string;
  department: string;
  appointment_date: string;
  appointment_time: string;
  visit_type: string;
  notes: string;
};
type PublicDoctor = {
  id: number;
  first_name: string;
  last_name: string;
  specialization: string | null;
  department: string | null;
  room_no: string | null;
};

function PublicAppointmentPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const hospitalId = Number(searchParams.get("hospital_id"));

  const [hospital, setHospital] = useState<any>(null);
  const [loadingHospital, setLoadingHospital] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const [form, setForm] = useState<FormState>({
    patient_name: "",
    phone: "",
    gender: "Male",
    age: "",
    blood_group: "Unknown",
    service: "Consultant",
    other_service: "",
    doctor_id: "",
    department: "",
    appointment_date: new Date().toISOString().slice(0, 10),
    appointment_time: "",
    visit_type: "New",
    notes: "",
  });

  useEffect(() => {
    if (!hospitalId) {
      setLoadingHospital(false);
      return;
    }

    setLoadingDoctors(true);

    Promise.all([getPublicHospital(hospitalId), getPublicDoctors(hospitalId)])
      .then(([hospitalData, doctorData]) => {
        setHospital(hospitalData);
        setDoctors(doctorData);
      })
      .catch(() => {
        toast.error("Unable to load hospital details");
      })
      .finally(() => {
        setLoadingHospital(false);
        setLoadingDoctors(false);
      });
  }, [hospitalId]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submit = async () => {
    if (!hospitalId) {
      toast.error("Invalid hospital QR code");
      return;
    }

    if (!form.patient_name.trim()) {
      toast.error("Patient name is required");
      return;
    }

    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    if (!form.appointment_date) {
      toast.error("Appointment date is required");
      return;
    }

    if (!form.appointment_time) {
      toast.error("Appointment time is required");
      return;
    }

    if (form.service === "Other" && !form.other_service.trim()) {
      toast.error("Please enter the service");
      return;
    }

    try {
      setSubmitting(true);

      const result = await createPublicAppointment({
        hospital_id: hospitalId,
        patient_name: form.patient_name,
        phone: form.phone,
        gender: form.gender,
        age: form.age ? Number(form.age) : null,
        blood_group: form.blood_group === "Unknown" ? null : form.blood_group,
        doctor_id: form.doctor_id ? Number(form.doctor_id) : null,
        department: form.department || null,
        service: form.service,
        other_service: form.service === "Other" ? form.other_service : null,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        visit_type: form.visit_type,
        notes: form.notes || null,
      });

      toast.success(`Appointment booked. Token #${result.token}`, {
  duration: 500,
});

      setForm((current) => ({
        ...current,
        patient_name: "",
        phone: "",
        age: "",
        notes: "",
      }));
    } catch (error: any) {
      toast.error(error?.response?.data?.detail ?? "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingHospital) {
    return (
      <main className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p>Loading hospital...</p>
      </main>
    );
  }

  if (!hospital) {
    return (
      <main className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Hospital not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please scan a valid hospital QR code.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="bg-primary px-5 py-6 text-center text-primary-foreground">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-2xl font-bold">
              {hospital.hospital_name?.charAt(0)?.toUpperCase()}
            </div>

            <h1 className="text-2xl font-bold tracking-tight">{hospital.hospital_name}</h1>

            <p className="mt-2 text-sm text-primary-foreground/80">
              Online OPD Appointment Booking
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 py-3 text-sm text-muted-foreground">
            <span>Book your appointment online</span>

            {hospital.phone && <span>Contact: {hospital.phone}</span>}
          </div>
        </header>

        <section className="rounded-2xl border bg-card p-5 shadow-md sm:p-7">
          <div className="mb-6 border-b pb-4">
            <h2 className="text-xl font-semibold">Patient Details</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Enter your details to request an OPD appointment.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Patient Name *</Label>
              <Input
                value={form.patient_name}
                onChange={(event) => updateField("patient_name", event.target.value)}
                placeholder="Enter patient name"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Phone Number *</Label>
              <Input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="Enter WhatsApp number"
                type="tel"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Age</Label>
              <Input
                value={form.age}
                onChange={(event) => updateField("age", event.target.value)}
                type="number"
                min="0"
                max="120"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Gender *</Label>
              <Select value={form.gender} onValueChange={(value) => updateField("gender", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Blood Group</Label>
              <Select
                value={form.blood_group}
                onValueChange={(value) => updateField("blood_group", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Unknown", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Doctor</Label>

              <Select
                value={form.doctor_id || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    updateField("doctor_id", "");
                    updateField("department", "");
                    return;
                  }

                  const doctor = doctors.find((item) => String(item.id) === value);

                  updateField("doctor_id", value);
                  updateField("department", doctor?.department ?? "");
                }}
                disabled={loadingDoctors}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={loadingDoctors ? "Loading doctors..." : "Select doctor (optional)"}
                  />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="none">No preference</SelectItem>

                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={String(doctor.id)}>
                      Dr. {doctor.first_name} {doctor.last_name}
                      {doctor.specialization ? ` - ${doctor.specialization}` : ""}
                      {doctor.room_no ? ` (Room ${doctor.room_no})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Service *</Label>
              <Select value={form.service} onValueChange={(value) => updateField("service", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consultant">Consultant</SelectItem>
                  <SelectItem value="Lab Test">Lab Test</SelectItem>
                  <SelectItem value="Radiology">Radiology</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.service === "Other" && (
              <div className="space-y-1.5">
                <Label>Other Service *</Label>
                <Input
                  value={form.other_service}
                  onChange={(event) => updateField("other_service", event.target.value)}
                  placeholder="Enter service"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Appointment Date *</Label>
              <Input
                type="date"
                value={form.appointment_date}
                onChange={(event) => updateField("appointment_date", event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Appointment Time *</Label>
              <Input
                type="time"
                value={form.appointment_time}
                onChange={(event) => updateField("appointment_time", event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Visit Type</Label>
              <Select
                value={form.visit_type}
                onValueChange={(value) => updateField("visit_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New Visit</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Symptoms or reason for visit"
              />
            </div>
          </div>

          <Button className="mt-6 w-full" onClick={submit} disabled={submitting}>
            {submitting ? "Booking appointment..." : "Book Appointment"}
          </Button>
        </section>
      </div>
    </main>
  );
}
