import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Save, ArrowLeft } from "lucide-react";
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
import { PageHeader } from "@/components/shared/PageHeader";
import { toast } from "sonner";
import { useOpdStore } from "@/store/opdStore";
import { opdApi } from "@/lib/opd-api";
import { useDoctors } from "@/hooks/useDoctors";
import CreatableSelect from "react-select/creatable";
import {
  patientTypes,
  titleOptions,
  genderOptions,
  bloodGroupOptions,
  maritalStatusOptions,
  relationshipOptions,
} from "./data";

const searchSchema = z.object({
  edit: z.coerce.string().optional(),
});

export const Route = createFileRoute("/_authenticated/opd/edit")({
  component: Page,
  validateSearch: (s) => searchSchema.parse(s),
});

const schema = z.object({
  name: z.string().min(2, "Required"),
  gender: z.enum(["Male", "Female", "-"]),
  salutation: z.enum(["Mr.", "Mrs.", "Miss.", "Master", "Baby", "Dr."]),
  patient_type: z.enum(["New Patient", "Existing Patient", "Emergency", "Free", "RGHS"]),
  relation: z.enum(["Self", "Spouse", "Child", "Parent", "Sibling", "Wife", "Brother"]),
  dob: z.string().min(1, "Required"),
  dateTime: z.string().min(1, "Required"),
  mobile: z.string().min(10, "Min 10 digits"),
  relative_name: z.string().optional(),
  email: z.string().email().or(z.literal("")).optional(),
  address: z.string().min(2, "Required"),
  bloodGroup: z.string(),
  marital: z.string().optional(),
  occupation: z.string().optional(),
  emergency: z.string().optional(),
  doctorId: z.string().optional(),
  department: z.string().min(1, "Required"),
  consultant: z.string().optional(),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  city_town: z.string().optional(),
  religion: z.string().optional(),
  pincode: z.string().optional(),
  education: z.string().optional(),
  reference: z.string().optional(),
  visitDate: z.string().min(1, "Required"),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function Page() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const editId = search.edit;
  const { doctors, loading: doctorsLoading } = useDoctors();
  const [latestVisit, setLatestVisit] = useState<any>(null);
  const [latestBill, setLatestBill] = useState<any>(null);

  const existing = useOpdStore((s) =>
    editId ? s.patients.find((p) => p.id === editId) : undefined,
  );
  const updatePatient = useOpdStore((s) => s.updatePatient);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      gender: "Male",
      salutation: "Mr.",
      patient_type: "New Patient",
      relation: "Self",
      dob: "",
      dateTime: new Date().toISOString().slice(0, 10),
      mobile: "",
      relative_name: "",
      email: "",
      address: "",
      bloodGroup: "O+",
      marital: "Not Specified",
      occupation: "",
      emergency: "",
      doctorId: "",
      department: "",
      consultant: "",
      idProofType: "",
      idProofNumber: "",
      state: "",
      district: "",
      city_town: "",
      religion: "Hindu",
      pincode: "",
      education: "",
      reference: "",
      visitDate: new Date().toISOString().slice(0, 10),
      symptoms: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!editId) return;

    opdApi.getPatient(editId).then((patient) => {
      reset({
        name: patient.name ?? "",
        gender: patient.gender ?? "Male",
        salutation: patient.salutation ?? "Mr.",
        patient_type: patient.patient_type ?? "New Patient",
        relation: patient.relation ?? "Self",
        dob: patient.dob ?? "",
        dateTime: patient.date_time ?? patient.dateTime ?? "",
        mobile: patient.mobile ?? "",
        relative_name: patient.relative_name ?? "",
        email: patient.email ?? "",
        address: patient.address ?? "",
        bloodGroup: patient.blood_group ?? patient.bloodGroup ?? "O+",
        marital: patient.marital ?? "Not Specified",
        occupation: patient.occupation ?? "",
        emergency: patient.emergency ?? "",
        doctorId: String(patient.doctor_id ?? patient.doctorId ?? ""),
        department: patient.department ?? "",
        consultant: patient.consultant ?? "",
        idProofType: patient.id_proof_type ?? patient.idProofType ?? "",
        idProofNumber: patient.id_proof_number ?? patient.idProofNumber ?? "",
        state: patient.state ?? "",
        district: patient.district ?? "",
        city_town: patient.city_town ?? "",
        religion: patient.religion ?? "Hindu",
        pincode: patient.pincode ?? "",
        education: patient.education ?? "",
        reference: patient.reference ?? "",
        visitDate: patient.visit_date ?? patient.visitDate ?? "",
        symptoms: patient.symptoms ?? "",
        notes: patient.notes ?? "",
      });
    });
  }, [editId, reset]);

  useEffect(() => {
    if (!editId) return;
    Promise.all([opdApi.listVisits(), opdApi.listBills()]).then(([visits, bills]) => {
      const patientVisits = (visits as any[]).filter(
        (v) => String(v.patient_id) === String(editId),
      );
      const patientBills = (bills as any[]).filter((b) => String(b.patient_id) === String(editId));
      setLatestVisit(
        patientVisits.sort(
          (a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime(),
        )[0] ?? null,
      );
      setLatestBill(patientBills.sort((a, b) => b.id - a.id)[0] ?? null);
    });
  }, [editId]);

  const onSubmit = async (d: FormData) => {
    if (!editId) return;

    try {
      const payload = {
        name: d.name,
        gender: d.gender,
        dob: d.dob,
        mobile: d.mobile,
        address: d.address,
        blood_group: d.bloodGroup,
        doctor_id: d.doctorId,
        department: d.department,
        email: d.email,
        state: d.state,
        district: d.district,
        city_town: d.city_town,
        pincode: d.pincode,
        occupation: d.occupation,
        marital: d.marital,
        emergency: d.emergency,
        reference: d.reference,
        salutation: d.salutation,
        patient_type: d.patient_type,
        relation: d.relation,
        relative_name: d.relative_name,
        date_time: d.dateTime,
        id_proof_type: d.idProofType,
        id_proof_number: d.idProofNumber,
        religion: d.religion,
        education: d.education,
        consultant: d.consultant,
      };

      const updated = await opdApi.updatePatient(editId, payload);
      updatePatient(editId, {
        ...updated,
        id: String(updated.id),
        bloodGroup: updated.blood_group ?? d.bloodGroup,
        doctorId: String(updated.doctor_id ?? d.doctorId ?? ""),
        dateTime: updated.date_time ?? d.dateTime,
        visitDate: updated.visit_date ?? d.visitDate,
      });

      toast.success("Patient updated successfully");
      navigate({ to: "/opd/patients" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to update patient");
    }
  };

  return (
    <>
      <PageHeader
        title="Edit OPD Patient"
        description="Update patient details separately from registration."
      >
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => navigate({ to: "/opd/patients" })}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
        </Button>
        <Button
          size="sm"
          form="edit-patient-form"
          type="submit"
          className="bg-primary text-primary-foreground hover:opacity-90"
        >
          <Save className="h-4 w-4 mr-1.5" /> Save Changes
        </Button>
      </PageHeader>

      <form id="edit-patient-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-2xl bg-card border border-border shadow-soft p-5 space-y-5">
          <Section title="Patient Information">
            <div className="grid md:grid-cols-4 gap-3">
              <Field label="Patient Type" error={errors.patient_type?.message}>
                <Controller
                  name="patient_type"
                  control={control}
                  render={({ field }) => (
                    <CreatableSelect
                      options={patientTypes}
                      isClearable
                      placeholder="Select Patient Type"
                      value={patientTypes.find((o) => o.value === field.value) ?? null}
                      onChange={(option) => field.onChange(option?.value ?? "New Patient")}
                    />
                  )}
                />
              </Field>

              <Field label="Salutation" error={errors.salutation?.message}>
                <Controller
                  name="salutation"
                  control={control}
                  render={({ field }) => (
                    <CreatableSelect
                      options={titleOptions}
                      value={titleOptions.find((o) => o.value === field.value) ?? null}
                      onChange={(option) => {
                        const salutation = option?.value ?? "Mr.";

                        field.onChange(salutation);

                        const gender =
                          salutation === "Mr." || salutation === "Master"
                            ? "Male"
                            : salutation === "Dr."
                              ? "-"
                              : "Female";

                        setValue("gender", gender);
                      }}
                    />
                  )}
                />
              </Field>

              <Field label="Patient Name" error={errors.name?.message}>
                <Input {...register("name")} />
              </Field>

              <Field label="Gender" error={errors.gender?.message}>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <CreatableSelect
                      options={genderOptions}
                      value={genderOptions.find((o) => o.value === field.value) ?? null}
                      onChange={(option) => field.onChange(option?.value ?? "Male")}
                    />
                  )}
                />
              </Field>

              <Field label="Date of Birth" error={errors.dob?.message}>
                <Input type="date" {...register("dob")} />
              </Field>

              <Field label="Mobile" error={errors.mobile?.message}>
                <Input {...register("mobile")} />
              </Field>

              <Field label="Relation">
                <Controller
                  name="relation"
                  control={control}
                  render={({ field }) => (
                    <CreatableSelect
                      options={relationshipOptions}
                      value={relationshipOptions.find((o) => o.value === field.value) ?? null}
                      onChange={(option) => field.onChange(option?.value ?? "Self")}
                    />
                  )}
                />
              </Field>

              <Field label="Relative Name">
                <Input {...register("relative_name")} />
              </Field>

              <Field label="Email">
                <Input type="email" {...register("email")} />
              </Field>

              <Field label="Marital Status">
                <Controller
                  name="marital"
                  control={control}
                  render={({ field }) => (
                    <CreatableSelect
                      options={maritalStatusOptions}
                      value={maritalStatusOptions.find((o) => o.value === field.value) ?? null}
                      onChange={(option) => field.onChange(option?.value ?? "Not Specified")}
                    />
                  )}
                />
              </Field>

              <Field label="Blood Group">
                <Controller
                  name="bloodGroup"
                  control={control}
                  render={({ field }) => (
                    <CreatableSelect
                      options={bloodGroupOptions}
                      value={bloodGroupOptions.find((o) => o.value === field.value) ?? null}
                      onChange={(option) => field.onChange(option?.value ?? "Not Specified")}
                    />
                  )}
                />
              </Field>

              <Field label="Address" className="md:col-span-2" error={errors.address?.message}>
                <Textarea rows={3} {...register("address")} />
              </Field>
            </div>
          </Section>

          <Section title="Visit & Consultant Details">
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="Consultant Doctor">
                <Controller
                  name="doctorId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const doc = doctors.find((x) => String(x.id) === value);
                        if (doc) setValue("department", doc.specialization);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={doctorsLoading ? "Loading..." : "Select doctor"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors
                          .filter((d: any) => d.status === "Active")
                          .map((d: any) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                              Dr. {d.first_name} {d.last_name} — {d.specialization}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field label="Department" error={errors.department?.message}>
                <Input {...register("department")} />
              </Field>

              <Field label="Visit Date" error={errors.visitDate?.message}>
                <Input type="date" {...register("visitDate")} />
              </Field>

              <Field label="Symptoms">
                <Input {...register("symptoms")} />
              </Field>

              <Field label="Notes" className="md:col-span-2">
                <Textarea rows={2} {...register("notes")} />
              </Field>
            </div>
          </Section>

          <Section title="Latest Visit & Billing">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium mb-2">Latest Visit</p>
                {latestVisit ? (
                  <div className="space-y-1 text-muted-foreground">
                    <p>Date: {latestVisit.visit_date}</p>
                    <p>Department: {latestVisit.department}</p>
                    <p>Symptoms: {latestVisit.symptoms || "—"}</p>
                    <p>Notes: {latestVisit.notes || "—"}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No visit found yet.</p>
                )}
              </div>
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium mb-2">Latest Bill</p>
                {latestBill ? (
                  <div className="space-y-1 text-muted-foreground">
                    <p>Bill ID: {latestBill.id}</p>
                    <p>Net Amount: {latestBill.net_amount ?? "—"}</p>
                    <p>Paid Amount: {latestBill.paid_amount ?? "—"}</p>
                    <p>Due Amount: {latestBill.due_amount ?? "—"}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No bill found yet.</p>
                )}
              </div>
            </div>
          </Section>
        </div>
      </form>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{title}</div>
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
