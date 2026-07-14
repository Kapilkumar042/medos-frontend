import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { Plus, Trash2, Save, Printer, Stethoscope } from "lucide-react";
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
import { inr } from "@/lib/format";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useOpdStore } from "@/store/opdStore";
import { debug, log } from "console";
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
  edit: z.string().optional(),
  billing: z.coerce.number().optional(),
});

export const Route = createFileRoute("/_authenticated/opd/registrationbackup")({
  component: Page,
  validateSearch: (s) => searchSchema.parse(s),
});

type BillCategory = "Advance" | "Lab Test" | "Radiology" | "Other" | "Doctor Fee";

const billItem = z.object({
  category: z.enum(["Advance", "Lab Test", "Radiology", "Other", "Doctor Fee"]),
  name: z.string().min(1, "Required"),
  code: z.string().optional(),
  qty: z.coerce.number().min(1),
  amount: z.coerce.number().min(0),
  discount: z.coerce.number().min(0),
  remarks: z.string().optional(),
});
// Schema — make uhid and opdNo optional since backend generates them
const schema = z.object({
  uhid: z.string().optional(), // ← was min(2)
  abha: z.string().optional(),
  aadhaar: z.string().optional(),
  opdNo: z.string().optional(), // ← was min(2)
  name: z.string().min(2, "Required"),
  gender: z.enum(["Male", "Female", "Other"]),
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
  doctorId: z.string().min(1, "Required"),
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
  items: z.array(billItem).min(1),
  discount: z.coerce.number().min(0),
  gstPct: z.coerce.number().min(0),
  totalDiscountAmt: z.coerce.number().min(0),
  totalDiscountPct: z.coerce.number().min(0),
  paymentType: z.enum(["Single Paymode", "Multi Paymode"]),
  payMode1: z.enum(["CASH", "CARD", "UPI", "CHEQUE", "INSURANCE"]),
  amount1: z.coerce.number().min(0),
  remark: z.string().optional(),
  discountSource: z.enum(["Hospital Discount", "Doctor Discount"]),
});
type FormData = z.infer<typeof schema>;

const LAB_CATALOG = [
  { code: "LAB-CBC", name: "CBC – Complete Blood Count", price: 350 },
  { code: "LAB-LFT", name: "LFT – Liver Function Test", price: 650 },
  { code: "LAB-KFT", name: "KFT – Kidney Function Test", price: 700 },
  { code: "LAB-HBA1C", name: "HbA1c", price: 550 },
  { code: "LAB-LIPID", name: "Lipid Profile", price: 800 },
  { code: "LAB-TSH", name: "TSH – Thyroid", price: 450 },
  { code: "LAB-URINE", name: "Urine Routine", price: 200 },
  { code: "LAB-FBS", name: "Fasting Blood Sugar", price: 150 },
];
const RADIO_CATALOG = [
  { code: "RAD-XR-CH", name: "X-Ray Chest PA", price: 400 },
  { code: "RAD-XR-KUB", name: "X-Ray KUB", price: 450 },
  { code: "RAD-USG-ABD", name: "USG Abdomen", price: 1200 },
  { code: "RAD-CT-HEAD", name: "CT Scan Head", price: 3500 },
  { code: "RAD-CT-CHEST", name: "CT Scan Chest", price: 4500 },
  { code: "RAD-MRI-BRAIN", name: "MRI Brain", price: 6500 },
  { code: "RAD-MRI-SPINE", name: "MRI Spine", price: 7000 },
];

function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const { doctors, loading: doctorsLoading } = useDoctors();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const editId = search.edit;
  const showBilling = !editId || search.billing === 1;
  const isEdit = !!editId;
  const existing = useOpdStore((s) =>
    editId ? s.patients.find((p) => p.id === editId) : undefined,
  );
  const addPatient = useOpdStore((s) => s.addPatient);
  const updatePatient = useOpdStore((s) => s.updatePatient);
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    // defaultValues — add all missing required fields
    defaultValues: {
      name: "",
      mobile: "",
      dob: "",
      address: "",
      doctorId: "",
      department: "",
      discount: 0,
      gender: "Male",
      salutation: "Mr.",
      relation: "Self",
      dateTime: today,
      visitDate: today,
      patient_type: "New Patient",
      bloodGroup: "O+",
      district: "Bulandshahr",
      gstPct: 0,
      totalDiscountAmt: 0,
      totalDiscountPct: 0,
      paymentType: "Single Paymode",
      payMode1: "CASH",
      amount1: 0,
      remark: "",
      discountSource: "Hospital Discount",
      items: [
        {
          category: "Advance",
          name: "OPD Advance",
          code: "",
          qty: 1,
          amount: 500,
          discount: 0,
          remarks: "",
        },
      ],
    },
  });
  // ...existing code...

  const allowedSalutations = ["Mr.", "Mrs.", "Miss.", "Master", "Baby", "Dr."] as const;
  function isAllowedSalutation(value: any): value is (typeof allowedSalutations)[number] {
    return allowedSalutations.includes(value);
  }

  const allowedPatientTypes = ["New Patient", "Existing Patient"] as const;
  function isAllowedPatientType(value: any): value is (typeof allowedPatientTypes)[number] {
    return allowedPatientTypes.includes(value);
  }

  const allowedRelations = [
    "Self",
    "Spouse",
    "Child",
    "Parent",
    "Sibling",
    "Wife",
    "Brother",
  ] as const;
  function isAllowedRelation(value: any): value is (typeof allowedRelations)[number] {
    return allowedRelations.includes(value);
  }

  const allowedGenders = ["Male", "Female", "Other"] as const;
  function isAllowedGender(value: any): value is (typeof allowedGenders)[number] {
    return allowedGenders.includes(value);
  }

  const allowedPaymentTypes = ["Single Paymode", "Multi Paymode"] as const;
  function isAllowedPaymentType(value: any): value is (typeof allowedPaymentTypes)[number] {
    return allowedPaymentTypes.includes(value);
  }

  const allowedPayModes = ["CASH", "CARD", "UPI", "CHEQUE", "INSURANCE"] as const;
  function isAllowedPayMode(value: any): value is (typeof allowedPayModes)[number] {
    return allowedPayModes.includes(value);
  }

  const allowedDiscountSources = ["Hospital Discount", "Doctor Discount"] as const;
  function isAllowedDiscountSource(value: any): value is (typeof allowedDiscountSources)[number] {
    return allowedDiscountSources.includes(value);
  }
  const allowedMaritalStatuses = [
    "Single",
    "Married",
    "Divorced",
    "Widowed",
    "Separated",
    "Not Specified",
  ] as const;
  function isAllowedMaritalStatus(value: any): value is (typeof allowedMaritalStatuses)[number] {
    return allowedMaritalStatuses.includes(value);
  }
  const allowedBloodGroups = [
    "A+",
    "A-",
    "B+",
    "B-",
    "O+",
    "O-",
    "AB+",
    "AB-",
    "Not Specified",
  ] as const;
  function isAllowedBloodGroup(value: any): value is (typeof allowedBloodGroups)[number] {
    return allowedBloodGroups.includes(value);
  }
  // ...existing code...

  useEffect(() => {
    if (existing) {
      reset({
        uhid: existing.uhid,
        abha: existing.abha,
        aadhaar: existing.aadhaar,
        opdNo: existing.opdNo,
        name: existing.name,
        gender: isAllowedGender(existing.gender) ? existing.gender : "Male",
        salutation: isAllowedSalutation(existing.salutation) ? existing.salutation : "Mr.",
        patient_type: isAllowedPatientType(existing.patient_type)
          ? existing.patient_type
          : "New Patient",
        relation: isAllowedRelation(existing.relation) ? existing.relation : "Self",
        dob: existing.dob,
        dateTime: existing.dateTime,
        mobile: existing.mobile,
        relative_name: existing.relative_name,
        email: existing.email ?? "",
        address: existing.address,
        bloodGroup: isAllowedBloodGroup(existing.bloodGroup)
          ? existing.bloodGroup
          : "Not Specified",
        marital: isAllowedMaritalStatus(existing.marital) ? existing.marital : "Not Specified",
        occupation: existing.occupation,
        emergency: existing.emergency,
        doctorId: existing.doctorId,
        department: existing.department,
        consultant: existing.consultant,
        idProofType: existing.idProofType,
        idProofNumber: existing.idProofNumber,
        state: existing.state,
        district: existing.district,
        city_town: existing.city_town,
        religion: existing.religion,
        pincode: existing.pincode,
        education: existing.education,
        reference: existing.reference,
        visitDate: existing.visitDate,
        symptoms: existing.symptoms,
        notes: existing.notes,
        items: existing.items ?? [
          {
            category: "Advance",
            name: "OPD Advance",
            code: "",
            qty: 1,
            amount: 500,
            discount: 0,
            remarks: "",
          },
        ],
        discount: existing.discount ?? 0,
        gstPct: existing.gstPct ?? 0,
        totalDiscountAmt: existing.totalDiscountAmt ?? 0,
        totalDiscountPct: existing.totalDiscountPct ?? 0,
        paymentType: isAllowedPaymentType(existing.paymentType)
          ? existing.paymentType
          : "Single Paymode",
        payMode1: isAllowedPayMode(existing.payMode1) ? existing.payMode1 : "CASH",
        amount1: existing.amount1 ?? 0,
        remark: existing.remark ?? "",
        discountSource: isAllowedDiscountSource(existing.discountSource)
          ? existing.discountSource
          : "Hospital Discount",
      });
    }
  }, [existing, reset]);

  // ...existing code...
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const totalDiscountAmt = Number(watch("totalDiscountAmt") || 0);
  const totalDiscountPct = Number(watch("totalDiscountPct") || 0);
  const amount1 = Number(watch("amount1") || 0);

  const totals = useMemo(() => {
    const sub = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.amount) || 0), 0);
    const itemDisc = items.reduce((s, i) => s + (Number(i.discount) || 0), 0);
    const afterItemDisc = Math.max(0, sub - itemDisc);
    const pctDisc = (afterItemDisc * totalDiscountPct) / 100;
    const totalDisc = itemDisc + totalDiscountAmt + pctDisc;
    const net = Math.max(0, sub - totalDisc);
    const due = Math.max(0, net - amount1);
    return { sub, itemDisc, totalDisc, net, due };
  }, [items, totalDiscountAmt, totalDiscountPct, amount1]);
  console.log("thisi");

  // onSubmit — remove uhid/opdNo from API call, they come back from backend
  const onSubmit = async (d: FormData) => {
    try {
      const patient = await opdApi.createPatient({
        name: d.name,
        gender: d.gender,
        dob: d.dob,
        mobile: d.mobile,
        address: d.address,
        bloodGroup: d.bloodGroup,
        doctorId: d.doctorId,
        department: d.department,
        consultant: d.consultant,
        email: d.email,
        aadhaar: d.aadhaar,
        abha: d.abha,
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
        dateTime: d.dateTime,
        idProofType: d.idProofType,
        idProofNumber: d.idProofNumber,
        religion: d.religion,
        education: d.education,
        // uhid and opdNo NOT sent — backend generates these
      });

      const visit = await opdApi.createVisit({
        patient_id: patient.id,
        doctor_id: Number(d.doctorId),
        department: d.department,
        visit_date: d.visitDate,
        symptoms: d.symptoms,
        notes: d.notes,
      });

      if (showBilling) {
        await opdApi.createBill({
          patient_id: patient.id,
          visitId: visit.id,
          items: d.items,
          total_amount: totals.sub,
          total_discount: totals.totalDisc,
          net_amount: totals.net,
          paid_amount: d.amount1,
          due_amount: totals.due,
          payment_mode: d.payMode1,
          discount_source: d.discountSource,
          remark: d.remark,
        });
      }

      toast.success("Patient Registered Successfully");
      navigate({ to: "/opd/patients" });
    } catch (error) {
      console.error(error);
      toast.error("Registration Failed");
    }
  };

  const addRow = (category: BillCategory) => {
    append({ category, name: "", code: "", qty: 1, amount: 0, discount: 0, remarks: "" });
  };

  const rowsOf = (cat: BillCategory) =>
    fields.map((f, idx) => ({ f, idx })).filter(({ idx }) => items[idx]?.category === cat);

  const handlePreviewPrint = () => {
    const d = getValues();
    printBill(d, totals, doctors);
  };
  const headerTitle = isEdit ? (showBilling ? "OPD Billing" : "Edit Patient") : "OPD Registration";
  const headerDesc = isEdit
    ? showBilling
      ? "Generate bill for the selected OPD patient."
      : "Update patient information."
    : "Register new walk-in patients with billing.";
  const saveLabel = isEdit
    ? showBilling
      ? "Save & Generate Bill"
      : "Update Patient"
    : "Save & Generate Bill";

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("🔴 Zod validation errors:", errors);
    }
  }, [errors]);
  return (
    <>
      <PageHeader title={headerTitle} description={headerDesc}>
        {showBilling && (
          <Button variant="outline" size="sm" type="button" onClick={handlePreviewPrint}>
            <Printer className="h-4 w-4 mr-1.5" /> Preview Bill
          </Button>
        )}
        <Button
          size="sm"
          form="reg-form"
          type="submit"
          className="gradient-blue text-white border-0 hover:opacity-90"
        >
          <Save className="h-4 w-4 mr-1.5" /> {saveLabel}
        </Button>
      </PageHeader>

      <form id="reg-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-soft p-5 space-y-5"
        >
          <Section title="Search & Create ABHA ID">
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="ABHA Number">
                <Input {...register("abha")} placeholder="14-digit ABHA" />
              </Field>
              <Field label="Aadhaar Number">
                <Input {...register("aadhaar")} placeholder="XXXX-XXXX-XXXX" />
              </Field>
              <Field label="Mobile" error={errors.mobile?.message}>
                <Input {...register("mobile")} placeholder="+91 9876543211" />
              </Field>
              {/* <Button size="sm" form="reg-form" type="submit" className="gradient-blue text-white border-0 hover:opacity-90">
           Create ABHA ID
        </Button> */}
            </div>
          </Section>
          <Section title="Patient Information">
            <div className="grid md:grid-cols-4 gap-3">
              {/* <Field label="UHID" error={errors.uhid?.message}>
                <Input {...register("uhid")} />
              </Field> */}
              <Field label="Patient Type">
                <CreatableSelect
                  options={patientTypes}
                  isClearable
                  placeholder="Select Patient Type"
                  onChange={(option) => {
                    const value = option?.value;
                    if (isAllowedPatientType(value)) {
                      setValue("patient_type", value);
                    } else {
                      setValue("patient_type", "New Patient");
                    }
                  }}
                />
              </Field>
              {/* <Field label="OPD NO" error={errors.opdNo?.message}>
                <Input {...register("opdNo")} />
              </Field> */}
              <Field label="SALUTATION">
                <CreatableSelect
                  options={titleOptions}
                  isClearable
                  placeholder="Select Salutation"
                  onChange={(option) => {
                    const value = option?.value;
                    if (isAllowedSalutation(value)) {
                      setValue("salutation", value);
                    } else {
                      setValue("salutation", "Mr.");
                    }
                  }}
                />
                {/* <Select defaultValue="Mr." onValueChange={(v) => setValue("salutation", v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr.">Mr.</SelectItem>
                    <SelectItem value="Mrs.">Mrs.</SelectItem>
                    <SelectItem value="Miss.">Miss</SelectItem>
                    <SelectItem value="Master">Master</SelectItem>
                    <SelectItem value="Baby">Baby</SelectItem>
                    <SelectItem value="Dr.">Dr</SelectItem>
                  </SelectContent>
                </Select> */}
              </Field>
              <Field label="Patient Name" error={errors.name?.message}>
                <Input
                  {...register("name")}
                  placeholder="Enter Patient Name"
                  className="placeholder:text-gray-400 placeholder:text-sm"
                />
              </Field>
              <Field label="Gender">
                <CreatableSelect
                  options={genderOptions}
                  isClearable
                  placeholder="Select Gender"
                  onChange={(option) => {
                    const value = option?.value;
                    if (isAllowedGender(value)) {
                      setValue("gender", value);
                    } else {
                      setValue("gender", "Male");
                    }
                  }}
                />
                {/* <Select defaultValue="Male" onValueChange={(v) => setValue("gender", v as any)}>
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
              <Field label="CONSULTATION DATE & TIME" error={errors.dateTime?.message}>
                <Input type="date" {...register("dateTime")} />
              </Field>
              <Field label="Date of Birth" error={errors.dob?.message}>
                <Input type="date" {...register("dob")} />
              </Field>
              <Field label="Mobile" error={errors.mobile?.message}>
                <Input {...register("mobile")} />
              </Field>
              <Field label="Relation">
                <CreatableSelect
                  options={relationshipOptions}
                  isClearable
                  placeholder="Select Relationship"
                  onChange={(option) => {
                    const value = option?.value;
                    if (isAllowedRelation(value)) {
                      setValue("relation", value);
                    } else {
                      setValue("relation", "Self");
                    }
                  }}
                />
              </Field>
              <Field label="Relative Name">
                <Input type="text" {...register("relative_name")} />
              </Field>
              <Field label="ID Proof Type">
                <Select
                  defaultValue="Aadhaar Card"
                  onValueChange={(v) => setValue("idProofType", v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aadhaar Card">Aadhaar Card</SelectItem>
                    <SelectItem value="PAN Card">PAN Card</SelectItem>
                    <SelectItem value="Passport">Passport</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="ID PROOF NUMBER">
                <Input type="text" {...register("idProofNumber")} />
              </Field>
              <Field label="Marital Status">
                <CreatableSelect
                  options={maritalStatusOptions}
                  isClearable
                  placeholder="Select Marital Status"
                  onChange={(option) => {
                    const value = option?.value;
                    if (isAllowedMaritalStatus(value)) {
                      setValue("marital", value);
                    } else {
                      setValue("marital", "Not Specified");
                    }
                  }}
                />
              </Field>
              <Field label="RELIGION">
                <Select defaultValue="Hindu" onValueChange={(v) => setValue("religion", v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hindu">Hindu</SelectItem>
                    <SelectItem value="Muslim">Muslim</SelectItem>
                    <SelectItem value="Christian">Christian</SelectItem>
                    <SelectItem value="Sikh">Sikh</SelectItem>
                    <SelectItem value="Buddhist">Buddhist</SelectItem>
                    <SelectItem value="Jain">Jain</SelectItem>
                    <SelectItem value="Not Specified">Not Specified</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Occupation">
                <Input {...register("occupation")} />
              </Field>
              <Field label="Email">
                <Input type="email" {...register("email")} />
              </Field>
              <Field label="Emergency Contact">
                <Input {...register("emergency")} />
              </Field>
              <Field label="Blood Group">
                <CreatableSelect
                  options={bloodGroupOptions}
                  isClearable
                  placeholder="Select Blood Group"
                  onChange={(option) => {
                    const value = option?.value;
                    if (isAllowedBloodGroup(value)) {
                      setValue("bloodGroup", value);
                    } else {
                      setValue("bloodGroup", "Not Specified");
                    }
                  }}
                />
              </Field>
              <Field label="Address" className="md:col-span-3" error={errors.address?.message}>
                <Textarea rows={2} {...register("address")} />
              </Field>
            </div>
          </Section>

          <Section title="Visit Details">
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="Consultant Doctor" error={errors.doctorId?.message}>
                <Select
                  onValueChange={(v) => {
                    setValue("doctorId", v);
                    const doc = doctors.find((x) => String(x.id) === v);
                    if (doc) setValue("department", doc.specialization);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={doctorsLoading ? "Loading..." : "Select doctor"} />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors
                      .filter((d) => d.is_available)
                      .map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          Dr. {d.full_name} #{d.user_id} — {d.specialization} (Room {d.room_no})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Department" error={errors.department?.message}>
                <Input {...register("department")} />
              </Field>
              <Field label="Reference Doctor">
                <Input {...register("reference")} />
              </Field>
              <Field label="Visit Date" error={errors.visitDate?.message}>
                <Input type="date" {...register("visitDate")} />
              </Field>
              <Field label="Symptoms" className="md:col-span-2">
                <Input {...register("symptoms")} placeholder="Chief complaints" />
              </Field>
              <Field label="Notes" className="md:col-span-3">
                <Textarea rows={2} {...register("notes")} />
              </Field>
            </div>
          </Section>

          {/* <Section title="Billing Items">
            <div className="space-y-2">
              {fields.map((f, i) => (
                <div key={f.id} className="grid grid-cols-12 gap-2 items-start">
                  <Input className="col-span-6" placeholder="Description" {...register(`items.${i}.description`)} />
                  <Input className="col-span-2" type="number" placeholder="Qty" {...register(`items.${i}.qty`)} />
                  <Input className="col-span-3" type="number" placeholder="Price" {...register(`items.${i}.price`)} />
                  <Button type="button" variant="ghost" size="icon" className="col-span-1" onClick={() => remove(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", qty: 1, price: 0 })}>
                <Plus className="h-4 w-4 mr-1.5" /> Add Item
              </Button>
            </div>
          </Section> */}
        </motion.div>
        {showBilling && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl bg-card border border-border shadow-soft p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Billing</h3>
                  <p className="text-xs text-muted-foreground">
                    Add charges across categories. Lab & Radiology are pickable from catalog.
                  </p>
                </div>
              </div>

              <Tabs defaultValue="Advance">
                <TabsList className="flex flex-wrap h-auto justify-between">
                  <TabsTrigger value="Advance">Advance</TabsTrigger>
                  <TabsTrigger value="Lab Test">Lab Test</TabsTrigger>
                  <TabsTrigger value="Radiology">Radiology Test</TabsTrigger>
                  <TabsTrigger value="Other">Other Services</TabsTrigger>
                  <TabsTrigger value="Doctor Fee">Doctor Fees</TabsTrigger>
                </TabsList>

                {(["Advance", "Lab Test", "Radiology", "Other", "Doctor Fee"] as const).map(
                  (cat) => (
                    <TabsContent key={cat} value={cat} className="mt-4">
                      <BillTable
                        rows={rowsOf(cat)}
                        category={cat}
                        register={register}
                        setValue={setValue}
                        control={control}
                        remove={remove}
                        onAdd={() => addRow(cat)}
                      />
                    </TabsContent>
                  ),
                )}
              </Tabs>
            </motion.div>

            {/* Bill Summary BELOW the items card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl bg-card border border-border shadow-soft p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Bill Summary</h3>
                <div className="text-sm text-muted-foreground">
                  Net Payable:{" "}
                  <span className="text-primary font-semibold text-base">{inr(totals.net)}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-3">
                <Field label="Total Amount">
                  <Input value={fmt(totals.sub)} readOnly className="bg-muted/40" />
                </Field>
                <Field label="Item Discount">
                  <Input value={fmt(totals.itemDisc)} readOnly className="bg-muted/40" />
                </Field>
                <Field label="Total Discount (Amt.)">
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="0"
                    {...register("totalDiscountAmt")}
                  />
                </Field>

                <Field label="Total Discount (%)">
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    placeholder="0"
                    {...register("totalDiscountPct")}
                  />
                </Field>
                <Field label="Total Discount">
                  <Input
                    value={fmt(totals.totalDisc)}
                    readOnly
                    className="bg-muted/40 text-destructive font-medium"
                  />
                </Field>
                <Field label="Net Amount">
                  <Input
                    value={fmt(totals.net)}
                    readOnly
                    className="bg-muted/40 font-semibold text-primary"
                  />
                </Field>

                <Field label="Payment Type">
                  <Select
                    defaultValue="Single Paymode"
                    onValueChange={(v) => setValue("paymentType", v as FormData["paymentType"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single Paymode">Single Paymode</SelectItem>
                      <SelectItem value="Multi Paymode">Multi Paymode</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="PayMode-1">
                  <Select
                    defaultValue="CASH"
                    onValueChange={(v) => setValue("payMode1", v as FormData["payMode1"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["CASH", "CARD", "UPI", "CHEQUE", "INSURANCE"].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Amount-1 (Paid)">
                  <Input type="number" step="0.01" min={0} {...register("amount1")} />
                </Field>

                <Field label="Total Due Amount">
                  <Input value={fmt(totals.due)} readOnly className="bg-muted/40 font-medium" />
                </Field>
                <Field label="Discount Hospital/Doctor">
                  <Select
                    defaultValue="Hospital Discount"
                    onValueChange={(v) =>
                      setValue("discountSource", v as FormData["discountSource"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hospital Discount">Hospital Discount</SelectItem>
                      <SelectItem value="Doctor Discount">Doctor Discount</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Remark">
                  <Input placeholder="Remark" {...register("remark")} />
                </Field>
              </div>

              <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={handlePreviewPrint}>
                  <Printer className="h-4 w-4 mr-1.5" /> Preview Bill
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:opacity-90"
                >
                  <Save className="h-4 w-4 mr-1.5" /> Save & Generate Bill
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </form>
    </>
  );
}

function BillTable({
  rows,
  category,
  register,
  setValue,
  control,
  remove,
  onAdd,
}: {
  rows: { idx: number }[];
  category: BillCategory;
  register: UseFormRegister<FormData>;
  setValue: UseFormSetValue<FormData>;
  control: Control<FormData>;
  remove: (i: number) => void;
  onAdd: () => void;
}) {
  const catalog =
    category === "Lab Test" ? LAB_CATALOG : category === "Radiology" ? RADIO_CATALOG : null;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2 font-medium min-w-[220px]">Item Name</th>
              <th className="text-left px-3 py-2 font-medium w-[130px]">Item Code</th>
              <th className="text-left px-3 py-2 font-medium w-[80px]">Qty</th>
              <th className="text-left px-3 py-2 font-medium w-[110px]">Amount</th>
              <th className="text-left px-3 py-2 font-medium w-[110px]">Discount</th>
              <th className="text-left px-3 py-2 font-medium w-[110px]">Net Amt</th>
              <th className="text-left px-3 py-2 font-medium min-w-[160px]">Remarks</th>
              <th className="w-[44px]"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-muted-foreground py-6 text-xs">
                  No items. Click "Add" to insert a row.
                </td>
              </tr>
            )}
            {rows.map(({ idx }) => (
              <BillRow
                key={idx}
                idx={idx}
                catalog={catalog}
                register={register}
                setValue={setValue}
                control={control}
                remove={remove}
              />
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1.5" /> Add {category}
      </Button>
    </div>
  );
}

function BillRow({
  idx,
  catalog,
  register,
  setValue,
  control,
  remove,
}: {
  idx: number;
  catalog: { code: string; name: string; price: number }[] | null;
  register: UseFormRegister<FormData>;
  setValue: UseFormSetValue<FormData>;
  control: Control<FormData>;
  remove: (i: number) => void;
}) {
  return (
    <tr className="border-t border-border">
      <td className="px-2 py-1.5">
        {catalog ? (
          <Select
            onValueChange={(v) => {
              const it = catalog.find((x) => x.code === v);
              if (it) {
                setValue(`items.${idx}.name`, it.name);
                setValue(`items.${idx}.code`, it.code);
                setValue(`items.${idx}.amount`, it.price);
              }
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select test…" />
            </SelectTrigger>
            <SelectContent>
              {catalog.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name} — ₹{c.price}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input className="h-9" {...register(`items.${idx}.name`)} placeholder="Item name" />
        )}
      </td>
      <td className="px-2 py-1.5">
        <Input className="h-9" {...register(`items.${idx}.code`)} />
      </td>
      <td className="px-2 py-1.5">
        <Input className="h-9" type="number" {...register(`items.${idx}.qty`)} />
      </td>
      <td className="px-2 py-1.5">
        <Input className="h-9" type="number" {...register(`items.${idx}.amount`)} />
      </td>
      <td className="px-2 py-1.5">
        <Input className="h-9" type="number" {...register(`items.${idx}.discount`)} />
      </td>
      <td className="px-2 py-1.5">
        <NetCell idx={idx} control={control} />
      </td>
      <td className="px-2 py-1.5">
        <Input className="h-9" {...register(`items.${idx}.remarks`)} placeholder="Remarks" />
      </td>
      <td className="px-2 py-1.5">
        <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </td>
    </tr>
  );
}

function NetCell({ idx, control }: { idx: number; control: Control<FormData> }) {
  const item = useWatch({ control, name: `items.${idx}` }) as FormData["items"][number] | undefined;
  const net = Math.max(
    0,
    (Number(item?.qty) || 0) * (Number(item?.amount) || 0) - (Number(item?.discount) || 0),
  );
  return <Input className="h-9 bg-muted/40" value={net} readOnly tabIndex={-1} />;
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
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

/* ---------------- Print Bill ---------------- */

function printBill(
  d: FormData,
  totals: { sub: number; itemDisc: number; totalDisc: number; net: number; due: number },
  doctorsList: import("@/hooks/useDoctors").Doctor[],
) {
  const doctor = doctorsList.find((x) => String(x.id) === String(d.doctorId));
  const doctorLabel = doctor
    ? `Dr. ${doctor.full_name} (User #${doctor.user_id}) — ${doctor.specialization}`
    : "-";
  const billNo = `BL-${Date.now().toString().slice(-8)}`;
  const dateStr = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const rows = d.items
    .map((i, idx) => {
      const net = Math.max(
        0,
        (Number(i.qty) || 0) * (Number(i.amount) || 0) - (Number(i.discount) || 0),
      );
      return `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(i.name)}<div class="muted">${escapeHtml(i.category)}${i.code ? " • " + escapeHtml(i.code) : ""}</div></td>
        <td class="r">${i.qty}</td>
        <td class="r">₹${fmt(i.amount)}</td>
        <td class="r">₹${fmt(i.discount)}</td>
        <td class="r">₹${fmt(net)}</td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"/>
<title>Bill ${billNo}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; }
  .wrap { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
  .head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; background: linear-gradient(135deg,#2D5CF2,#5b82ff); color: #fff; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo { width: 44px; height: 44px; border-radius: 10px; background: #fff; color: #2D5CF2; display:flex; align-items:center; justify-content:center; font-weight: 800; font-size: 20px; }
  .brand h1 { margin: 0; font-size: 18px; }
  .brand .sub { font-size: 11px; opacity: .9; }
  .meta { text-align: right; font-size: 12px; }
  .meta .billno { font-size: 14px; font-weight: 700; }
  .sect { padding: 16px 22px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 13px; }
  .grid div span { color: #64748b; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: #475569; margin: 0 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 8px 10px; border-bottom: 1px solid #eef2f7; text-align: left; }
  th { background: #f8fafc; font-size: 11px; text-transform: uppercase; color: #64748b; }
  td.r, th.r { text-align: right; }
  .muted { color: #94a3b8; font-size: 11px; }
  .totals { margin-top: 12px; margin-left: auto; width: 280px; font-size: 13px; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals .net { border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 8px; font-weight: 700; font-size: 15px; color:#2D5CF2; }
  .foot { padding: 14px 22px; background: #f8fafc; font-size: 11px; color: #64748b; display:flex; justify-content:space-between; }
  @media print { body { padding: 0; } .wrap { border: none; } }
</style></head>
<body>
  <div class="wrap">
    <div class="head">
      <div class="brand">
        <div class="logo">M+</div>
        <div>
          <h1>MedOS Hospital</h1>
          <div class="sub">123 Health Avenue, Bengaluru • +91 98765 43210</div>
        </div>
      </div>
      <div class="meta">
        <div class="billno">Bill # ${billNo}</div>
        <div>${dateStr}</div>
        <div>GSTIN: 29ABCDE1234F1Z5</div>
      </div>
    </div>

    <div class="sect">
      <h2>Patient Information</h2>
      <div class="grid">
        <div><span>UHID:</span> <b>${escapeHtml(d.uhid)}</b></div>
        <div><span>Name:</span> <b>${escapeHtml(d.name)}</b></div>
        <div><span>Gender / DOB:</span> ${escapeHtml(d.gender)} / ${escapeHtml(d.dob || "-")}</div>
        <div><span>Blood Group:</span> ${escapeHtml(d.bloodGroup)}</div>
        <div><span>Mobile:</span> ${escapeHtml(d.mobile)}</div>
        <div><span>Email:</span> ${escapeHtml(d.email || "-")}</div>
        <div style="grid-column:1/-1"><span>Address:</span> ${escapeHtml(d.address)}</div>
   <div><span>Doctor:</span> ${escapeHtml(doctorLabel)}</div>
        <div><span>Department:</span> ${escapeHtml(d.department)}</div>
        <div><span>Visit Date:</span> ${escapeHtml(d.visitDate)}</div>
        <div><span>Symptoms:</span> ${escapeHtml(d.symptoms || "-")}</div>
      </div>
    </div>

    <div class="sect">
      <h2>Billing Items</h2>
      <table>
        <thead>
          <tr><th>#</th><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Disc</th><th class="r">Net</th></tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:18px">No items</td></tr>`}</tbody>
      </table>

      <div style="display:flex; gap:20px; align-items:flex-start; margin-top:12px;">
        <div style="flex:0 0 180px; text-align:center; padding:10px; border:1px solid #e2e8f0; border-radius:10px; background:#f8fafc;">
          <div style="font-size:10px; text-transform:uppercase; letter-spacing:.06em; color:#64748b; margin-bottom:6px;">Scan for Patient Info</div>
          <img src="${patientQrUrl(d, billNo, dateStr, doctorLabel)}" alt="Patient QR" style="width:150px;height:150px;background:#fff;border-radius:8px;padding:4px;border:1px solid #e2e8f0"/>
          <div style="font-size:11px; margin-top:6px; font-weight:600;">${escapeHtml(d.name)}</div>
          <div style="font-size:10px; color:#64748b;">UHID: ${escapeHtml(d.uhid)}</div>
        </div>
        <div class="totals" style="margin:0 0 0 auto;">
          <div><span>Total Amount</span><span>₹${fmt(totals.sub)}</span></div>
          <div><span>Item Discount</span><span>− ₹${fmt(totals.itemDisc)}</span></div>
          <div><span>Bill Discount</span><span>− ₹${fmt(totals.totalDisc - totals.itemDisc)}</span></div>
          <div><span>Discount Source</span><span>${escapeHtml(d.discountSource)}</span></div>
          <div class="net"><span>Net Payable</span><span>₹${fmt(totals.net)}</span></div>
          <div><span>Paid (${escapeHtml(d.payMode1)})</span><span>₹${fmt(Number(d.amount1) || 0)}</span></div>
          <div><span>Due Amount</span><span>₹${fmt(totals.due)}</span></div>
        </div>
      </div>
      ${d.remark ? `<p class="muted" style="margin-top:10px"><b>Remark:</b> ${escapeHtml(d.remark)}</p>` : ""}
    </div>

    <div class="foot">
      <div>This is a computer-generated bill. No signature required.</div>
      <div>Thank you for visiting MedOS Hospital.</div>
    </div>
  </div>
  <script>window.onload=()=>{setTimeout(()=>window.print(),200);}</script>
</body></html>`;

  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) {
    toast.error("Pop-up blocked. Allow pop-ups to print the bill.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  // silence unused icon
  void Stethoscope;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(n) || 0);
}
function patientQrUrl(d: FormData, billNo: string, dateStr: string, doctorName?: string) {
  const info = [
    `MedOS Hospital`,
    `Bill No: ${billNo}`,
    `Date: ${dateStr}`,
    `UHID: ${d.uhid}`,
    `Name: ${d.name}`,
    `Gender: ${d.gender}`,
    `DOB: ${d.dob || "-"}`,
    `Blood Group: ${d.bloodGroup}`,
    `Mobile: ${d.mobile}`,
    d.email ? `Email: ${d.email}` : "",
    `Address: ${d.address}`,
    doctorName ? `Doctor: ${doctorName}` : "",
    `Department: ${d.department}`,
    `Visit Date: ${d.visitDate}`,
    d.symptoms ? `Symptoms: ${d.symptoms}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=${encodeURIComponent(info)}`;
}
function escapeHtml(s: string | undefined) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
