import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { BedDouble, CalendarDays, Clock3, Save, Stethoscope, UserRoundPlus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  getAdmissions,
  admitNewPatient,
  dischargePatient,
  admitFromOpd,addAdvancePayment
} from "@/api/ipd-api";
import { useEffect, useState } from "react";
import { collectAdvance } from "@/api/ipd-payment-api";

const admissionSchema = z.object({
  patientId: z.string().optional(),
  uhid: z.string().optional(),
  opdNo: z.string().optional(),
  name: z.string().min(2, "Patient name is required"),
  gender: z.enum(["Male", "Female", "Other", "-"]).optional(),
  dob: z.string().optional(),
  ageYears: z.coerce.number().min(0).default(0),
  ageMonths: z.coerce.number().min(0).max(11).default(0),
  ageDays: z.coerce.number().min(0).max(30).default(0),
  mobile: z
    .string()
    .min(10, "Mobile number should be at least 10 digits")
    .or(z.literal(""))
    .optional(),
  address: z.string().min(2, "Address is required"),
  city: z.string().optional(),
  emergencyContact: z.string().optional(),
  attendantName: z.string().optional(),
  doctorId: z.string().optional(),
  department: z.string().optional(),
  admissionDate: z.string().min(1, "Admission date is required"),
  admissionTime: z.string().min(1, "Admission time is required"),
  expectedDischargeDate: z.string().optional(),
  ward: z.string().min(1, "Ward is required"),
  roomCategory: z.enum(["General", "Semi-Private", "Private", "ICU"]).default("General"),
  roomNumber: z.string().optional(),
  bedNumber: z.string().optional(),
  admissionType: z.enum([
  "New",
  "Existing",
  "OPD"
]).default("New"),
  reason: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  insurer: z.string().optional(),
  insurancePolicy: z.string().optional(),
  advancePayment: z.coerce.number().min(0).default(0),
  packageName: z.string().optional(),
  referral: z.string().optional(),
  status: z.enum(["Admitted", "Observation", "Pending"]).default("Admitted"),
});

type FormData = z.infer<typeof admissionSchema>;

const wardOptions = ["General", "ICU", "Private", "Semi-Private", "Pediatric", "Maternity"];
const roomCategoryOptions = ["General", "Semi-Private", "Private", "ICU"];
const admissionTypeOptions = [
  "New",
  "Existing",
  "OPD"
];
const statusOptions = ["Admitted", "Observation", "Pending"];

export const Route = createFileRoute("/_authenticated/ipd/admission")({
  component: Page,
});

interface Admission {
  id: number;
  admission_no: string;
}

function Page() {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      name: "",
      gender: "Male",
      mobile: "",
      address: "",
      ageYears: 0,
      ageMonths: 0,
      ageDays: 0,
      admissionDate: new Date().toISOString().slice(0, 10),
      admissionTime: new Date().toTimeString().slice(0, 5),
      ward: "General",
      roomCategory: "General",
      admissionType: "New",
      status: "Admitted",
      advancePayment: 0,
    },
  });

  
const [admissions, setAdmissions] =
  useState<Admission[]>([]);

const loadAdmissions = async () => {
  try {
    const data = await getAdmissions();
    setAdmissions(data);
  } catch (err) {
    console.error(err);
  }
};

useEffect(() => {
  loadAdmissions();
}, []);

  const syncAgeFromDob = (dobValue: string) => {
    if (!dobValue) return;

    const dob = new Date(`${dobValue}T00:00:00`);
    if (Number.isNaN(dob.getTime())) return;

    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    let days = today.getDate() - dob.getDate();

    if (days < 0) {
      months -= 1;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    setValue("ageYears", Math.max(0, years));
    setValue("ageMonths", Math.max(0, months));
    setValue("ageDays", Math.max(0, days));
  };

  const syncDobFromAge = (years: number, months: number, days: number) => {
    setValue("ageYears", years);
    setValue("ageMonths", months);
    setValue("ageDays", days);

    const today = new Date();
    const dob = new Date(
      today.getFullYear() - years,
      today.getMonth() - months,
      today.getDate() - days,
    );

    setValue("dob", dob.toISOString().slice(0, 10));
  };

  const onSubmit = async (values: FormData) => {
  try {
    const payload = {
      patient_id: values.patientId
        ? Number(values.patientId)
        : null,

      name: values.name,

      mobile: values.mobile,

      gender: values.gender,

      age: Number(values.ageYears ?? 0),

      address: values.address,

      doctor_id: values.doctorId
        ? Number(values.doctorId)
        : null,

      ward: values.ward,

      room: values.roomNumber,

      bed_no: values.bedNumber,

      diagnosis: values.diagnosis,

      // payment_mode: "Cash",
    };

    let response;

    // NEW PATIENT
    if (
      values.admissionType === "New"
    ) {
      const admission =
        await admitNewPatient(payload);
console.log("Admission Response", admission);
        if (
  Number(values.advancePayment) > 0
) {
  await addAdvancePayment(
    admission.id,
    {
      amount: Number(
        values.advancePayment
      ),
      payment_mode: "Cash",
      remarks: "Admission Advance"
    }
  );
}
    }

    // OLD PATIENT
    else if (
      values.admissionType === "Existing"
    ) {
      response =
        await admitExistingPatient(
          payload
        );
    }

    // OPD TO IPD
    else if (
      values.admissionType === "OPD"
    ) {
      response =
        await admitFromOpd(payload);
    }

    console.log(
      "Admission Success",
      response
    );

    toast.success(
      "Patient admitted successfully"
    );

    reset();
  } catch (error: any) {
    console.error(error);

    toast.error(
      error?.response?.data?.detail ||
      "Admission failed"
    );
  }
};

  return (
    <>
      <PageHeader title="IPD Admission" description="Register inpatient admission details and room allocation." />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border shadow-soft p-5 space-y-5"
        >
          <Section title="Patient Information" icon={<UserRoundPlus className="h-4 w-4" />}>
            <div className="grid md:grid-cols-4 gap-3">
              <Field label="UHID">
                <Input placeholder="UHID" {...register("uhid")} />
              </Field>

              <Field label="OPD No">
                <Input placeholder="OPD Number" {...register("opdNo")} />
              </Field>

              <Field label="Patient Name" error={errors.name?.message}>
                <Input placeholder="Enter patient name" {...register("name")} />
              </Field>

              <Field label="Gender">
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? "Male"} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        <SelectItem value="-">-</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field label="Date of Birth">
                <Input
                  type="date"
                  {...register("dob", {
                    onChange: (e) => syncAgeFromDob(e.target.value),
                  })}
                />
              </Field>

              <Field label="Age">
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="Y"
                    {...register("ageYears", { valueAsNumber: true })}
                    onChange={(e) =>
                      syncDobFromAge(
                        Number(e.target.value) || 0,
                        Number(watch("ageMonths")) || 0,
                        Number(watch("ageDays")) || 0,
                      )
                    }
                  />
                  <Input
                    type="number"
                    min={0}
                    max={11}
                    placeholder="M"
                    {...register("ageMonths", { valueAsNumber: true })}
                    onChange={(e) =>
                      syncDobFromAge(
                        Number(watch("ageYears")) || 0,
                        Number(e.target.value) || 0,
                        Number(watch("ageDays")) || 0,
                      )
                    }
                  />
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    placeholder="D"
                    {...register("ageDays", { valueAsNumber: true })}
                    onChange={(e) =>
                      syncDobFromAge(
                        Number(watch("ageYears")) || 0,
                        Number(watch("ageMonths")) || 0,
                        Number(e.target.value) || 0,
                      )
                    }
                  />
                </div>
              </Field>

              <Field label="Mobile" error={errors.mobile?.message}>
                <Input placeholder="+91 98765 43210" {...register("mobile")} />
              </Field>

              <Field label="Emergency Contact">
                <Input placeholder="Guardian / emergency phone" {...register("emergencyContact")} />
              </Field>

              <Field label="Attendant Name">
                <Input placeholder="Attendant / relative" {...register("attendantName")} />
              </Field>

              <Field label="Address" className="md:col-span-2" error={errors.address?.message}>
                <Textarea rows={2} placeholder="Address" {...register("address")} />
              </Field>

              <Field label="City">
                <Input placeholder="City" {...register("city")} />
              </Field>
            </div>
          </Section>

          <Section title="Admission Details" icon={<CalendarDays className="h-4 w-4" />}>
            <div className="grid md:grid-cols-4 gap-3">
              <Field label="Admission Date" error={errors.admissionDate?.message}>
                <Input type="date" {...register("admissionDate")} />
              </Field>

              <Field label="Admission Time" error={errors.admissionTime?.message}>
                <Input type="time" {...register("admissionTime")} />
              </Field>

              <Field label="Expected Discharge">
                <Input type="date" {...register("expectedDischargeDate")} />
              </Field>

              <Field label="Admission Type">
                <Controller
                  name="admissionType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? "Emergency"} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {admissionTypeOptions.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              {/* <Field label="Consultant Doctor">
                <Select
  value={field.value}
  onValueChange={field.onChange}
>
  {doctors.map((d) => (
    <SelectItem
      key={d.id}
      value={String(d.id)}
    >
      {d.first_name}
    </SelectItem>
  ))}
</Select>
              </Field> */}

              <Field label="Department">
                <Input placeholder="Department" {...register("department")} />
              </Field>

              <Field label="Ward" error={errors.ward?.message}>
                <Controller
                  name="ward"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? "General"} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ward" />
                      </SelectTrigger>
                      <SelectContent>
                        {wardOptions.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field label="Room Category">
                <Controller
                  name="roomCategory"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? "General"} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Room category" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomCategoryOptions.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field label="Room Number">
                <Input placeholder="Room no." {...register("roomNumber")} />
              </Field>

              <Field label="Bed Number">
                <Input placeholder="Bed no." {...register("bedNumber")} />
              </Field>

              <Field label="Referral">
                <Input placeholder="Referring doctor / source" {...register("referral")} />
              </Field>

              <Field label="Status">
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? "Admitted"} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
          </Section>

          <Section title="Clinical Summary" icon={<Stethoscope className="h-4 w-4" />}>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Reason for Admission">
                <Textarea rows={2} placeholder="Reason / complaint" {...register("reason")} />
              </Field>

              <Field label="Diagnosis">
                <Textarea rows={2} placeholder="Provisional / confirmed diagnosis" {...register("diagnosis")} />
              </Field>

              <Field label="Clinical Notes" className="md:col-span-2">
                <Textarea rows={3} placeholder="Observations, risk flags, treatment summary..." {...register("notes")} />
              </Field>
            </div>
          </Section>

          <Section title="Billing & Insurance" icon={<BedDouble className="h-4 w-4" />}>
            <div className="grid md:grid-cols-4 gap-3">
              <Field label="Insurance Provider">
                <Input placeholder="Insurance company" {...register("insurer")} />
              </Field>

              <Field label="Policy Number">
                <Input placeholder="Policy / card no." {...register("insurancePolicy")} />
              </Field>

              <Field label="Advance Payment">
                <Input type="number" min={0} step="0.01" {...register("advancePayment")} />
              </Field>

              <Field label="Package Name">
                <Input placeholder="Package / plan" {...register("packageName")} />
              </Field>
            </div>
          </Section>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline">
              Save Draft
            </Button>

            <Button type="submit" className="bg-primary text-primary-foreground">
              <Save className="h-4 w-4 mr-1.5" />
              Admit Patient
            </Button>
          </div>
        </motion.div>
      </form>
    </>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  error,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1">{children}</div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}