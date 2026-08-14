import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  patientTypes,
  titleOptions,
  genderOptions,
  bloodGroupOptions,
  maritalStatusOptions,
  relationshipOptions,
} from "./data";
import { openBillPreview, type BillPrintData } from "@/lib/opd-bill-print";
const searchSchema = z.object({
  edit: z.coerce.string().optional(),
  billing: z.coerce.number().optional(),
  print: z.coerce.number().optional(),
});

export const Route = createFileRoute("/_authenticated/opd/registration")({
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
  patient_type: z.enum(["New Patient", "Existing Patient"]),
  relation: z.enum(["Self", "Spouse", "Child", "Parent", "Sibling", "Wife", "Brother"]),
  dob: z.string().min(1, "Required"),
  age: z.coerce.number().min(0).optional(),
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
  console.log("doctors", doctors);

  const [apiPatient, setApiPatient] = useState<any>(null);

  const search = Route.useSearch();
  const [billCategory, setBillCategory] = useState<BillCategory>("Advance");
  const [zeroBill, setZeroBill] = useState(false);
  const navigate = useNavigate();

  const editId = search.edit;
  console.log("editId", editId);
  const printOnBilling = search.print === 1;
  const showBilling = !editId || search.billing === 1;
  const isEdit = !!editId;
  const existing = useOpdStore((s) =>
    editId ? s.patients.find((p) => p.id === editId) : undefined,
  );
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
      age: 0,
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
  const patientData = existing ?? apiPatient;
  useEffect(() => {
    if (!patientData) return;

    reset({
      uhid: patientData.uhid,
      abha: patientData.abha,
      aadhaar: patientData.aadhaar,
      opdNo: patientData.opdNo,
      name: patientData.name,
      gender: isAllowedGender(patientData.gender) ? patientData.gender : "Male",
      salutation: isAllowedSalutation(patientData.salutation) ? patientData.salutation : "Mr.",
      patient_type: isAllowedPatientType(patientData.patient_type)
        ? patientData.patient_type
        : "New Patient",
      relation: isAllowedRelation(patientData.relation) ? patientData.relation : "Self",
      dob: patientData.dob ?? "",
      dateTime: patientData.date_time ?? patientData.dateTime ?? today,
      mobile: patientData.mobile ?? "",
      relative_name: patientData.relative_name,
      email: patientData.email ?? "",
      address: patientData.address ?? "",
      bloodGroup: isAllowedBloodGroup(patientData.blood_group ?? patientData.bloodGroup)
        ? (patientData.blood_group ?? patientData.bloodGroup)
        : "Not Specified",
      marital: isAllowedMaritalStatus(patientData.marital) ? patientData.marital : "Not Specified",
      occupation: patientData.occupation,
      emergency: patientData.emergency,
      // doctor_id from API is a number, coerce to string
      doctorId: String(patientData.doctor_id ?? patientData.doctorId ?? ""),
      department: patientData.department ?? "",
      consultant: patientData.consultant,
      idProofType: patientData.id_proof_type ?? patientData.idProofType,
      idProofNumber: patientData.id_proof_number ?? patientData.idProofNumber,
      state: patientData.state,
      district: patientData.district ?? "Bulandshahr",
      city_town: patientData.city_town,
      religion: patientData.religion,
      pincode: patientData.pincode,
      education: patientData.education,
      reference: patientData.reference,
      visitDate: patientData.visit_date ?? patientData.visitDate ?? today,
      symptoms: patientData.symptoms,
      notes: patientData.notes,
      items: patientData.items ?? [
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
      discount: patientData.discount ?? 0,
      gstPct: patientData.gstPct ?? 0,
      totalDiscountAmt: patientData.totalDiscountAmt ?? 0,
      totalDiscountPct: patientData.totalDiscountPct ?? 0,
      paymentType: isAllowedPaymentType(patientData.paymentType)
        ? patientData.paymentType
        : "Single Paymode",
      payMode1: isAllowedPayMode(patientData.payMode1) ? patientData.payMode1 : "CASH",
      amount1: patientData.amount1 ?? 0,
      remark: patientData.remark ?? "",
      discountSource: isAllowedDiscountSource(patientData.discountSource)
        ? patientData.discountSource
        : "Hospital Discount",
    });
  }, [patientData, reset]);

  useEffect(() => {
    if (editId) {
      opdApi
        .getPatient(editId)
        .then((data) => {
          setApiPatient(data);
        })
        .catch(console.error);
    }
  }, [editId]);

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
      // const patient = await opdApi.createPatient({
      //   name: d.name,
      //   gender: d.gender,
      //   dob: d.dob,
      //   mobile: d.mobile,
      //   address: d.address,
      //   bloodGroup: d.bloodGroup,
      //   doctorId: d.doctorId,
      //   department: d.department,
      //   consultant: d.consultant,
      //   email: d.email,
      //   aadhaar: d.aadhaar,
      //   abha: d.abha,
      //   state: d.state,
      //   district: d.district,
      //   city_town: d.city_town,
      //   pincode: d.pincode,
      //   occupation: d.occupation,
      //   marital: d.marital,
      //   emergency: d.emergency,
      //   reference: d.reference,
      //   salutation: d.salutation,
      //   patient_type: d.patient_type,
      //   relation: d.relation,
      //   relative_name: d.relative_name,
      //   dateTime: d.dateTime,
      //   idProofType: d.idProofType,
      //   idProofNumber: d.idProofNumber,
      //   religion: d.religion,
      //   education: d.education,
      // });
      const patientPayload = {
        name: d.name,
        gender: d.gender,
        dob: d.dob,
        mobile: d.mobile,
        address: d.address,
        blood_group: d.bloodGroup,
        doctor_id: d.doctorId,
        department: d.department,
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
        date_time: d.dateTime,
        id_proof_type: d.idProofType,
        id_proof_number: d.idProofNumber,
        religion: d.religion,
        education: d.education,
        consultant: d.consultant,
      };

      const patient = editId
        ? await opdApi.updatePatient(editId, patientPayload)
        : await opdApi.createPatient(patientPayload);

      if (editId) {
        updatePatient(editId, {
          ...patient,
          id: String(patient.id),
          bloodGroup: patient.blood_group ?? patient.bloodGroup,
          doctorId: String(patient.doctor_id ?? patient.doctorId ?? ""),
          dateTime: patient.date_time ?? patient.dateTime,
          visitDate: patient.visit_date ?? patient.visitDate,
        });
      }
      const visit = await opdApi.createVisit({
        patient_id: patient.id,
        doctor_id: Number(d.doctorId),
        department: d.department,
        visit_date: d.visitDate,
        symptoms: d.symptoms,
        notes: d.notes,
      });

      let createdBill: any = null;

      if (showBilling) {
        createdBill = await opdApi.createBill({
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

      if (showBilling) {
        const billPreviewPayload: BillPrintData = {
          ...d,
          uhid: patient?.uhid ?? d.uhid,
          opdNo: patient?.opd_no ?? patient?.opdNo ?? d.opdNo,
        };

        const previewOpened = openBillPreview(billPreviewPayload, totals, doctors, {
          autoPrint: true,
          billNo: createdBill?.bill_no ?? createdBill?.billNo ?? createdBill?.id ?? undefined,
        });

        toast.success(
          previewOpened
            ? "Patient registered successfully. Bill preview opened."
            : "Patient registered successfully",
        );
      } else {
        toast.success("Patient registered successfully");
      }

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
    openBillPreview(d as BillPrintData, totals, doctors, { autoPrint: false });
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

  function dobFromAge(years: number) {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date.toISOString().slice(0, 10);
  }
  const displaySub = zeroBill ? 0 : totals.sub;
  const displayTotalDisc = zeroBill ? totals.sub : totals.totalDisc;
  const displayNet = zeroBill ? 0 : totals.net;
  const displayDue = zeroBill ? 0 : totals.due;

  useEffect(() => {
    if (!editId) return;

    // Fetch patient
    opdApi.getPatient(editId).then(setApiPatient).catch(console.error);

    // Fetch latest visit for this patient
    opdApi
      .listVisits()
      .then((visits: any[]) => {
        const latest = visits
          .filter((v) => String(v.patient_id) === String(editId))
          .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime())[0];
        if (latest) {
          setValue("visitDate", latest.visit_date ?? today);
          setValue("symptoms", latest.symptoms ?? "");
          setValue("notes", latest.notes ?? "");
          setValue("doctorId", String(latest.doctor_id ?? ""));
          setValue("department", latest.department ?? "");
        }
      })
      .catch(console.error);

    // Fetch latest bill for this patient
    opdApi
      .listBills()
      .then((bills: any[]) => {
        const latest = bills
          .filter((b) => String(b.patient_id) === String(editId))
          .sort((a, b) => b.id - a.id)[0];
        if (latest) {
          setValue("amount1", latest.paid_amount ?? 0);
          setValue("totalDiscountAmt", latest.total_discount ?? 0);
          setValue("payMode1", latest.payment_mode ?? "CASH");
          setValue("discountSource", latest.discount_source ?? "Hospital Discount");
          setValue("remark", latest.remark ?? "");
          // Restore bill items if stored
          if (Array.isArray(latest.items) && latest.items.length > 0) {
            setValue("items", latest.items);
          }
        }
      })
      .catch(console.error);
  }, [editId]);
  const patientTypeValue = patientTypes.find((o) => o.value === watch("patient_type")) ?? null;
  const salutationValue = titleOptions.find((o) => o.value === watch("salutation")) ?? null;
  const genderValue = genderOptions.find((o) => o.value === watch("gender")) ?? null;
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
              {isEdit && (
                <Field label="UHID">
                  <Input
                    value={watch("uhid") ?? ""}
                    readOnly
                    className="bg-muted/40 font-mono text-xs"
                  />
                </Field>
              )}
              <Field label="Patient Type">
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
              {/* <Field label="OPD NO" error={errors.opdNo?.message}>
                <Input {...register("opdNo")} />
              </Field> */}
              <Field label="SALUTATION">
                <Controller
                  name="salutation"
                  control={control}
                  render={({ field }) => (
                    <CreatableSelect
                      options={titleOptions}
                      value={titleOptions.find((o) => o.value === field.value) ?? null}
                      onChange={(option) => field.onChange(option?.value ?? "Mr.")}
                    />
                  )}
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
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <CreatableSelect
                      options={genderOptions}
                      isClearable
                      placeholder="Select Gender"
                      value={genderOptions.find((o) => o.value === field.value) ?? null}
                      onChange={(option) => field.onChange(option?.value ?? "Male")}
                    />
                  )}
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
              <Field label="Age (years)">
                <Input
                  type="number"
                  min={0}
                  max={120}
                  step={1}
                  {...register("age", { valueAsNumber: true })}
                  onChange={(e) => {
                    const years = Number(e.target.value);
                    if (!Number.isNaN(years)) {
                      setValue("dob", dobFromAge(years));
                    }
                  }}
                />
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
                      isClearable
                      placeholder="Select Relationship"
                      value={relationshipOptions.find((o) => o.value === field.value) ?? null}
                      onChange={(option) => field.onChange(option?.value ?? "Self")}
                    />
                  )}
                />
              </Field>
              <Field label="Relative Name">
                <Input type="text" {...register("relative_name")} />
              </Field>
              <Field label="ID Proof Type">
                <Controller
                  name="idProofType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID proof" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aadhaar Card">Aadhaar Card</SelectItem>
                        <SelectItem value="PAN Card">PAN Card</SelectItem>
                        <SelectItem value="Passport">Passport</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="ID PROOF NUMBER">
                <Input type="text" {...register("idProofNumber")} />
              </Field>
              <Field label="Marital Status">
                <Controller
                  name="marital"
                  control={control}
                  render={({ field }) => (
                    <CreatableSelect
                      options={maritalStatusOptions}
                      isClearable
                      placeholder="Select Marital Status"
                      value={maritalStatusOptions.find((o) => o.value === field.value) ?? null}
                      onChange={(option) => field.onChange(option?.value ?? "Not Specified")}
                    />
                  )}
                />
              </Field>
              <Field label="RELIGION">
                <Controller
                  name="religion"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? "Hindu"} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select religion" />
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
                  )}
                />
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
                <Controller
                  name="bloodGroup"
                  control={control}
                  render={({ field }) => (
                    <CreatableSelect
                      options={bloodGroupOptions}
                      isClearable
                      placeholder="Select Blood Group"
                      value={bloodGroupOptions.find((o) => o.value === field.value) ?? null}
                      onChange={(option) => field.onChange(option?.value ?? "Not Specified")}
                    />
                  )}
                />
              </Field>
              <Field label="Address" className="md:col-span-3" error={errors.address?.message}>
                <Textarea rows={2} {...register("address")} />
              </Field>
            </div>
          </Section>

          <Section title="Visit Details">
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="Visit Purpose">
                <Select
                  value={billCategory}
                  onValueChange={(v) => setBillCategory(v as BillCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Advance">Advance</SelectItem>
                    <SelectItem value="Lab Test">Lab Test</SelectItem>
                    <SelectItem value="Radiology">Radiology Test</SelectItem>
                    <SelectItem value="Other">Other Services</SelectItem>
                    <SelectItem value="Doctor Fee">Doctor Fees</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Consultant Doctor" error={errors.doctorId?.message}>
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
                          .filter((d) => d.status === "Active")
                          .map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                              Dr. {d.first_name} {d.last_name} #{d.user_id} — {d.specialization}{" "}
                              (Room {d.room_no})
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
            </div>
            <div className="flex items-center justify-between mt-4 mb-2">
              <BillTable
                rows={rowsOf(billCategory)}
                category={billCategory}
                register={register}
                setValue={setValue}
                control={control}
                remove={remove}
                onAdd={() => addRow(billCategory)}
              />
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="Reference Doctor">
                <Input {...register("reference")} />
              </Field>
              <Field label="Visit Date" error={errors.visitDate?.message}>
                <Input type="date" {...register("visitDate")} />
              </Field>
              <Field label="Symptoms" className="">
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
            {/* <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl bg-card border border-border shadow-soft p-5"
            > */}
            {/* <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Billing</h3>
                  <p className="text-xs text-muted-foreground">
                    Add charges across categories. Lab & Radiology are pickable from catalog.
                  </p>
                </div>
              </div> */}

            {/* <Tabs defaultValue="Advance">
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
              </Tabs> */}
            {/* </motion.div> */}

            {/* Bill Summary BELOW the items card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl bg-card border border-border shadow-soft p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Bill Summary</h3>
                <div className="md:col-span-4 flex items-center gap-2 mb-3">
                  <Checkbox
                    id="zero-bill"
                    checked={zeroBill}
                    onCheckedChange={(checked) => setZeroBill(Boolean(checked))}
                  />
                  <label htmlFor="zero-bill" className="text-sm">
                    Make bill zero
                  </label>
                </div>
                <div className="text-sm text-muted-foreground">
                  Net Payable:{" "}
                  <span className="text-primary font-semibold text-base">{inr(displayNet)}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-3">
                <Field label="Total Amount">
                  <Input value={fmt(displaySub)} readOnly className="bg-muted/40" />
                </Field>
                <Field label="Item Discount">
                  <Input value={fmt(displayTotalDisc)} readOnly className="bg-muted/40" />
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
                    value={fmt(displayTotalDisc)}
                    readOnly
                    className="bg-muted/40 text-destructive font-medium"
                  />
                </Field>
                <Field label="Net Amount">
                  <Input
                    value={fmt(displayNet)}
                    readOnly
                    className="bg-muted/40 font-semibold text-primary"
                  />
                </Field>

                <Field label="Payment Type">
                  <Controller
                    name="paymentType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? "Single Paymode"}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single Paymode">Single Paymode</SelectItem>
                          <SelectItem value="Multi Paymode">Multi Paymode</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="PayMode-1">
                  <Controller
                    name="payMode1"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value ?? "CASH"} onValueChange={field.onChange}>
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
                    )}
                  />
                </Field>
                <Field label="Amount-1 (Paid)">
                  <Input type="number" step="0.01" min={0} {...register("amount1")} />
                </Field>

                <Field label="Total Due Amount">
                  <Input value={fmt(displayDue)} readOnly className="bg-muted/40 font-medium" />
                </Field>
                <Field label="Discount Hospital/Doctor">
                  <Controller
                    name="discountSource"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? "Hospital Discount"}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hospital Discount">Hospital Discount</SelectItem>
                          <SelectItem value="Doctor Discount">Doctor Discount</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
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

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(n) || 0);
}
