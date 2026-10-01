import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, Printer, Stethoscope, IndianRupee, Percent } from "lucide-react";
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
import { opdApi } from "@/lib/opd-api";
import { useDoctors } from "@/hooks/useDoctors";
// import CreatableSelect from "react-select/creatable";

import { Checkbox } from "@/components/ui/checkbox";
import {
  patientTypes,
  titleOptions,
  genderOptions,
  bloodGroupOptions,
  maritalStatusOptions,
  relationshipOptions,
} from "./data";
import { useAuthStore } from "@/store/authStore";
import { useCatalogStore } from "@/store/catalogStore";
import { openBillPreview, type BillPrintData } from "@/lib/opd-bill-print";
import CreatableSelect, { type CreatableProps } from "react-select/creatable";
import type { GroupBase } from "react-select";
function CompactCreatableSelect<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>({ styles, ...props }: CreatableProps<Option, IsMulti, Group>) {
  return (
    <CreatableSelect
      {...props}
      styles={{
        control: (base) => ({
          ...base,
          minHeight: 32,
          height: 32,
          borderRadius: 12,
        }),
        valueContainer: (base) => ({
          ...base,
          height: 32,
          padding: "0 8px",
        }),
        input: (base) => ({
          ...base,
          margin: 0,
          padding: 0,
        }),
        indicatorsContainer: (base) => ({
          ...base,
          height: 32,
        }),
        ...styles,
      }}
    />
  );
}
const searchSchema = z.object({
  edit: z.coerce.string().optional(),
  billing: z.coerce.number().optional(),
  print: z.coerce.number().optional(),
});
type Visit = {
  id: number;
  patient_id: number | string;
  doctor_id: number;
  department?: string;
  visit_date: string;
  symptoms?: string;
  notes?: string;
};

type Bill = {
  id: number;
  patient_id: number | string;
  items?: FormData["items"] | string;
  total_amount?: number;
  net_amount?: number;
  due_amount?: number;
  paid_amount?: number;
  total_discount?: number;
  payment_mode?: FormData["payMode1"];
  discount_source?: FormData["discountSource"];
  remark?: string;
};

export const Route = createFileRoute("/_authenticated/opd/registration")({
  component: Page,
  validateSearch: (s) => searchSchema.parse(s),
});

type BillCategory =
  | "Advance"
  | "Lab Test"
  | "Radiology"
  | "Other"
  | "Medicine"
  | "Consultation fee";

const billItem = z.object({
  category: z.enum(["Advance", "Lab Test", "Radiology", "Other", "Medicine", "Consultation fee"]),
  name: z.string().optional(),
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
  gender: z.enum(["Male", "Female", "-"]),
  salutation: z.enum(["Mr.", "Mrs.", "Miss.", "Master", "Baby", "Dr."]),
  patient_type: z.enum(["New Patient", "Existing Patient"]),
  relation: z.enum(["Self", "Spouse", "Child", "Parent", "Sibling", "Wife", "Brother"]),
  dob: z.string().min(1, "Required"),
  ageYears: z.coerce.number().int().min(0),
  ageMonths: z.coerce.number().int().min(0),
  ageDays: z.coerce.number().int().min(0),
  dateTime: z.string().optional(),
  mobile: z.string().min(10, "Min 10 digits"),
  relative_name: z.string().optional(),
  email: z.string().email().or(z.literal("")).optional(),
  address: z.string().optional(),
  bloodGroup: z.string(),
  marital: z.string().optional(),
  emergency: z.string().optional(),
  doctorId: z.string().optional(),
  department: z.string().optional(),
  consultant: z.string().optional(),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
  district: z.string().optional(),
  reference: z.string().optional(),
  visitDate: z.string().optional(),
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
function Page() {
  const loadCatalog = useCatalogStore((state) => state.loadCatalog);
  const labItems = useCatalogStore((state) => state.items.lab);
  const radiologyItems = useCatalogStore((state) => state.items.radiology);
  const medicineItems = useCatalogStore((state) => state.items.medicine);
  const serviceItems = useCatalogStore((state) => state.items.service);
  const hospitalName = useAuthStore((state) => state.hospital?.name ?? "Hospital");
  const onInvalid = (formErrors: FieldErrors<FormData>) => {
    console.error("FORM BLOCKED:", formErrors);
    toast.error("Form validation failed. Check the console.");
  };
  const [visitMode, setVisitMode] = useState<"new" | "existing">("new");
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const [visitHistory, setVisitHistory] = useState<any[]>([]);
  const [billHistory, setBillHistory] = useState<any[]>([]);
  const [submitAction, setSubmitAction] = useState<"save" | "print">("save");
  const today = new Date().toISOString().slice(0, 10);
  const { doctors, loading: doctorsLoading } = useDoctors();
  console.log("doctors", doctors);

  const [apiPatient, setApiPatient] = useState<any>(null);

  const search = Route.useSearch();
  const [billCategory, setBillCategory] = useState<BillCategory>("Consultation fee");
  const [zeroBill, setZeroBill] = useState(false);
  const [latestVisit, setLatestVisit] = useState<Visit | null>(null);
  const [latestBill, setLatestBill] = useState<Bill | null>(null);
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
    function getCurrentLocalDateTime() {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
}

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
      ageYears: 0,
      ageMonths: 0,
      ageDays: 0,
      address: "",
      doctorId: "",
      department: "",
      discount: 0,
      gender: "Male",
      salutation: "Mr.",
      relation: "Self",
      dateTime: getCurrentLocalDateTime(),
      marital:"-",
      visitDate: today,
      patient_type: "New Patient",
      bloodGroup: "-",
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
          category: "Consultation fee",
          name: "OPD Consultation",
          code: "",
          qty: 1,
          amount: 0,
          discount: 0,
          remarks: "",
        },
      ],
    },
  });

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

  const allowedGenders = ["Male", "Female", "-"] as const;
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

  const patientData = existing ?? apiPatient;

  useEffect(() => {
    if (!patientData) return;
    const patientAge = Number(patientData.age ?? 0);
    const patientDob = patientData.dob || dobFromAge(patientAge, 0, 0);
    reset({
      uhid: patientData.uhid,
      abha: patientData.abha ?? "",
      aadhaar: patientData.aadhaar ?? "",
      opdNo: patientData.opdNo,
      name: patientData.name,
      gender: isAllowedGender(patientData.gender) ? patientData.gender : "Male",
      salutation: isAllowedSalutation(patientData.salutation) ? patientData.salutation : "Mr.",
      patient_type: isAllowedPatientType(patientData.patient_type)
        ? patientData.patient_type
        : "New Patient",
      relation: isAllowedRelation(patientData.relation) ? patientData.relation : "Self",
      // dob: patientData.dob ?? "",
      dob: patientDob,
      ageYears: patientData.age ?? 0,
      ageMonths: 0,
      ageDays: 0,
      dateTime: patientData.date_time ?? patientData.date_time ?? today,
      mobile: patientData.mobile ?? "",
      relative_name: patientData.relative_name ?? "",
      email: patientData.email ?? "",
      address: patientData.address ?? "",
      bloodGroup: isAllowedBloodGroup(patientData.blood_group ?? patientData.bloodGroup)
        ? (patientData.blood_group ?? patientData.bloodGroup)
        : "Not Specified",
      marital: isAllowedMaritalStatus(patientData.marital) ? patientData.marital : "Not Specified",
      emergency: patientData.emergency ?? "",
      // doctor_id from API is a number, coerce to string
      doctorId: String(patientData.doctor_id ?? patientData.doctorId ?? ""),
      department: patientData.department ?? "",
      consultant: patientData.consultant,
      idProofType: patientData.id_proof_type ?? patientData.idProofType,
      idProofNumber: patientData.id_proof_number ?? patientData.idProofNumber,
      district: patientData.district ?? "Bulandshahr",
      reference: patientData.reference,
      visitDate: patientData.visit_date ?? patientData.visit_date ?? today,
      symptoms: patientData.symptoms,
      notes: patientData.notes,
      items: patientData.items ?? [
        {
          category: "Consultation fee",
          name: "Consultation fee",
          code: "",
          qty: 1,
          amount: 0,
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
    if (patientDob) {
      syncAgeFromDob(patientDob);
    }
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
  useEffect(() => {
    Promise.all([
      loadCatalog("lab"),
      loadCatalog("radiology"),
      loadCatalog("service"),
      loadCatalog("medicine"),
    ]).catch(() => {
      toast.error("Failed to load catalog items");
    });
  }, [loadCatalog]);
  // const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });
  const items = useWatch({
    control,
    name: "items",
    defaultValue: [],
  });
  const totalDiscountAmt = Number(watch("totalDiscountAmt") || 0);
  const totalDiscountPct = Number(watch("totalDiscountPct") || 0);
  const amount1 = Number(watch("amount1") || 0);

  const totals = useMemo(() => {
    const sub = items.reduce(
      (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.amount) || 0),
      0,
    );

    const itemDisc = items.reduce((sum, item) => sum + (Number(item.discount) || 0), 0);

    const discountBase = Math.max(0, sub - itemDisc);
    const totalDisc = Math.min(discountBase, totalDiscountAmt);
    const net = Math.max(0, sub - itemDisc - totalDisc);
    const due = Math.max(0, net - amount1);

    return { sub, itemDisc, totalDisc, net, due, discountBase };
  }, [items, totalDiscountAmt, amount1]);

  const handleDiscountAmountChange = (value: string) => {
    const amount = Math.max(0, Number(value) || 0);
    const percentage = totals.discountBase > 0 ? (amount / totals.discountBase) * 100 : 0;

    setValue("totalDiscountAmt", Number(amount.toFixed(2)), {
      shouldValidate: true,
    });

    setValue("totalDiscountPct", Number(percentage.toFixed(2)), {
      shouldValidate: true,
    });
  };

  const handleDiscountPercentageChange = (value: string) => {
    const percentage = Math.min(100, Math.max(0, Number(value) || 0));
    const amount = (totals.discountBase * percentage) / 100;

    setValue("totalDiscountPct", Number(percentage.toFixed(2)), {
      shouldValidate: true,
    });

    setValue("totalDiscountAmt", Number(amount.toFixed(2)), {
      shouldValidate: true,
    });
  };
  async function openPatientPrint(patientId: number | string): Promise<boolean> {
    // Open immediately so the browser does not block the popup.
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      toast.error("Please allow popups to print the patient receipt");
      return false;
    }

    printWindow.document.write(`
    <html>
      <body>
        <p>Generating patient receipt...</p>
      </body>
    </html>
  `);

    try {
      const html = await opdApi.printPatient(patientId);

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      return true;
    } catch (error) {
      printWindow.close();
      throw error;
    }
  }

  const openWhatsApp = (
    phone: string,
    patientName: string,
    appointmentDate: string,
    appointmentTime: string,
  ) => {
    const digits = phone.replace(/\D/g, "");
    const whatsappPhone = digits.length === 10 ? `91${digits}` : digits;

    const message = `Dear ${patientName},

Your appointment has been booked successfully at ${hospitalName}.

Date: ${appointmentDate}

Thank you,
${hospitalName}`;

    window.open(
      `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  // onSubmit — remove uhid/opdNo from API call, they come back from backend
  const onSubmit = async (d: FormData) => {
    console.log("SUBMIT STARTED", {
      editId,
      submitAction,
      latestVisit,
      latestBill,
      data: d,
    });
    try {
      console.log("Calling patient API");
      const patientPayload = {
        name: d.name,
        gender: d.gender,
        dob: d.dob,
        mobile: d.mobile,
        address: d.address,
        blood_group: d.bloodGroup,
        doctor_id: d.doctorId ? Number(d.doctorId) : null,
        department: d.department,
        email: d.email,
        aadhaar: d.aadhaar || null,
        abha: d.abha || null,
        district: d.district,
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
        consultant: d.consultant,
        status:submitAction === "print" ? "print" : "save",
      };

      let patient;
      if (editId) {
        patient = await opdApi.updatePatient(editId, patientPayload);
      } else {
        patient = await opdApi.createPatient(patientPayload);
      }

      // const patientPrintOpened = await openPatientPrint(patient.id);
      // if (editId) {
      //   updatePatient(editId, {
      //     ...patient,
      //     id: String(patient.id),
      //     bloodGroup: patient.blood_group ?? patient.bloodGroup,
      //     doctorId: String(patient.doctor_id ?? patient.doctorId ?? ""),
      //     dateTime: patient.date_time ?? patient.dateTime,
      //     visitDate: patient.visit_date ?? patient.visitDate,
      //   });
      // }
      const visitPayload = {
        patient_id: patient.id,
        doctor_id: Number(d.doctorId),
        department: d.department ?? "",
        visit_date: d.visitDate,
        symptoms: d.symptoms,
        notes: d.notes,
      };
      let visit;

      if (visitMode === "existing" && selectedVisitId) {
        visit = await opdApi.updateVisit(selectedVisitId, visitPayload);
      } else {
        visit = await opdApi.createVisit(visitPayload);
      }

      let createdBill: any = null;

      if (showBilling) {
        // const billPayload = {
        //   patient_id: patient.id,
        //   visitId: visit.id,
        //   items: d.items,
        //   total_amount: totals.sub,
        //   total_discount: totals.totalDisc,
        //   net_amount: totals.net,
        //   paid_amount: d.amount1,
        //   due_amount: totals.due,
        //   payment_mode: d.payMode1,
        //   discount_source: d.discountSource,
        //   remark: d.remark,
        // };

        const billPayload = {
          patient_id: patient.id,
          visit_id: visit?.id ?? null,
          total_amount: Number(totals.sub),
          total_discount: Number(totals.totalDisc),
          net_amount: Number(totals.net),
          paid_amount: Number(d.amount1),
          payment_mode: d.payMode1,
          remark: d.remark ?? "",
          items: d.items.map((item) => ({
            category: item.category,
            name: item.name,
            code: item.code ?? "",
            qty: Number(item.qty),
            amount: Number(item.amount),
            discount: Number(item.discount),
            remarks: item.remarks ?? "",
          })),
        };

        if (selectedBillId) {
          await opdApi.updateBill(selectedBillId, billPayload);
        } else {
          await opdApi.createBill(billPayload);
        }
      }
      if (submitAction === "print") {
        await openPatientPrint(patient.id);
         openWhatsApp(d.mobile, d.name, d.visitDate, "");
      }
      // if (submitAction === "save") {
      //   openWhatsApp(d.mobile, d.name, d.visitDate, "");
      // }
      if (showBilling) {
        const billPreviewPayload: BillPrintData = {
          ...d,
          uhid: patient?.uhid ?? d.uhid,
          opdNo: patient?.opd_no ?? patient?.opdNo ?? d.opdNo,
        };

        toast.success(
          submitAction === "print"
            ? "Patient saved and receipt opened"
            : "Patient saved successfully",
          {
            duration: 500,
          },
        );
      } else {
        toast.success("Patient registered successfully", {
          duration: 500,
        });
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
const preventNumberKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
    }
  };
  const rowsOf = () => fields.map((_, idx) => ({ idx }));
  const handlePreviewPrint = () => {
    const d = getValues();
  };
  const headerTitle = isEdit ? "Edit Patient" : "New Registration";

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("🔴 Zod validation errors:", errors);
    }
  }, [errors]);

  // function dobFromAge(years: number) {
  //   const date = new Date();
  //   date.setFullYear(date.getFullYear() - years);
  //   return date.toISOString().slice(0, 10);
  // }
  function dobFromAge(years: number, months: number, days: number) {
    const today = new Date();

    const dob = new Date(
      today.getFullYear() - years,
      today.getMonth() - months,
      today.getDate() - days,
    );

    return dob.toISOString().slice(0, 10);
  }
  const displaySub = zeroBill ? 0 : totals.sub;
  const displayTotalDisc = zeroBill ? totals.sub : totals.totalDisc;
  const displayNet = zeroBill ? 0 : totals.net;
  const displayDue = zeroBill ? 0 : totals.due;

  //   useEffect(() => {
  //     if (!editId) return;

  //     const loadRelatedData = async () => {
  //       try {
  //         const [visits, bills] = await Promise.all([opdApi.listVisits(), opdApi.listBills()]);

  //         const patientVisits = visits
  //           .filter((visit: any) => String(visit.patient_id) === String(editId))
  //           .sort(
  //             (a: any, b: any) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime(),
  //           );

  //         const patientBills = bills
  //           .filter((bill: any) => String(bill.patient_id) === String(editId))
  //           .sort((a: any, b: any) => b.id - a.id);

  //         const visit = patientVisits[0] ?? null;
  //         const bill = patientBills[0] ?? null;

  //         setLatestVisit(visit);
  //         setLatestBill(bill);

  //         if (visit) {
  //           setValue("visitDate", visit.visit_date ?? today);
  //           setValue("symptoms", visit.symptoms ?? "");
  //           setValue("notes", visit.notes ?? "");
  //           setValue("doctorId", String(visit.doctor_id ?? ""));
  //           setValue("department", visit.department ?? "");
  //         }

  //        const billSummary = patientBills[0] ?? null;

  // if (billSummary) {
  //   const bill = await opdApi.getBill(billSummary.id);

  //   const billItems =
  //     typeof bill.items === "string"
  //       ? JSON.parse(bill.items)
  //       : Array.isArray(bill.items)
  //         ? bill.items
  //         : [];

  //   setLatestBill({
  //     ...billSummary,
  //     ...bill,
  //   });

  //   setValue("amount1", Number(bill.paid_amount ?? 0));
  //   setValue("totalDiscountAmt", Number(bill.total_discount ?? 0));
  //   setValue("totalDiscountPct", 0);
  //   setValue("payMode1", bill.payment_mode ?? "CASH");
  //   setValue("discountSource", bill.discount_source ?? "Hospital Discount");
  //   setValue("remark", bill.remark ?? "");

  //   if (billItems.length > 0) {
  //     replace(billItems);
  //   } else {
  //     replace([
  //       {
  //         category: "Consultation fee",
  //         name: "OPD Consultation",
  //         code: "",
  //         qty: 1,
  //         amount: Number(bill.total_amount ?? 0),
  //         discount: Number(bill.total_discount ?? 0),
  //         remarks: "",
  //       },
  //     ]);
  //   }
  // }
  //       } catch (error) {
  //         console.error("Failed to load visit or bill data", error);
  //       }
  //     };

  //     loadRelatedData();
  //   }, [editId, setValue, replace, today]);

 useEffect(() => {
  const patientId = editId ?? apiPatient?.id;
  if (!patientId) return;

  let active = true;

  const loadHistory = async () => {
    try {
      const [visits, bills] = await Promise.all([
        opdApi.listVisits(),
        opdApi.listBills(),
      ]);

      if (!active) return;

      const patientVisits = visits
        .filter((visit: any) => String(visit.patient_id) === String(patientId))
        .sort(
          (a: any, b: any) =>
            new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime() ||
            Number(b.id) - Number(a.id),
        );

      const patientBills = bills
        .filter((bill: any) => String(bill.patient_id) === String(patientId))
        .sort((a: any, b: any) => Number(b.id) - Number(a.id));

      setVisitHistory(patientVisits);
      setBillHistory(patientBills);

      const newestVisit = patientVisits[0] ?? null;
      setLatestVisit(newestVisit);
      setSelectedVisitId(newestVisit ? Number(newestVisit.id) : null);
      setVisitMode(newestVisit ? "existing" : "new");

      if (newestVisit) {
        setValue("visitDate", newestVisit.visit_date ?? today);
        setValue("symptoms", newestVisit.symptoms ?? "");
        setValue("notes", newestVisit.notes ?? "");
        setValue("doctorId", String(newestVisit.doctor_id ?? ""));
        setValue("department", newestVisit.department ?? "");
      }

      const newestBill = patientBills[0] ?? null;
      setLatestBill(newestBill);
      setSelectedBillId(newestBill ? Number(newestBill.id) : null);
    } catch (error) {
      if (active) {
        console.error("History load failed", error);
        toast.error("Failed to load patient visit and bill history");
      }
    }
  };

  void loadHistory();

  return () => {
    active = false;
  };
}, [editId, apiPatient?.id, setValue, today]);

useEffect(() => {
  if (!selectedBillId) return;

  let active = true;

  const loadSelectedBill = async () => {
    try {
      const bill = await opdApi.getBill(selectedBillId);

      if (!active) return;

      const parsedItems =
        typeof bill.items === "string"
          ? JSON.parse(bill.items)
          : bill.items;

      const billItems = Array.isArray(parsedItems) ? parsedItems : [];

      if (billItems.length > 0) {
        replace(billItems);

        const category = billItems[0].category as BillCategory;
        const categories: BillCategory[] = [
          "Advance",
          "Lab Test",
          "Radiology",
          "Other",
          "Medicine",
          "Consultation fee",
        ];

        if (categories.includes(category)) {
          setBillCategory(category);
        }
      }

      setValue("amount1", Number(bill.paid_amount ?? 0));
      setValue("totalDiscountAmt", Number(bill.total_discount ?? 0));
      setValue("totalDiscountPct", 0);

      const paymentMode = String(bill.payment_mode ?? "CASH").toUpperCase();
      const allowedPaymentModes = ["CASH", "CARD", "UPI", "CHEQUE", "INSURANCE"] as const;

      setValue(
        "payMode1",
        allowedPaymentModes.includes(paymentMode as (typeof allowedPaymentModes)[number])
          ? (paymentMode as FormData["payMode1"])
          : "CASH",
      );
      setValue("remark", bill.remark ?? "");
    } catch (error) {
      if (active) {
        console.error("Failed to load selected bill", error);
        toast.error("Failed to load bill details");
      }
    }
  };

  void loadSelectedBill();

  return () => {
    active = false;
  };
}, [selectedBillId, replace, setValue]);
  useEffect(() => {
    if (!editId) return;

    opdApi.getPatient(editId).then(setApiPatient).catch(console.error);
  }, [editId]);
  const syncAgeFromDob = (dobValue: string) => {
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
    setValue("dob", dobFromAge(years, months, days), {
      shouldValidate: true,
    });
  };

  const moveToNextField = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter") return;

    const target = event.target as HTMLElement;

    if (
      target.tagName !== "INPUT" &&
      target.tagName !== "TEXTAREA" &&
      target.getAttribute("role") !== "combobox"
    ) {
      return;
    }

    event.preventDefault();

    const fields = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), [role="combobox"]:not([aria-disabled="true"])',
      ),
    );

    const currentIndex = fields.indexOf(target);
    const nextField = fields[currentIndex + 1];

    nextField?.focus();
  };



  return (
    <>
      <PageHeader title={headerTitle}></PageHeader>
      <form
        id="reg-form"
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        onKeyDown={moveToNextField}
        className="space-y-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-soft p-5 space-y-5"
        >
          {/* <Section title="Search & Create ABHA ID">
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
              <Button size="sm" form="reg-form" type="submit" className="gradient-blue text-white border-0 hover:opacity-90">
           Create ABHA ID
        </Button>
            </div>
          </Section> */}
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
                    <CompactCreatableSelect
                      className="h-8"
                      options={patientTypes}
                      isClearable
                      placeholder="Select Patient Type"
                      value={patientTypes.find((o) => o.value === field.value) ?? null}
                      onChange={(option: any) => field.onChange(option?.value ?? "New Patient")}
                    />
                  )}
                />
              </Field>
              <Field label="Salutation">
                <Controller
                  name="salutation"
                  control={control}
                  render={({ field }) => (
                    <CompactCreatableSelect
                      options={titleOptions}
                      value={titleOptions.find((o) => o.value === field.value) ?? null}
                      onChange={(option: any) => {
                        const salutation = option?.value ?? "Mr.";

                        field.onChange(salutation);

                        const gender =
                          salutation === "Mr." || salutation === "Master" || salutation === "Mohd"
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
                    <CompactCreatableSelect
                      options={genderOptions}
                      isClearable
                      placeholder="Select Gender"
                      value={genderOptions.find((o) => o.value === field.value) ?? null}
                      onChange={(option: any) => field.onChange(option?.value ?? "Male")}
                    />
                  )}
                />
              </Field>
              <Field label="Registration Date & Time" error={errors.dateTime?.message}>
                <Input type="datetime-local" {...register("dateTime")} />
              </Field>
              <Field label="Date of Birth" error={errors.dob?.message}>
                <Input
                  type="date"
                  {...register("dob", {
                    onChange: (event) => syncAgeFromDob(event.target.value),
                  })}
                />
              </Field>
              <Field label="Age(yyyy-mm-dd)">
                <div className="grid grid-cols-3">
                  {[
                    {
                      placeholder: "Years",
                      suffix: "YY",
                      value: Number(watch("ageYears")) || 0,
                      onChange: (value: number) =>
                        syncDobFromAge(
                          value,
                          Number(watch("ageMonths")) || 0,
                          Number(watch("ageDays")) || 0,
                        ),
                    },
                    {
                      placeholder: "Months",
                      suffix: "MM",
                      value: Number(watch("ageMonths")) || 0,
                      onChange: (value: number) =>
                        syncDobFromAge(
                          Number(watch("ageYears")) || 0,
                          value,
                          Number(watch("ageDays")) || 0,
                        ),
                    },
                    {
                      placeholder: "Days",
                      suffix: "DD",
                      value: Number(watch("ageDays")) || 0,
                      onChange: (value: number) =>
                        syncDobFromAge(
                          Number(watch("ageYears")) || 0,
                          Number(watch("ageMonths")) || 0,
                          value,
                        ),
                    },
                  ].map((ageField) => (
                    <div key={ageField.suffix} className="flex">
                      <Input
                        type="number"
                        min={0}
                        placeholder={ageField.placeholder}
                        value={ageField.value}
                        onChange={(event) => ageField.onChange(Number(event.target.value) || 0)}
                        className="rounded-none"
                      />
                      <div className="flex items-center rounded-none border border-l-0 bg-muted px-2 text-xs font-semibold text-muted-foreground">
                        {ageField.suffix}
                      </div>
                    </div>
                  ))}
                </div>
              </Field>
              <Field label="Mobile" error={errors.mobile?.message}>
                <Input {...register("mobile")} />
              </Field>
              <Field label="Guardian Name">
                <Input type="text" {...register("relative_name")} />
              </Field>
              <Field label="Guardian/Emergency Contact">
                <Input {...register("emergency")} />
              </Field>
              <Field label="ID Proof Type">
                <Controller
                  name="idProofType"
                  control={control}
                  render={({ field }) => (
                    <CompactCreatableSelect
                      options={[
                        { value: "Aadhaar Card", label: "Aadhaar Card" },
                        { value: "PAN Card", label: "PAN Card" },
                        { value: "Passport", label: "Passport" },
                      ]}
                      value={field.value ? { value: field.value, label: field.value } : null}
                      isClearable
                      isSearchable
                      placeholder="Select or type ID proof"
                      onChange={(option: any) => field.onChange(option?.value ?? "")}
                    />
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
                    <CompactCreatableSelect
                      options={maritalStatusOptions}
                      isClearable
                      placeholder="Select Marital Status"
                      value={maritalStatusOptions.find((o) => o.value === field.value) ?? null}
                      onChange={(option: any) => field.onChange(option?.value ?? "Not Specified")}
                    />
                  )}
                />
              </Field>
              <Field label="Email">
                <Input type="email" {...register("email")} />
              </Field>
              <Field label="Blood Group">
                <Controller
                  name="bloodGroup"
                  control={control}
                  render={({ field }) => (
                    <CompactCreatableSelect
                      options={bloodGroupOptions}
                      isClearable
                      placeholder="Select Blood Group"
                      value={bloodGroupOptions.find((o) => o.value === field.value) ?? null}
                      onChange={(option: any) => field.onChange(option?.value ?? "Not Specified")}
                    />
                  )}
                />
              </Field>
              <Field label="Address" error={errors.address?.message}>
                <Input placeholder="address" {...register("address")} />
              </Field>
            </div>
          </Section>

          <Section title="Visit Details">
            
            <div className="grid md:grid-cols-4 gap-3">
             
              <Field label="Visit Purpose">
                <Select
                  value={billCategory}
                  onValueChange={(value) => {
                    const category = value as BillCategory;

                    setBillCategory(category);

                    const alreadyAdded = items.some((item) => item.category === category);

                    if (!alreadyAdded) {
                      append({
                        category,
                        name: "",
                        code: "",
                        qty: 1,
                        amount: 0,
                        discount: 0,
                        remarks: "",
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select visit purpose" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Advance">Advance</SelectItem>
                    <SelectItem value="Lab Test">Lab Test</SelectItem>
                    <SelectItem value="Radiology">Radiology Test</SelectItem>
                    <SelectItem value="Other">Other Services</SelectItem>
                    <SelectItem value="Medicine">Medicine</SelectItem>
                    <SelectItem value="Consultation fee">Consultation fee</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Consultant Doctor" error={errors.doctorId?.message}>
                <Controller
                  name="doctorId"
                  control={control}
                  render={({ field }) => (
                    <CompactCreatableSelect
                      options={doctors
                        .filter((doctor) => doctor.status)
                        .map((doctor) => ({
                          value: String(doctor.id),
                          label: `Dr. ${doctor.first_name} ${doctor.last_name} - Fee: ${inr(doctor.normal_fee)}`,
                        }))}
                      value={
                        field.value
                          ? {
                              value: field.value,
                              label: doctors.find((doctor) => String(doctor.id) === field.value)
                                ? `Dr. ${
                                    doctors.find((doctor) => String(doctor.id) === field.value)
                                      ?.first_name
                                  } ${
                                    doctors.find((doctor) => String(doctor.id) === field.value)
                                      ?.last_name
                                  }`
                                : field.value,
                            }
                          : null
                      }
                      isClearable
                      isSearchable
                      placeholder="Select or type doctor"
                      onChange={(option) => {
                        const value = option?.value ?? "";
                        field.onChange(value);

                       const doctor = doctors.find((item) => String(item.id) === value);
if (!doctor) return;

setValue("department", doctor.specialization);

const consultationIndex = getValues("items").findIndex(
  (item) => item.category === "Consultation fee",
);

if (consultationIndex >= 0) {
  setValue(
    `items.${consultationIndex}.amount`,
    Number(doctor.normal_fee) || 0,
    { shouldDirty: true, shouldValidate: true },
  );
} else {
  append({
    category: "Consultation fee",
    name: "OPD Consultation",
    code: "",
    qty: 1,
    amount: Number(doctor.normal_fee) || 0,
    discount: 0,
    remarks: "",
  });
}

setBillCategory("Consultation fee");
                      }}
                    />
                  )}
                />
              </Field>
              <Field label="Department" error={errors.department?.message}>
                <Input {...register("department")} />
              </Field>
               <Field label="Visit Type">
  <Select
    value={visitMode}
    onValueChange={(value) => {
      setVisitMode(value as "new" | "existing");
      setSelectedVisitId(null);
    }}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select visit type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="new">New Visit</SelectItem>
      <SelectItem value="existing">Existing Visit</SelectItem>
    </SelectContent>
  </Select>
</Field>
              {isEdit && visitHistory.length > 0 && (
                <div className="mb-4">
                  <Field label="Select Visit to Edit">
                    <Select
                      value={selectedVisitId ? String(selectedVisitId) : ""}
                      onValueChange={(v) => {
                        const val = v ? Number(v) : null;
                        setSelectedVisitId(val);

                        if (!val) {
                          setValue("visitDate", today);
                          setValue("symptoms", "");
                          setValue("notes", "");
                          setValue("doctorId", "");
                          setValue("department", "");
                          return;
                        }

                        const visit = visitHistory.find((x) => x.id === val);
                        if (!visit) return;

                        setValue("visitDate", visit.visit_date ?? today);
                        setValue("symptoms", visit.symptoms ?? "");
                        setValue("notes", visit.notes ?? "");
                        setValue("doctorId", String(visit.doctor_id ?? ""));
                        setValue("department", visit.department ?? "");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose visit to edit" />
                      </SelectTrigger>
                      <SelectContent>
                        {visitHistory.map((visit) => (
                          <SelectItem key={visit.id} value={String(visit.id)}>
                            {visit.visit_date} - {visit.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}
              {isEdit && billHistory.length > 0 && (
                <div className="mb-4">
                  <Field label="Select Bill to Edit">
                    <Select
                      value={selectedBillId ? String(selectedBillId) : ""}
                      onValueChange={(value) => {
  const billId = value ? Number(value) : null;
  setSelectedBillId(billId);

  if (!billId) {
    replace([
      {
        category: "Consultation fee",
        name: "OPD Consultation",
        code: "",
        qty: 1,
        amount: 0,
        discount: 0,
        remarks: "",
      },
    ]);
    setBillCategory("Consultation fee");
    setValue("amount1", 0);
    setValue("totalDiscountAmt", 0);
    setValue("totalDiscountPct", 0);
    setValue("payMode1", "CASH");
    setValue("remark", "");
  }
}}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose bill to edit" />
                      </SelectTrigger>
                      <SelectContent>
                        {billHistory.map((bill) => (
                          <SelectItem key={bill.id} value={String(bill.id)}>
                            Bill #{bill.id} - ₹{bill.net_amount ?? 0}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 mb-2">
              <BillTable
                rows={rowsOf()}
                billItems={items}
                // category={billCategory}
                labItems={labItems}
                radiologyItems={radiologyItems}
                serviceItems={serviceItems}
                medicineItems={medicineItems}
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
        </motion.div>
        {showBilling && (
          <>
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
                <div className="flex items-center gap-0 mt-7">
                  <div className="flex items-center">
                    <div className="flex h-10 w-9 items-center justify-center border border-r-0 bg-muted">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                    onKeyDown={preventNumberKeys}
                                    onWheel={(e) => e.currentTarget.blur()}
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0"
                      {...register("totalDiscountAmt")}
                      onChange={(event) => handleDiscountAmountChange(event.target.value)}
                      className="h-10 w-20 rounded-none"
                    />
                  </div>

                  <div className="flex items-center">
                    <div className="flex h-10 w-9 items-center justify-center border border-r-0 bg-muted">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                    onKeyDown={preventNumberKeys}
                                    onWheel={(e) => e.currentTarget.blur()}
                      type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      placeholder="0"
                      {...register("totalDiscountPct")}
                      onChange={(event) => handleDiscountPercentageChange(event.target.value)}
                      className="h-10 w-20 rounded-none"
                    />
                  </div>
                </div>
                {/* <Field label="Total Discount">
                  <Input
                    value={fmt(displayTotalDisc)}
                    readOnly
                    className="bg-muted/40 text-destructive font-medium"
                  />
                </Field> */}
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
                <Field label="Pay Mode">
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
                <Field label="Amount (Paid)">
                  <Input onKeyDown={preventNumberKeys}
                                    onWheel={(e) => e.currentTarget.blur()} type="number" step="0.01" min={0} {...register("amount1")} />
                </Field>

                <Field label="Total Due">
                  <Input value={fmt(displayDue)} readOnly className="bg-muted/40 font-medium" />
                </Field>
                <Field label="Offer By">
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
                <Field label="Discount Reason">
                  <Input placeholder="Discount Reason" {...register("remark")} />
                </Field>
              </div>

              <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
                <Button
                  type="submit"
                  onClick={() => setSubmitAction("save")}
                  className="bg-primary text-primary-foreground hover:opacity-90"
                >
                  <Save className="h-4 w-4 mr-1.5" /> Save
                </Button>

                <Button
                  type="submit"
                  onClick={() => setSubmitAction("print")}
                  className="bg-primary text-primary-foreground hover:opacity-90"
                >
                  <Printer className="h-4 w-4 mr-1.5" /> Save & Generate Bill
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
  billItems,
  // category,
  labItems,
  radiologyItems,
  serviceItems,
  medicineItems,
  register,
  setValue,
  control,
  remove,
  onAdd,
}: {
  rows: { idx: number }[];
  billItems: FormData["items"];
  // category: BillCategory;
  labItems: CatalogItem[];
  radiologyItems: CatalogItem[];
  serviceItems: CatalogItem[];
  medicineItems: CatalogItem[];
  register: UseFormRegister<FormData>;
  setValue: UseFormSetValue<FormData>;
  control: Control<FormData>;
  remove: (i: number) => void;
  onAdd: () => void;
}) {
  // const catalog =
  //   category === "Lab Test"
  //     ? labItems
  //     : category === "Radiology"
  //       ? radiologyItems
  //       : category === "Other"
  //         ? serviceItems
  //         : category === "Medicine"
  //           ? medicineItems
  //           : null;

  return (
    <div className="space-y-3 w-full">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs  tracking-wider text-muted-foreground">
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
            {rows.map(({ idx }) => {
  const rowCategory = billItems[idx]?.category;
  const catalog =
    rowCategory === "Lab Test"
      ? labItems
      : rowCategory === "Radiology"
        ? radiologyItems
        : rowCategory === "Other"
          ? serviceItems
          : rowCategory === "Medicine"
            ? medicineItems
            : null;

  return (
    <BillRow
      key={idx}
      idx={idx}
      catalog={catalog}
      register={register}
      setValue={setValue}
      control={control}
      remove={remove}
      onAdd={onAdd}
    />
  );
})}
          </tbody>
        </table>
      </div>
      {/* <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1.5" /> Add {category}
      </Button> */}
    </div>
  );
}

// function BillRow({
//   idx,
//   catalog,
//   register,
//   setValue,
//   control,
//   remove,
// }: {
//   idx: number;
//   catalog: { code: string; name: string; price: number }[] | null;
//   register: UseFormRegister<FormData>;
//   setValue: UseFormSetValue<FormData>;
//   control: Control<FormData>;
//   remove: (i: number) => void;
// }) {
//   return (
//     <tr className="border-t border-border">
//       <td className="px-2 py-1.5">
//         {catalog ? (
//           <Select
//             onValueChange={(v) => {
//               const it = catalog.find((x) => x.code === v);
//               if (it) {
//                 setValue(`items.${idx}.name`, it.name);
//                 setValue(`items.${idx}.code`, it.code);
//                 setValue(`items.${idx}.amount`, it.price ?? it.mrp ?? 0);
//               }
//             }}
//           >
//             <SelectTrigger className="h-9">
//               <SelectValue placeholder="Select test…" />
//             </SelectTrigger>
//             <SelectContent>
//               {catalog.map((c) => (
//                 <SelectItem key={c.code} value={c.code}>
//                   {c.name} — ₹{c.price}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         ) : (
//           <Input className="h-9" {...register(`items.${idx}.name`)} placeholder="Item name" />
//         )}
//       </td>
//       <td className="px-2 py-1.5">
//         <Input className="h-9" {...register(`items.${idx}.code`)} />
//       </td>
//       <td className="px-2 py-1.5">
//         <Input className="h-9" type="number" {...register(`items.${idx}.qty`)} />
//       </td>
//       <td className="px-2 py-1.5">
//         <Input className="h-9" type="number" {...register(`items.${idx}.amount`)} />
//       </td>
//       <td className="px-2 py-1.5">
//         <Input className="h-9" type="number" {...register(`items.${idx}.discount`)} />
//       </td>
//       <td className="px-2 py-1.5">
//         <NetCell idx={idx} control={control} />
//       </td>
//       <td className="px-2 py-1.5">
//         <Input className="h-9" {...register(`items.${idx}.remarks`)} placeholder="Remarks" />
//       </td>
//       <td className="px-2 py-1.5">
//         <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)}>
//           <Trash2 className="h-4 w-4 text-destructive" />
//         </Button>
//       </td>
//     </tr>
//   );
// }
function BillRow({
  idx,
  catalog,
  register,
  setValue,
  control,
  remove,
  onAdd,
}: {
  idx: number;
  catalog:
    | { id?: string | number; code?: string | null; name: string; price?: number; unit_price?: number }[]
    | null;
  register: UseFormRegister<FormData>;
  setValue: UseFormSetValue<FormData>;
  control: Control<FormData>;
  remove: (i: number) => void;
  onAdd: () => void;
}) {
  const currentName = useWatch({ control, name: `items.${idx}.name` }) as string | undefined;
  const currentCode = useWatch({ control, name: `items.${idx}.code` }) as string | undefined;

 const selectedValue = (() => {
  if (!catalog) return "";

  const code = currentCode?.trim();
  const name = currentName?.trim();

  const selected = catalog.find(
    (item) =>
      (code &&
        (String(item.id ?? "") === code || String(item.code ?? "") === code)) ||
      (name && item.name === name),
  );

  return selected
    ? String(selected.id || selected.code || selected.name)
    : "";
})();

const catalogValue = (item: {
  id?: string | number;
  code?: string | null;
  name: string;
}) => String(item.id || item.code || item.name);

const sortedCatalog = catalog
  ? [...catalog].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
        numeric: true,
      }),
    )
  : [];

   function formatExpiry(value?: string) {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(value ?? "");
  if (!match) return value ?? "—";

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const monthName = new Date(year, month, 1)
    .toLocaleString("en", { month: "short" })

  return `${monthName}-${match[1].slice(-2)}`;
}

const preventNumberKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
    }
  };
  return (
    <tr className="border-t border-border">
      <td className="px-2 py-1.5">
        {catalog ? (
          <Select
            value={selectedValue}
           onValueChange={(value) => {
  const item = catalog.find((entry) => catalogValue(entry) === value);
  if (!item) return;

  setValue(`items.${idx}.name`, item.name, { shouldDirty: true });
  setValue(`items.${idx}.code`, item.code || String(item.id || item.name), {
    shouldDirty: true,
  });
  setValue(`items.${idx}.amount`, Number(item.price ?? item.unit_price ?? 0), {
    shouldDirty: true,
  });
}}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select service…" />
            </SelectTrigger>
            <SelectContent>
              
             {sortedCatalog.map((item) => (
  <SelectItem key={catalogValue(item)} value={catalogValue(item)}>
    {item.name} {item?.expiry && <span className="text-xs text-muted-foreground">Exp: ({formatExpiry(item?.expiry)})</span>}
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
        <Input onKeyDown={preventNumberKeys}
                onWheel={(e) => e.currentTarget.blur()} className="h-9" type="number" {...register(`items.${idx}.qty`)} />
      </td>

      <td className="px-2 py-1.5">
        <Input
        onKeyDown={preventNumberKeys}
        onWheel={(e) => e.currentTarget.blur()}
        className="h-9" type="number" {...register(`items.${idx}.amount`)} />
      </td>

      <td className="px-2 py-1.5">
        <Input
        onKeyDown={preventNumberKeys}
                                    onWheel={(e) => e.currentTarget.blur()}
        className="h-9" type="number" {...register(`items.${idx}.discount`)} />
      </td>

      <td className="px-2 py-1.5">
        <NetCell idx={idx} control={control} />
      </td>

      <td className="px-2 py-1.5">
        <Input className="h-9" {...register(`items.${idx}.remarks`)} placeholder="Remarks" />
      </td>

      <td className="px-2 py-1.5">
  <div className="flex items-center">
    <Button
    className="bg-blue-200 text-primary"
      type="button"
      variant="ghost"
      size="icon"
      onClick={onAdd}
    >
      <Plus className="h-4 w-4" />
    </Button>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Remove item"
      title="Remove item"
      onClick={() => remove(idx)}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  </div>
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
      <div className="text-2xl font-bold  tracking-wider text-muted-foreground mb-3">
        {title}
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
      <Label className="text-[15px] text-muted-foreground">{label}</Label>
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
