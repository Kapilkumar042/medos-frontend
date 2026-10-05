import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CreatableSelect from "react-select/creatable";
import { Plus, Trash2, Pencil, IndianRupee, Upload, FileDown } from "lucide-react";
import { toast } from "sonner";
import { useDoctorStore, type Doctor } from "@/store/doctorStore";

export const Route = createFileRoute("/_authenticated/master/doctor-profile")({
  component: Page,
});

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const nullableNonNegativeInt = z.preprocess(
  (value) => (value === "" || value == null ? null : Number(value)),
  z.number().int().min(0).nullable(),
);

const schema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  altPhone: z.string().optional(),
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  registration_no: z.string().optional(),
  experience_years: z.coerce.number().min(0),
  department: z.string().optional(),
  designation: z.string().optional(),
  normal_fee: z.coerce.number().optional(),
  on_call_fee: z.coerce.number().optional(),
  emergency_fee: z.coerce.number().optional().optional(),
  follow_up_fee: z.coerce.number().optional().optional(),
  available_days: z.array(z.string()).optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  follow_up_free: z.boolean().nullable().optional(),
follow_up_period_days: nullableNonNegativeInt,
free_follow_up_count: nullableNonNegativeInt,
  status: z.enum(["Active", "Inactive"]).optional(),
});

type FormValues = z.infer<typeof schema>;

const defaults: FormValues = {
  first_name: "",
  last_name: "",
  gender: "Male",
  email: "",
  phone: "",
  altPhone: "",
  specialization: "",
  qualification: "",
  registration_no: "",
  experience_years: 0,
  department: "",
  designation: "",
  normal_fee: 0,
  on_call_fee: 0,
  emergency_fee: 0,
  follow_up_fee: 0,
  available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  start_time: "10:00",
  end_time: "17:00",
  status: "Active",
  follow_up_free: null,
  follow_up_period_days: null,
  free_follow_up_count: null,
};

const EXCEL_COLUMNS = [
  "first_name",
  "last_name",
  "gender",
  "email",
  "phone",
  "altPhone",
  "specialization",
  "qualification",
  "registration_no",
  "experience_years",
  "department",
  "designation",
  "normal_fee",
  "on_call_fee",
  "emergency_fee",
  "follow_up_fee",
  "available_days",
  "start_time",
  "end_time",
  "status",
  "follow_up_free",
  "follow_up_period_days",
  "free_follow_up_count",
];
const dayOptions = WEEKDAYS.map((day) => ({ value: day, label: day }));
const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];
function Page() {
  const { doctors, fetchDoctors, loading, removeDoctor, addDoctor, updateDoctor, importDoctors } =
    useDoctorStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      EXCEL_COLUMNS,
      [
        "Aarav",
        "Mehta",
        "Male",
        "aarav@example.com",
        "+91 9876543210",
        "",
        "Cardiology",
        "MBBS, MD",
        "MCI-2011-45231",
        12,
        "Cardiology",
        "Sr. Consultant",
        300,
        600,
        1500,
        2000,
        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "10:00",
        "17:00",
        "Active",
      ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Doctors");
    XLSX.writeFile(wb, "doctor-import-template.xlsx");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importDoctors(file);
      // await fetchDoctors(); // refresh the list after import
      toast.success("Imported doctors successfully", {
        duration: 500,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to import doctors", {
        duration: 500,
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

type FormOutput = z.output<typeof schema>;

const form = useForm<FormValues, unknown, FormOutput>({
  resolver: zodResolver(schema),
  defaultValues: defaults,
});

  const openAdd = () => {
    setEditingId(null);
    form.reset(defaults);
    setOpen(true);
  };

  const openEdit = (d: Doctor) => {
    setEditingId(d.id);
    form.reset({
      first_name: d.first_name,
      last_name: d.last_name || "",
      email: d.email || "",
      phone: d.phone || "",
      altPhone: d.alt_phone || "",
      on_call_fee: d.on_call_fee || 0,
      emergency_fee: d.emergency_fee || 0,
      follow_up_fee: d.follow_up_fee || 0,
      normal_fee: d.normal_fee || 0,
      specialization: d.specialization || "",
      qualification: d.qualification || "",
      registration_no: d.registration_no || "",
      experience_years: d.experience_years || 0,
      start_time: d.start_time ?? "",
      end_time: d.end_time ?? "",
      available_days: d.available_days || [],
      department: d.department || "",
      designation: d.designation || "",
      follow_up_free: d.follow_up_free ?? null,
      follow_up_period_days: d.follow_up_period_days ?? null,
      free_follow_up_count: d.free_follow_up_count ?? null,
    });
    setOpen(true);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);
  const onSubmit = (v: FormValues) => {
    const payload = {
      ...v,
      follow_up_free: v.follow_up_free ?? null,
      follow_up_period_days: v.follow_up_period_days ?? null,
      free_follow_up_count: v.free_follow_up_count ?? null,
      available_days: v.available_days ?? [],
      start_time: v.start_time?.trim() || null,
      end_time: v.end_time?.trim() || null,
    };
    if (editingId) {
      updateDoctor(editingId, payload);
      toast.success("Doctor updated", {
        duration: 500,
      });
    } else {
      addDoctor(payload);
      toast.success("Doctor added", {
        duration: 500,
      });
    }
    setOpen(false);
  };

  const columns: Column<Doctor>[] = [
    {
      key: "name",
      header: "Doctor",
      accessor: (r) => `${r.first_name} ${r.last_name}`,
      sortable: true,
      cell: (r) => (
        <div>
          <div className="font-medium">
            Dr. {r.first_name} {r.last_name}
          </div>
          <div className="text-xs text-muted-foreground">{r.qualification}</div>
        </div>
      ),
    },
    {
      key: "specialization",
      header: "Specialization",
      accessor: (r) => r.specialization,
      sortable: true,
    },
    { key: "department", header: "Department", accessor: (r) => r.department },
    {
      key: "phone",
      header: "Contact",
      cell: (r) => (
        <div className="text-xs">
          <div>{r.phone}</div>
          <div className="text-muted-foreground">{r.email}</div>
        </div>
      ),
    },
    {
      key: "normal_fee",
      header: "Normal Fee",
      accessor: (r) => r.normal_fee,
      sortable: true,
      cell: (r) => (
        <span className="inline-flex items-center">
          <IndianRupee className="h-3 w-3" />
          {r.normal_fee}
        </span>
      ),
    },
    {
      key: "on_call_fee",
      header: "On-Call Fee",
      accessor: (r) => r.on_call_fee,
      sortable: true,
      cell: (r) => (
        <span className="inline-flex items-center">
          <IndianRupee className="h-3 w-3" />
          {r.on_call_fee}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge variant={r.status === "Active" ? "default" : "secondary"}>{r.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(r)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive"
            onClick={() => {
              removeDoctor(r.id);
              toast.success("Doctor removed", {
                duration: 500,
              });
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Profile"
        description="Manage doctors, specializations & consultation fees"
      >
        <Button variant="outline" onClick={downloadTemplate} className="gap-1.5">
          <FileDown className="h-4 w-4" /> Template
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
          <Upload className="h-4 w-4" /> Import Excel
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleImport}
        />
        <Button onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Doctor
        </Button>
      </PageHeader>

      <DataTable
        data={doctors}
        columns={columns}
        searchKeys={["first_name", "last_name", "specialization", "department", "email", "phone"]}
        exportFileName="doctors"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Doctor" : "Add Doctor"}</DialogTitle>
            <DialogDescription>
              Fill in the doctor's profile, credentials and consultation fees.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Section title="Personal Information">
              <Field label="First Name" error={form.formState.errors.first_name?.message}>
                <Input {...form.register("first_name")} />
              </Field>
              <Field label="Last Name" error={form.formState.errors.last_name?.message}>
                <Input {...form.register("last_name")} />
              </Field>
              <Field label="Gender">
                <CreatableSelect
                  isClearable
                  options={genderOptions}
                  // value={form.watch("gender")}
                />
                {/* <Select
                  value={form.watch("gender")}
                  onValueChange={(v) => form.setValue("gender", v as FormValues["gender"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select> */}
              </Field>
              <Field label="Email" error={form.formState.errors.email?.message}>
                <Input type="email" {...form.register("email")} />
              </Field>
              <Field label="Phone" error={form.formState.errors.phone?.message}>
                <Input {...form.register("phone")} />
              </Field>
              <Field label="Alternate Phone">
                <Input {...form.register("altPhone")} />
              </Field>
              <Field label="Status">
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as FormValues["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </Section>

            <Section title="Professional Details">
              <Field label="Specialization" error={form.formState.errors.specialization?.message}>
                <Input placeholder="e.g. Cardiology" {...form.register("specialization")} />
              </Field>
              <Field label="Qualification" error={form.formState.errors.qualification?.message}>
                <Input placeholder="MBBS, MD" {...form.register("qualification")} />
              </Field>
              <Field
                label="Registration No."
                error={form.formState.errors.registration_no?.message}
              >
                <Input {...form.register("registration_no")} />
              </Field>
              <Field label="Experience (Years)">
                <Input type="number" min={0} {...form.register("experience_years")} />
              </Field>
              <Field label="Department" error={form.formState.errors.department?.message}>
                <Input {...form.register("department")} />
              </Field>
              <Field label="Designation" error={form.formState.errors.designation?.message}>
                <Input
                  placeholder="Consultant / Sr. Consultant"
                  {...form.register("designation")}
                />
              </Field>
            </Section>

            <Section title="Consultation Fees">
              <Field label="Normal Fee (₹)" error={form.formState.errors.normal_fee?.message}>
                <Input type="number" min={0} {...form.register("normal_fee")} />
              </Field>
              <Field label="On-Call Fee (₹)" error={form.formState.errors.on_call_fee?.message}>
                <Input type="number" min={0} {...form.register("on_call_fee")} />
              </Field>
              <Field label="Emergency Fee (₹)">
                <Input type="number" min={0} {...form.register("emergency_fee")} />
              </Field>
              <Field label="Follow-up Fee (₹)">
                <Input type="number" min={0} {...form.register("follow_up_fee")} />
              </Field>
              <Field label="Follow-up is free">
  <Select
    value={
      form.watch("follow_up_free") == null
        ? "unset"
        : String(form.watch("follow_up_free"))
    }
    onValueChange={(value) =>
      form.setValue(
        "follow_up_free",
        value === "unset" ? null : value === "true",
        { shouldDirty: true },
      )
    }
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="unset">Not set</SelectItem>
      <SelectItem value="true">Yes</SelectItem>
      <SelectItem value="false">No</SelectItem>
    </SelectContent>
  </Select>
</Field>

<Field label="Follow-up period (days)">
  <Input
    type="number"
    min={0}
    value={form.watch("follow_up_period_days") ?? ""}
    onChange={(event) =>
      form.setValue(
        "follow_up_period_days",
        event.target.value === "" ? null : Number(event.target.value),
        { shouldDirty: true },
      )
    }
  />
</Field>

<Field label="Free follow-up count">
  <Input
    type="number"
    min={0}
    value={form.watch("free_follow_up_count") ?? ""}
    onChange={(event) =>
      form.setValue(
        "free_follow_up_count",
        event.target.value === "" ? null : Number(event.target.value),
        { shouldDirty: true },
      )
    }
  />
</Field>
            </Section>

            <Section title="Availability">
              <Field label="Available Days">
  <CreatableSelect
    isMulti
    isClearable
    closeMenuOnSelect={false}
    options={[
      { value: "ALL", label: "All Days" },
      ...dayOptions,
    ]}
    value={
      form.watch("available_days")?.length === 7
        ? [{ value: "ALL", label: "All Days" }]
        : (form.watch("available_days") || []).map((day) => ({
            value: day,
            label: day,
          }))
    }
    onChange={(selected) => {
      const values = selected.map((item) => item.value);

      if (values.includes("ALL")) {
        form.setValue(
          "available_days",
          dayOptions.map((day) => day.value)
        );
      } else {
        form.setValue(
          "available_days",
          dayOptions.filter((day) => values.includes(day.value)).map((day) => day.value)
        );
      }
    }}
    placeholder="Select available days..."
  />
</Field>
              <Field label="From">
                <Input type="time" {...form.register("start_time")} />
              </Field>
              <Field label="To">
                <Input type="time" {...form.register("end_time")} />
              </Field>
            </Section>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingId ? "Update Doctor" : "Save Doctor"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-semibold mb-3 text-primary">{title}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
      {error && <div className="text-[11px] text-destructive mt-1">{error}</div>}
    </div>
  );
}
