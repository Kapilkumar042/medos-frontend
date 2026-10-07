import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import {
  Search,
  ReceiptText,
  UserRoundCheck,
  CalendarClock,
  BedDouble,
  Stethoscope,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Banknote,
  Printer,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";
import { CalendarDays, Filter, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { MessageCircle } from "lucide-react";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { inr } from "@/lib/format";
import { useCatalogStore } from "@/store/catalogStore";

import {
  getAdmissions,
  dischargePatient,
  createIPDBill,
  printIPDBill,
  addAdvancePayment,
  getPaymentHistory,
  getAdmission,
  updateAdmission,
  deleteAdmission,
  exportIPDPatients,
  updateIPDBill
  
} from "@/api/ipd-api";
import CreatableSelect from "react-select/creatable";
import { titleOptions } from "../opd/data";
import {
  PatientPaymentSummary,
  normalizePatientPaymentSummary,
  type PatientPaymentSummaryData,
} from "@/components/shared/PatientPaymentSummary";
import { dashboardApi } from "@/api/dashboardApi";

export const Route = createFileRoute("/_authenticated/ipd/patients")({
  component: IpdPatientsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
  }),
});

type AdmissionPatient = {
  id: number;
  patient_id: number;
  name: string;
  uhid: string;
  mobile: string;
  doctor: string;
  department: string;
  ward: string;
  room: string;
  admissionDate: string;
  status: "Admitted" | "Observation" | "Pending" | "Discharged";
  advancePayment: number;
  dueAmount: number;
  diagnosis: string;
  selectedServiceIds: string[];
  selected_services?: any[];
  billDate: string;
  gender: string;
  age: number;
  address: string;
  doctorId: number | null;
  bedNo: string;
  admissionDateValue: string;
  paymentModes: string[];
  billId: number | null;
};

const normalizeAdmission = (item: any): AdmissionPatient => {
  const backendBillDate = item.bill_date ?? item.billDate;
  const backendSelectedIds = Array.isArray(item.selected_services)
    ? item.selected_services.map((s: any) => String(s.service_id ?? s.service?.id ?? s.id))
    : Array.isArray(item.selected_service_ids)
      ? item.selected_service_ids.map((id: any) => String(id))
      : Array.isArray(item.selectedServiceIds)
        ? item.selectedServiceIds.map((id: any) => String(id))
        : [];
   const rawPaymentModes = item.payment_modes ?? item.payment_mode;
const paymentModes = [
  ...new Set(
    (Array.isArray(rawPaymentModes)
      ? rawPaymentModes
      : typeof rawPaymentModes === "string"
        ? rawPaymentModes.split(",")
        : []
    )
      .map((mode: unknown) => String(mode).trim().toUpperCase())
      .filter(Boolean),
  ),
];     

  return {
    id: Number(item.id),
    patient_id: Number(item.patient_id ?? item.patientId ?? 0),
    name: item.name ?? "",
    uhid: item.uhid ?? "",
    mobile: item.mobile ?? "",
    doctor: item.doctor_name ?? item.doctor?.first_name ?? "N/A",
    department: item.department ?? item.doctor?.specialization ?? "",
    ward: item.ward ?? "",
    room: item.room ?? "",
    admissionDate: item.admission_date ? new Date(item.admission_date).toLocaleDateString() : "",
    status:
      item.status === "Discharged"
        ? "Discharged"
        : item.status === "Admitted"
          ? "Admitted"
          : item.status === "Observation"
            ? "Observation"
            : "Pending",

    advancePayment: Number(item.advance_paid ?? item.advancePayment ?? 0),
    diagnosis: item.diagnosis ?? "",
    dueAmount: Number(item.due_amount ?? item.due ?? 0),
    selectedServiceIds: backendSelectedIds.map(String),
    selected_services: item.selected_services || [],
    billDate: backendBillDate ? String(backendBillDate).slice(0, 10) : "",
    gender: item.gender ?? "",
    age: Number(item.age ?? 0),
    address: item.address ?? "",
    doctorId: item.doctor_id ? Number(item.doctor_id) : null,
    bedNo: item.bed_no ?? "",
    admissionDateValue: item.admission_date
      ? new Date(item.admission_date).toISOString().slice(0, 16)
      : "",
    paymentModes,
    billId: item.bill_id ? Number(item.bill_id) : null,
      
  };
};

type ServiceItem = {
  id: string;
  name: string;
  category: string;
  fee: number;
  expiry?: string;
};

type ServiceCategory = "-" | "Advance" | "Lab Test" | "Radiology" | "Other" | "Medicine" | "Consultation";

type AdvancePayment = {
  id?: number;
  amount: number;
  payment_mode?: string;
  payment_type?: string;
  remarks?: string | null;
  created_at?: string;
};

type DatePreset = "today" | "yesterday" | "week" | "month" | "year" | "custom";

type StatusFilter = "all" | "Admitted" | "Observation" | "Pending" | "Discharged";

const wardOptions = ["General", "ICU", "Private", "Semi-Private", "Pediatric", "Maternity"];
const roomCategoryOptions = ["General", "Semi-Private", "Private", "ICU"];
const admissionTypeOptions = ["New", "Existing", "OPD"];
const admissionStatusOptions = ["Admitted", "Observation", "Pending", "Discharged"];

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateRange(preset: DatePreset): DateRange {
  const today = new Date();
  const from = new Date(today);
  const to = new Date(today);

  if (preset === "yesterday") {
    from.setDate(today.getDate() - 1);
    to.setDate(today.getDate() - 1);
  } else if (preset === "week") {
    const daysFromMonday = today.getDay() === 0 ? 6 : today.getDay() - 1;
    from.setDate(today.getDate() - daysFromMonday);
  } else if (preset === "month") {
    from.setDate(1);
  } else if (preset === "year") {
    from.setMonth(0, 1);
  }

  return { from, to };
}

  function formatDisplayDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}
function getDateFilterLabel(preset: DatePreset, range: DateRange) {
  const presetLabels: Record<Exclude<DatePreset, "custom">, string> = {
    today: "Today",
    yesterday: "Yesterday",
    week: "This Week",
    month: "This Month",
    year: "This Year",
  };

  if (preset !== "custom") return presetLabels[preset];

  if (!range.from) return "Custom Date Range";

  const from = formatDisplayDate(range.from);
  const to = range.to ? formatDisplayDate(range.to) : "";

  return to && to !== from ? `${from} → ${to}` : from;
}
export function IpdPatientsPage() {
  const navigate = useNavigate();
  const { edit: editAdmissionId } = Route.useSearch();
  const loadCatalog = useCatalogStore((state) => state.loadCatalog);
  const backendLabItems = useCatalogStore((state) => state.items.lab);
  const backendRadiologyItems = useCatalogStore((state) => state.items.radiology);
  const backendServices = useCatalogStore((state) => state.items.service);
  const backendMedicineItems = useCatalogStore((state) => state.items.medicine);
  const [patients, setPatients] = useState<AdmissionPatient[]>([]);
  const [query, setQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<AdmissionPatient | null>(null);
  const [editPatient, setEditPatient] = useState<AdmissionPatient | null>(null);
  const [editForm, setEditForm] = useState({
    patientId: "",
    uhid: "",
    opdNo: "",
    name: "",
    salutation: "Mr.",
    gender: "Male",
    dob: "",
    ageYears: "0",
    ageMonths: "0",
    ageDays: "0",
    mobile: "",
    address: "",
    city: "",
    emergencyContact: "",
    attendantName: "",
    doctorId: "",
    department: "",
    admissionDate: "",
    admissionTime: "",
    expectedDischargeDate: null as string | null,
    ward: "",
    roomCategory: "General",
    roomNumber: "",
    bedNumber: "",
    admissionType: "New",
    reason: "",
    diagnosis: "",
    notes: "",
    insurer: "",
    insurancePolicy: "",
    advancePayment: "0",
    packageName: "",
    referral: "",
    status: "Admitted",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [deletingAdmission, setDeletingAdmission] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<(string | number)[]>([]);
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>("-");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [paidAmount, setPaidAmount] = useState("0");
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advancePaymentMode, setAdvancePaymentMode] = useState("CASH");
  const [savingAdvance, setSavingAdvance] = useState(false);
  const [advancePayments, setAdvancePayments] = useState<AdvancePayment[]>([]);
  const [showAdvancePayments, setShowAdvancePayments] = useState(false);
  const [advanceDrawerOpen, setAdvanceDrawerOpen] = useState(false);
  const [advanceCandidates, setAdvanceCandidates] = useState<AdmissionPatient[]>([]);
  const [advanceSearch, setAdvanceSearch] = useState("");
  const [selectedAdvancePatient, setSelectedAdvancePatient] = useState<AdmissionPatient | null>(null);
  const [collectAmount, setCollectAmount] = useState("");
  const [collectPaymentMode, setCollectPaymentMode] = useState("CASH");
  const [loadingAdvanceCandidates, setLoadingAdvanceCandidates] = useState(false);
  const [collectingAdvance, setCollectingAdvance] = useState(false);
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));

  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRange("today"));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [duesOnly, setDuesOnly] = useState(false);
  const [paymentSummary, setPaymentSummary] =
  useState<PatientPaymentSummaryData | null>(null);


  const billingServices = useMemo<ServiceItem[]>(() => {
    const mapped = backendServices
      .filter((item) => item.status !== "Inactive")
      .map((item) => ({
        id: String(item.id ?? item.code ?? item.name),
        name: item.name,
        category: item.category ?? "Service",
        fee: Number(item.price ?? item.mrp ?? 0),
      }));

    return mapped.length
      ? mapped
      : [
          { id: "consultation", name: "Consultation", category: "Doctor", fee: 500 },
          { id: "room", name: "Room & Board", category: "Ward", fee: 1800 },
          { id: "lab", name: "Lab Investigation", category: "Diagnostics", fee: 1200 },
          { id: "radiology", name: "Radiology", category: "Diagnostics", fee: 1600 },
          { id: "pharmacy", name: "Medication", category: "Pharmacy", fee: 950 },
          { id: "nursing", name: "Nursing Care", category: "Care", fee: 700 },
        ];
  }, [backendServices]);

  useEffect(() => {
    void Promise.all([
      loadCatalog("lab"),
      loadCatalog("radiology"),
      loadCatalog("service"),
      loadCatalog("medicine"),
    ]).catch(() => toast.error("Failed to load service catalogs"));
  }, [loadCatalog]);

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;

    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(q) ||
        patient.uhid.toLowerCase().includes(q) ||
        patient.mobile.includes(q) ||
        patient.doctor.toLowerCase().includes(q),
    );
  }, [patients, query]);

  const searchableAdvancePatients = useMemo(() => {
    const search = advanceSearch.trim().toLowerCase();
    if (!search) return advanceCandidates;

    return advanceCandidates.filter((patient) =>
      [patient.name, patient.uhid, patient.mobile, patient.doctor, String(patient.id)]
        .some((value) => value.toLowerCase().includes(search)),
    );
  }, [advanceCandidates, advanceSearch]);

  const openBillingDialog = (patient: AdmissionPatient) => {
    setSelectedPatient(patient);
    // setSelectedServices((patient as any).selected_services || []);
    const savedServices = Array.isArray(patient.selected_services)
  ? patient.selected_services
  : [];

const normalizedServices = savedServices.map((saved: any) => {
  const qty = Math.max(1, Number(saved.qty ?? saved.quantity) || 1);
  const lineAmount = Number(saved.amount ?? saved.total_amount);
  const explicitRate = Number(saved.rate ?? saved.unit_price);
  const fee = Number(saved.fee ?? saved.price);

  const unitRate = Number.isFinite(explicitRate) && explicitRate > 0
    ? explicitRate
    : Number.isFinite(lineAmount) && lineAmount > 0
      ? lineAmount / qty
      : Number.isFinite(fee)
        ? fee
        : 0;

  return {
    ...saved,
    id: saved.id ?? saved.service_id ?? saved.service?.id,
    name: saved.name ?? saved.service?.name ?? "",
    category: saved.category ?? saved.service?.category ?? "Service",
    qty,
    fee: unitRate,
    rate: unitRate,
    amount: qty * unitRate,
  };
});

setSelectedServices(normalizedServices);
setSelectedServiceIds(normalizedServices.map((service) => String(service.id)));
    setAdvanceAmount("");
    setAdvancePaymentMode("CASH");
    setDiscountPercent("0");
    setPaidAmount("0");
    setPaymentMode("CASH");
    setBillDate(patient.billDate || new Date().toISOString().slice(0, 10));
  };



  const openEditDialog = async (patient: AdmissionPatient) => {
    setEditPatient(patient);
    setLoadingEdit(true);

    setEditForm({
      patientId: String(patient.patient_id ?? ""),
      uhid: patient.uhid,
      opdNo: "",
      name: patient.name,
      salutation: "Mr.",
      gender: patient.gender || "Male",
      dob: "",
      ageYears: String(patient.age ?? 0),
      ageMonths: "0",
      ageDays: "0",
      mobile: patient.mobile,
      address: patient.address,
      city: "",
      emergencyContact: "",
      attendantName: "",
      doctorId: patient.doctorId ? String(patient.doctorId) : "",
      department: patient.department,
      admissionDate: patient.admissionDateValue ? patient.admissionDateValue.slice(0, 10) : "",
      admissionTime: patient.admissionDateValue ? patient.admissionDateValue.slice(11, 16) : "",
      expectedDischargeDate: "",
      ward: patient.ward,
      roomCategory: "General",
      roomNumber: patient.room,
      bedNumber: patient.bedNo,
      admissionType: "New",
      reason: "",
      diagnosis: patient.diagnosis,
      notes: "",
      insurer: "",
      insurancePolicy: "",
      advancePayment: String(patient.advancePayment ?? 0),
      packageName: "",
      referral: "",
      status: patient.status,
    });

    try {
      const details = await getAdmission(patient.id);
      const admission = details?.data?.data ?? details?.data ?? details;
      if (!admission || Array.isArray(admission)) {
        throw new Error("Admission details were not returned");
      }
      const admissionDate = admission.admission_date ? new Date(admission.admission_date) : null;

      setEditForm({
        patientId: String(admission.patient_id ?? patient.patient_id ?? ""),
        uhid: admission.uhid ?? patient.uhid,
        opdNo: admission.opd_no ?? "",
        name: admission.name ?? patient.name,
        salutation: admission.salutation ?? "Mr.",
        gender: admission.gender ?? patient.gender ?? "Male",
        dob: admission.dob ? String(admission.dob).slice(0, 10) : "",
        ageYears: String(admission.age ?? patient.age ?? 0),
        ageMonths: String(admission.age_months ?? 0),
        ageDays: String(admission.age_days ?? 0),
        mobile: admission.mobile ?? patient.mobile,
        address: admission.address ?? patient.address,
        city: admission.city ?? "",
        emergencyContact: admission.emergency_contact ?? "",
        attendantName: admission.attendant_name ?? "",
        doctorId: admission.doctor_id ? String(admission.doctor_id) : "",
        department: admission.department ?? patient.department,
        admissionDate: admissionDate ? admissionDate.toISOString().slice(0, 10) : "",
        admissionTime: admissionDate ? admissionDate.toTimeString().slice(0, 5) : "",
        expectedDischargeDate: admission.expected_discharge_date
          ? String(admission.expected_discharge_date).slice(0, 10)
          : null,
          
        ward: admission.ward ?? patient.ward,
        roomCategory: admission.room_category ?? "General",
        roomNumber: admission.room ?? patient.room,
        bedNumber: admission.bed_no ?? patient.bedNo,
        admissionType: admission.admission_type ?? "New",
        reason: admission.reason ?? "",
        diagnosis: admission.diagnosis ?? patient.diagnosis,
        notes: admission.notes ?? "",
        insurer: admission.insurer ?? "",
        insurancePolicy: admission.insurance_policy ?? "",
        advancePayment: String(
          admission.advance_paid ?? admission.advancePayment ?? patient.advancePayment ?? 0,
        ),
        packageName: admission.package_name ?? "",
        referral: admission.referral ?? "",
        status: admission.status ?? patient.status,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load admission details. Showing available patient data.");
    } finally {
      setLoadingEdit(false);
    }
  };

  const openEditFromRoute = useEffectEvent((admissionId: string) => {
    const id = Number(admissionId);
    if (!Number.isInteger(id) || id <= 0) return;

    void openEditDialog(normalizeAdmission({ id }));
    void navigate({ to: "/ipd/patients", search: {}, replace: true });
  });

  useEffect(() => {
    if (editAdmissionId) openEditFromRoute(editAdmissionId);
  }, [editAdmissionId]);

  const handleEditAdmission = async () => {
    if (!editPatient) return;

    setSavingEdit(true);
    try {
      await updateAdmission(editPatient.id, {
        patient_id: editForm.patientId ? Number(editForm.patientId) : null,
        uhid: editForm.uhid,
        opd_no: editForm.opdNo,
        name: editForm.name,
        salutation: editForm.salutation,
        mobile: editForm.mobile,
        gender: editForm.gender,
        age: Number(editForm.ageYears) || 0,
        age_months: Number(editForm.ageMonths) || 0,
        age_days: Number(editForm.ageDays) || 0,
        dob: editForm.dob,
        address: editForm.address,
        city: editForm.city,
        emergency_contact: editForm.emergencyContact,
        attendant_name: editForm.attendantName,
        doctor_id: editForm.doctorId ? Number(editForm.doctorId) : null,
        department: editForm.department,
        ward: editForm.ward,
        room: editForm.roomNumber,
        bed_no: editForm.bedNumber,
        admission_date: `${editForm.admissionDate}T${editForm.admissionTime || "00:00"}:00`,
        expected_discharge_date: editForm.expectedDischargeDate || null,
        room_category: editForm.roomCategory,
        admission_type: editForm.admissionType,
        reason: editForm.reason,
        diagnosis: editForm.diagnosis,
        notes: editForm.notes,
        insurer: editForm.insurer,
        insurance_policy: editForm.insurancePolicy,
        advance_payment: Number(editForm.advancePayment) || 0,
        package_name: editForm.packageName,
        referral: editForm.referral,
        status: editForm.status,
      });
      toast.success("Admission updated successfully", { duration: 500 });
      await loadPatients();
      setEditPatient(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update admission");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteAdmission = async (patient: AdmissionPatient) => {
    if (!window.confirm(`Delete admission for ${patient.name}?`)) return;

    setDeletingAdmission(true);
    try {
      await deleteAdmission(patient.id);
      toast.success("Admission deleted successfully", { duration: 500 });
      if (selectedPatient?.id === patient.id) setSelectedPatient(null);
      if (editPatient?.id === patient.id) setEditPatient(null);
      await loadPatients();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete admission");
    } finally {
      setDeletingAdmission(false);
    }
  };

  const normalizeServiceQty = (value: number) => {
    const parsed = Number(value) || 1;
    return Math.max(1, Math.floor(parsed));
  };

  const handleAddAdvance = async () => {
    if (!selectedPatient || Number(advanceAmount) <= 0) {
      toast.error("Enter a valid advance amount");
      return;
    }

    setSavingAdvance(true);

    try {
      await addAdvancePayment(selectedPatient.id, {
        amount: Number(advanceAmount),
        payment_mode: advancePaymentMode,
      });

      toast.success("Advance payment saved", {
        duration: 500,
      });

      await loadPatients();

      const refreshedPatients = await loadPatients();
      const refreshedPatient = refreshedPatients
        .map(normalizeAdmission)
        .find((patient: any) => patient.id === selectedPatient.id);

      if (refreshedPatient) {
        setSelectedPatient(refreshedPatient);
      }

      await loadPayments(selectedPatient.id);
      setAdvanceAmount("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save advance payment", {
        duration: 500,
      });
    } finally {
      setSavingAdvance(false);
    }
  };

  const updateServiceField = (id: string | number, field: "qty" | "fee", value: string) => {
    setSelectedServices((current) =>
      current.map((service) => {
        if (String(service.id) !== String(id)) {
          return service;
        }

        const updated = {
          ...service,
          [field]: value,
        };

        const qty = field === "qty" ? Number(value || 0) : Number(updated.qty || 0);

        const fee = field === "fee" ? Number(value || 0) : Number(updated.fee || 0);

        return {
          ...updated,
          amount: qty * fee,
        };
      }),
    );
  };

  const normalizeServiceField = (id: string | number, field: "qty" | "fee") => {
    setSelectedServices((current) =>
      current.map((service) => {
        if (String(service.id) !== String(id)) {
          return service;
        }

        const qty =
          field === "qty"
            ? Math.max(1, Number(service.qty) || 1)
            : Math.max(1, Number(service.qty) || 1);

        const fee =
          field === "fee"
            ? Math.max(0, Number(service.fee) || 0)
            : Math.max(0, Number(service.fee) || 0);

        return {
          ...service,
          qty,
          fee,
          amount: qty * fee,
        };
      }),
    );
  };

  const subtotal = selectedServices.reduce((sum, service) => {
    const fee = Number(service.fee ?? service.rate ?? 0);
    const qty = Number(service.qty) || 1;
    return sum + fee * qty;
  }, 0);
  const discountValue = subtotal * ((Number(discountPercent) || 0) / 100);
  const netTotal = subtotal - discountValue;

  const dueAmount = selectedPatient?.dueAmount ?? 0;

  const balanceDue = Math.max(dueAmount - (Number(paidAmount) || 0), 0);

  const removeService = (id: string | number) => {
    setSelectedServiceIds((current) =>
      current.filter((serviceId) => String(serviceId) !== String(id)),
    );

    setSelectedServices((current) =>
      current.filter((service) => String(service.id) !== String(id)),
    );
  };

  const loadPayments = async (admissionId: number) => {
    try {
      const data = await getPaymentHistory(admissionId);
      const payments = Array.isArray(data) ? data : [];
      setAdvancePayments(payments);
      return payments;
    } catch (error) {
      console.error("Failed to load payment history", error);
      setAdvancePayments([]);
      toast.error("Failed to load payment history", { duration: 500 });
      return [];
    }
  };

  useEffect(() => {
    if (selectedPatient) {
      setShowAdvancePayments(false);
      void loadPayments(selectedPatient.id);
    }
  }, [selectedPatient]);

  const loadPatients = async () => {
    try {
      const data = await getAdmissions({
        start_date: dateRange.from ? formatDate(dateRange.from) : undefined,
        end_date: dateRange.to
          ? formatDate(dateRange.to)
          : dateRange.from
            ? formatDate(dateRange.from)
            : undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        dues_only: duesOnly || undefined,
      });

      const normalized = Array.isArray(data)
        ? data.filter((item) => item.status !== "Deleted").map(normalizeAdmission)
        : [];

      setPatients(normalized);
      return normalized;
    } catch {
      toast.error("Failed to load patients", { duration: 500 });
      return [];
    }
  };

  useEffect(() => {
    void loadPatients();
  }, [dateRange, statusFilter, duesOnly]);

  // useEffect(() => {
  //   loadPatients();
  // }, []);

  useEffect(() => {
    if (
      selectedPatient &&
      selectedPatient.selectedServiceIds?.length > 0 &&
      billingServices.length > 0
    ) {
      setSelectedServiceIds(selectedPatient.selectedServiceIds.map(String));
    }
  }, [selectedPatient, billingServices]);

  useEffect(() => {
    console.log("billingServices", billingServices);
    console.log("selectedServiceIds", selectedServiceIds);
    console.log("selectedServices", selectedServices);
  }, [billingServices, selectedServiceIds, selectedServices]);

  

useEffect(() => {
  let active = true;

  const startDate = dateRange.from ? formatDate(dateRange.from) : undefined;
  const endDate = dateRange.to
    ? formatDate(dateRange.to)
    : dateRange.from
      ? formatDate(dateRange.from)
      : undefined;

  setPaymentSummary(null);

  void dashboardApi
    .getIpd({
      period: "custom",
      start_date: startDate,
      end_date: endDate,
    })
    .then((response) => {
      if (active) setPaymentSummary(normalizePatientPaymentSummary(response));
    })
    .catch(() => {
      if (active) toast.error("Failed to load IPD payment summary");
    });

  return () => {
    active = false;
  };
}, [dateRange]);

const saveIPDBill = (data: any) => {
  if (selectedPatient?.billId) {
    return updateIPDBill(selectedPatient.billId, data);
  }

  return createIPDBill(data);
};

  const handleCreateBill = async () => {
    if (!selectedPatient) return;

    try {
      const items = selectedServices.map((service) => {
        const qty = Math.max(1, Number(service.qty) || 1);
        const rate = Number(service.fee ?? service.rate ?? 0);

        return {
          category: service.category,
          name: service.name,
          qty,
          rate,
          amount: qty * rate,
          discount: 0,
          remarks: "",
        };
      });

      await saveIPDBill({
        admission_id: selectedPatient.id,
        patient_id: selectedPatient.patient_id,
        total_amount: subtotal,
        discount_amount: discountValue,
        net_amount: netTotal,
        paid_amount: Number(paidAmount) || 0,
        due_amount: balanceDue,
        payment_mode: paymentMode,
        remark: "",
        items,
        bill_date: `${billDate}T00:00:00`,
      });

      toast.success("Bill saved successfully", {
        duration: 500,
      });

      // optional
      loadPatients();

      // close dialog
      setSelectedPatient(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save bill", { duration: 500 });
    }
  };
  const handleDischarge = async () => {
    if (!selectedPatient) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print the bill", { duration: 500 });
      return;
    }

    try {
      const items = selectedServices.map((service) => {
        const qty = Math.max(1, Number(service.qty) || 1);
        const rate = Number(service.fee ?? service.rate ?? 0);

        return {
          category: service.category,
          name: service.name,
          qty,
          rate,
          amount: rate * qty,
          discount: 0,
          remarks: "",
        };
      });

      const bill = await saveIPDBill({
        admission_id: selectedPatient.id,
        patient_id: selectedPatient.patient_id,
        total_amount: subtotal,
        discount_amount: discountValue,
        net_amount: netTotal,
        paid_amount: Number(paidAmount) || 0,
        due_amount: balanceDue,
        payment_mode: paymentMode,
        remark: "",
        items,
        bill_date: `${billDate}T00:00:00`,
      });

      await dischargePatient(selectedPatient.id);
      toast.success("Patient discharged successfully", {
        duration: 500,
      });
      await printIPDBill(bill.id, printWindow);

      loadPatients();
      setSelectedPatient(null);
    } catch (error) {
      printWindow.close();
      toast.error("Discharge failed", { duration: 500 });
    }
  };
const handlePayDue = async () => {
  if (!selectedPatient || Number(paidAmount) <= 0) {
    toast.error("Enter a valid payment amount");
    return;
  }

  try {
    await addAdvancePayment(selectedPatient.id, {
      amount: Number(paidAmount) || 0,
      payment_mode: paymentMode,
    });

    toast.success("Payment recorded");
    await loadPatients();
    setSelectedPatient(null);
  } catch (error) {
    console.error(error);
    toast.error("Failed to record payment");
  }
};
  const quickDischarge = async (patient: AdmissionPatient) => {
    try {
      await dischargePatient(patient.id);

      toast.success("Patient discharged", {
        duration: 500,
      });

      loadPatients();
    } catch {
      toast.error("Discharge failed");
    }
  };

  const statusClasses: Record<AdmissionPatient["status"], string> = {
    Admitted: "border-success text-success",
    Observation: "border-info text-info",
    Pending: "border-warning text-warning",
    Discharged: "border-muted text-muted-foreground",
  };
  const preventNumberKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
    }
  };
  const catalogServices: ServiceItem[] =
    serviceCategory === "-"
      ? [
          ...backendLabItems.map((item) => ({
            id: `lab-${String(item.id ?? item.code ?? item.name)}`,
            name: item.name,
            category: "Lab Test",
            fee: Number(item.price ?? item.unitPrice ?? item.mrp ?? 0),
          })),
          ...backendRadiologyItems.map((item) => ({
            id: `radiology-${String(item.id ?? item.code ?? item.name)}`,
            name: item.name,
            category: "Radiology",
            fee: Number(item.price ?? item.unitPrice ?? item.mrp ?? 0),
          })),
          ...backendMedicineItems.map((item) => ({
            id: `medicine-${String(item.id ?? item.code ?? item.name)}`,
            name: item.name,
            category: "Medicine",
            fee: Number(item.unitPrice ?? item.mrp ?? item.price ?? 0),
            expiry: item.expiry,
          })),
          ...backendServices
            .filter((item) => item.status !== "Inactive")
            .map((item) => ({
              id: `service-${String(item.id ?? item.code ?? item.name)}`,
              name: item.name,
              category: item.category ?? "Other",
              fee: Number(item.price ?? item.unitPrice ?? item.mrp ?? 0),
            })),
          ...(backendServices.some((item) => item.status !== "Inactive") ? [] : billingServices),
        ]
      : serviceCategory === "Lab Test"
      ? backendLabItems.map((item) => ({
          id: String(item.id ?? item.code ?? item.name),
          name: item.name,
          category: "Lab Test",
          fee: Number(item.price ?? item.unitPrice ?? item.mrp ?? 0),
        }))
      : serviceCategory === "Radiology"
        ? backendRadiologyItems.map((item) => ({
            id: String(item.id ?? item.code ?? item.name),
            name: item.name,
            category: "Radiology",
            fee: Number(item.price ?? item.unitPrice ?? item.mrp ?? 0),
          }))
        : serviceCategory === "Medicine"
          ? backendMedicineItems.map((item) => ({
              id: String(item.id ?? item.code ?? item.name),
              name: item.name,
              category: "Medicine",
              fee: Number(item.unitPrice ?? item.mrp ?? item.price ?? 0),
              expiry: item.expiry,
            }))
          : serviceCategory === "Consultation"
            ? billingServices.filter((service) =>
                /consult|doctor/i.test(`${service.category} ${service.name}`),
              )
            : serviceCategory === "Other"
              ? billingServices
              : [];

  const fallbackServices = billingServices.filter((service) => {
    if (serviceCategory === "Lab Test") return /lab/i.test(`${service.category} ${service.name}`);
    if (serviceCategory === "Radiology") return /radiology/i.test(`${service.category} ${service.name}`);
    if (serviceCategory === "Medicine") return /pharmacy|medicine|medication/i.test(`${service.category} ${service.name}`);
    if (serviceCategory === "Consultation") return /consult|doctor/i.test(`${service.category} ${service.name}`);
    return false;
  });

  const servicesForCategory = catalogServices.length ? catalogServices : fallbackServices;
  const serviceOptions = servicesForCategory
    .filter((service) => !selectedServiceIds.some((id) => String(id) === String(service.id)))
    .map((service) => ({
      value: service.id,
      label: service.name,
      service,
    }));

  const updateEditField = (field: keyof typeof editForm, value: string) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const syncEditAgeFromDob = (dobValue: string) => {
    updateEditField("dob", dobValue);
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

    setEditForm((current) => ({
      ...current,
      dob: dobValue,
      ageYears: String(Math.max(0, years)),
      ageMonths: String(Math.max(0, months)),
      ageDays: String(Math.max(0, days)),
    }));
  };

  const syncEditDobFromAge = (field: "ageYears" | "ageMonths" | "ageDays", value: string) => {
    const nextForm = { ...editForm, [field]: value };
    const years = Number(nextForm.ageYears) || 0;
    const months = Number(nextForm.ageMonths) || 0;
    const days = Number(nextForm.ageDays) || 0;
    const today = new Date();
    const dob = new Date(
      today.getFullYear() - years,
      today.getMonth() - months,
      today.getDate() - days,
    );

    setEditForm({
      ...nextForm,
      dob: dob.toISOString().slice(0, 10),
    });
  };

  function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

  const handleExport = async (fileFormat: "xlsx" | "pdf") => {
  const from = dateRange.from;
  const to = dateRange.to ?? dateRange.from;

  if (!from || !to) {
    toast.error("Select a date range first");
    return;
  }

  try {
    const blob = await exportIPDPatients({
      start_date: formatDate(from),
      end_date: formatDate(to),
      status: statusFilter === "all" ? undefined : statusFilter,
      dues_only: duesOnly || undefined,
      file_format: fileFormat,
    });

    downloadBlob(blob, `ipd-patients-${formatDate(from)}-to-${formatDate(to)}.${fileFormat}`);
  } catch (error) {
    console.error(error);
    toast.error("Failed to export IPD patients");
  }
};

  const openAdvanceDrawer = async () => {
    setAdvanceDrawerOpen(true);
    setAdvanceSearch("");
    setSelectedAdvancePatient(null);
    setCollectAmount("");
    setLoadingAdvanceCandidates(true);

    try {
      const data = await getAdmissions();
      const normalized = Array.isArray(data)
        ? data.filter((item) => item.status !== "Deleted").map(normalizeAdmission)
        : [];
      setAdvanceCandidates(normalized);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load admissions");
      setAdvanceCandidates([]);
    } finally {
      setLoadingAdvanceCandidates(false);
    }
  };

  const handleCollectAdvance = async () => {
    if (!selectedAdvancePatient) return;
    const amount = Number(collectAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid advance amount");
      return;
    }

    setCollectingAdvance(true);
    try {
      await addAdvancePayment(selectedAdvancePatient.id, {
        amount,
        payment_mode: collectPaymentMode,
      });

      const updatedAdvance = selectedAdvancePatient.advancePayment + amount;
      const updatedPatient = { ...selectedAdvancePatient, advancePayment: updatedAdvance };
      setSelectedAdvancePatient(updatedPatient);
      setAdvanceCandidates((current) =>
        current.map((patient) => patient.id === updatedPatient.id ? updatedPatient : patient),
      );
      setCollectAmount("");
      await loadPatients();
      toast.success("Advance payment collected");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.detail || "Failed to collect advance payment");
    } finally {
      setCollectingAdvance(false);
    }
  };

    const handlePrintBill = async (patient: AdmissionPatient) => {
      if (!patient.billId) {
        toast.error("No bill found for this admission");
        return;
      }

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Please allow pop-ups to print the bill");
        return;
      }

      await printIPDBill(patient.billId, printWindow);
    };

  return (
    <>
      <PageHeader
        title="IPD Patients"
        description="Inpatient list with quick billing and discharge workflow."
      >
        <Button variant="outline" onClick={() => handleExport("xlsx")}>
  <Download className="mr-1.5 h-4 w-4" />
  Export Excel
</Button>

<Button variant="outline" onClick={() => handleExport("pdf")}>
  <Download className="mr-1.5 h-4 w-4" />
  Export PDF
</Button>
        <Button type="button" variant="outline" onClick={() => void openAdvanceDrawer()}>
          <Banknote className="mr-1.5 h-4 w-4" />
          Collect Advance
        </Button>
        <Button size="sm" asChild className="bg-primary text-primary-foreground hover:opacity-90">
          <Link to="/ipd/admission">
            <Plus className="h-4 w-4 mr-1.5" /> New Admission
          </Link>
        </Button>
      </PageHeader>

      <Drawer
        direction="right"
        open={advanceDrawerOpen}
        onOpenChange={setAdvanceDrawerOpen}
      >
        <DrawerContent className="inset-y-0 right-0 left-auto bottom-auto mt-0 h-full w-105 max-w-[90vw] rounded-none border-l">
          <DrawerHeader>
            <DrawerTitle>Collect advance payment</DrawerTitle>
            <DrawerDescription>Search for an admitted patient and record a payment.</DrawerDescription>
          </DrawerHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={advanceSearch}
                onChange={(event) => {
                  setAdvanceSearch(event.target.value);
                  setSelectedAdvancePatient(null);
                }}
                placeholder="Search name, UHID, mobile, or ID"
                className="pl-9"
              />
            </div>

            {advanceSearch.trim() && (
              <div className="max-h-64 divide-y overflow-y-auto rounded-md border">
                {loadingAdvanceCandidates ? (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    Loading admissions...
                  </p>
                ) : searchableAdvancePatients.length ? (
                  searchableAdvancePatients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => setSelectedAdvancePatient(patient)}
                      className={`block w-full px-3 py-3 text-left hover:bg-muted/50 ${selectedAdvancePatient?.id === patient.id ? "bg-muted" : ""}`}
                    >
                      <span className="block text-sm font-medium">{patient.name}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {[patient.uhid, patient.mobile, `Admission #${patient.id}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No matching admissions
                  </p>
                )}
              </div>
            )}

            <section className="space-y-4 border-t pt-4">
              {selectedAdvancePatient ? (
                <div>
                  <p className="text-xs text-muted-foreground">Selected patient</p>
                  <p className="mt-1 font-medium">{selectedAdvancePatient.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAdvancePatient.uhid || `Admission #${selectedAdvancePatient.id}`}
                  </p>
                  <p className="mt-2 text-sm">
                    Current advance: {inr(selectedAdvancePatient.advancePayment)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a patient to continue.</p>
              )}

              <label className="block space-y-1 text-sm">
                <span className="text-muted-foreground">Amount</span>
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={collectAmount}
                  onChange={(event) => setCollectAmount(event.target.value)}
                  placeholder="Enter amount"
                  disabled={!selectedAdvancePatient}
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span className="text-muted-foreground">Payment mode</span>
                <Select
                  value={collectPaymentMode}
                  onValueChange={setCollectPaymentMode}
                  disabled={!selectedAdvancePatient}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["CASH", "CARD", "UPI", "CHEQUE", "INSURANCE"].map((mode) => (
                      <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </section>
          </div>

          <DrawerFooter>
            <Button
              type="button"
              onClick={() => void handleCollectAdvance()}
              disabled={!selectedAdvancePatient || Number(collectAmount) <= 0 || collectingAdvance}
            >
              {collectingAdvance ? "Saving..." : "Collect advance"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <div className="rounded-2xl bg-card border border-border shadow-soft">
        <div className="p-4 flex items-center gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div className="relative w-96 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, UHID, mobile..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="min-w-[330px] justify-between">
                     <span>
  {dateRange.from
    ? `${formatDisplayDate(dateRange.from)} → ${formatDisplayDate(
        dateRange.to ?? dateRange.from,
      )}`
    : "Select date range"}
</span>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    numberOfMonths={2}
                    onSelect={(range) => {
                      if (!range?.from) return;

                      setDatePreset("custom");
                      setDateRange(range);
                    }}
                  />
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                   <span>{getDateFilterLabel(datePreset, dateRange)}</span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  {[
                    ["today", "Today"],
                    ["yesterday", "Yesterday"],
                    ["week", "This Week"],
                    ["month", "This Month"],
                    ["year", "This Year"],
                  ].map(([value, label]) => (
                    <DropdownMenuItem
                      key={value}
                      onClick={() => {
                        const preset = value as DatePreset;
                        setDatePreset(preset);
                        setDateRange(getDateRange(preset));
                      }}
                    >
                      {label}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel>Status</DropdownMenuLabel>

                  {(["all", "Admitted", "Observation", "Pending", "Discharged"] as const).map(
                    (status) => (
                      <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)}>
                        {status === "all" ? "All statuses" : status}
                        {statusFilter === status ? " ✓" : ""}
                      </DropdownMenuItem>
                    ),
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => setDuesOnly((value) => !value)}>
                    {duesOnly ? "✓ " : ""}
                    Patients with dues
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {filteredPatients.length} of {patients.length} patients
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-medium">UHID</th>
                <th className="text-left px-4 py-2 font-medium">Patient</th>
                <th className="text-left px-4 py-2 font-medium">Doctor / Ward</th>
                <th className="text-left px-4 py-2 font-medium">Admission</th>
                <th className="text-left px-4 py-2 font-medium">Advance</th>
                <th className="text-left px-4 py-2 font-medium">Payment Modes</th>
                <th className="text-left px-4 py-2 font-medium">Due</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-right px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-muted-foreground">
                    No IPD patients found.
                  </td>
                </tr>
              )}

              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2 font-mono text-xs">{patient.uhid}</td>

                  <td className="px-4 py-2">
                    <div className="font-medium text-foreground">{patient.name}</div>
                    <div className="text-xs text-muted-foreground">{patient.mobile}</div>
                  </td>

                  <td className="px-4 py-2">
                    <div className="text-xs font-medium">{patient.doctor}</div>
                    <div className="text-xs text-muted-foreground">
                      {patient.department} • {patient.ward}
                    </div>
                  </td>

                  <td className="px-4 py-2">
                    <div className="text-xs font-medium">{patient.admissionDate}</div>
                    <div className="text-xs text-muted-foreground">{patient.room}</div>
                  </td>

                  <td className="px-4 py-2">
                    <div className="font-medium">{inr(patient.advancePayment)}</div>
                    <div className="text-xs text-muted-foreground">Paid</div>
                  </td>

                  <td className="px-4 py-2 text-xs">
  {patient.paymentModes.length === 0 ? (
    <span className="text-muted-foreground">—</span>
  ) : patient.paymentModes.length > 3 ? (
    <span>
      {patient.paymentModes[0]}
      <span className="ml-1 text-muted-foreground">
        +{patient.paymentModes.length - 1} more
      </span>
    </span>
  ) : (
    patient.paymentModes.join(", ")
  )}
</td>

                  

                  <td className="px-4 py-2">
                    <div className="text-xs font-medium">
                      {inr(patient.dueAmount > 0 ? patient.dueAmount : 0)}
                    </div>
                  </td>

                  <td className="px-4 py-2">
                    <Badge variant="outline" className={statusClasses[patient.status]}>
                      {patient.status}
                    </Badge>
                  </td>

                  <td className="px-4 py-2">
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openBillingDialog(patient)}>
                            <ReceiptText className="mr-1.5 h-3.5 w-3.5" />
                            Billing
                          </DropdownMenuItem>

                          {patient.billId && (
                            <DropdownMenuItem onClick={() => void handlePrintBill(patient)}>
                              <Printer className="mr-2 h-4 w-4" />
                              Print Bill
                            </DropdownMenuItem>
                          )}

                          {/* {bill && (
                                                  <DropdownMenuItem onClick={() => sendBillOnWhatsApp(p, bill)}>
                                                    <MessageCircle className="h-4 w-4 mr-2" />
                                                    WhatsApp Bill
                                                  </DropdownMenuItem>
                                                )} */}

                          <DropdownMenuItem onClick={() => openEditDialog(patient)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => void handleDeleteAdmission(patient)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => quickDischarge(patient)}
                          >
                            <UserRoundCheck className="mr-1.5 h-3.5 w-3.5" />
                            Discharge
                          </DropdownMenuItem>
                          
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PatientPaymentSummary title="Total Sale" summary={paymentSummary} />
      </div>

      <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedPatient && (
            <>
              <DialogHeader>
                <DialogTitle>Billing & Discharge</DialogTitle>
                <DialogDescription>
                  Review patient details, choose services, apply discount, and complete the
                  discharge.
                </DialogDescription>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Patient</div>
                      <div className="text-lg font-semibold">{selectedPatient.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Due Amount</div>
                      <div className="text-lg font-semibold">
                        {selectedPatient.dueAmount > 0 ? inr(selectedPatient.dueAmount) : inr(0)}
                      </div>
                    </div>
                    <Badge variant="outline" className={statusClasses[selectedPatient.status]}>
                      {selectedPatient.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block">UHID</span>
                      <span className="font-medium">{selectedPatient.uhid}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Mobile</span>
                      <span className="font-medium">{selectedPatient.mobile}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Doctor</span>
                      <span className="font-medium">{selectedPatient.doctor}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Ward</span>
                      <span className="font-medium">{selectedPatient.ward}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-muted-foreground block">Diagnosis</span>
                      <span className="font-medium">{selectedPatient.diagnosis}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <BedDouble className="h-4 w-4 text-primary" />
                    Billing Summary
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Advance payment</span>
                      <span>{inr(selectedPatient.advancePayment)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Room</span>
                      <span>{selectedPatient.room}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Admission</span>
                      <span>{selectedPatient.admissionDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-border p-4 space-y-3">
                  <div className="text-sm font-medium">Add Advance Payment</div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Amount"
                      value={advanceAmount}
                      onChange={(event) => setAdvanceAmount(event.target.value)}
                    />

                    <Select value={advancePaymentMode} onValueChange={setAdvancePaymentMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Payment mode" />
                      </SelectTrigger>

                      <SelectContent>
                        {["CASH", "CARD", "UPI", "CHEQUE", "INSURANCE"].map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      onClick={handleAddAdvance}
                      disabled={savingAdvance || Number(advanceAmount) <= 0}
                    >
                      {savingAdvance ? "Saving..." : "Add Advance"}
                    </Button>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total advance paid</span>
                    <span className="font-semibold">{inr(selectedPatient.advancePayment)}</span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => setShowAdvancePayments((current) => !current)}
                  >
                    <span>
                      {showAdvancePayments ? "Hide advance payments" : "View all advance payments"}
                    </span>
                    {showAdvancePayments ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

                  {showAdvancePayments && (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/40 text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2 font-medium">Date</th>
                            <th className="px-3 py-2 font-medium">Type</th>
                            <th className="px-3 py-2 font-medium">Mode</th>
                            <th className="px-3 py-2 text-right font-medium">Amount</th>
                            <th className="px-3 py-2 font-medium">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {advancePayments.length > 0 ? (
                            advancePayments.map((payment, index) => (
                              <tr key={payment.id ?? `${payment.created_at}-${index}`}>
                                <td className="whitespace-nowrap px-3 py-2">
                                  {payment.created_at
                                    ? new Date(payment.created_at).toLocaleDateString()
                                    : "-"}
                                </td>
                                <td className="px-3 py-2">{payment.payment_type ?? "Advance"}</td>
                                <td className="px-3 py-2">{payment.payment_mode ?? "-"}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-right font-medium">
                                  {inr(Number(payment.amount) || 0)}
                                </td>
                                <td className="max-w-45 truncate px-3 py-2">
                                  {payment.remarks ?? "-"}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-3 py-4 text-center text-muted-foreground"
                              >
                                No advance payments found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    Select Services
                  </div>

                  <div className="rounded-xl grid gap-3 p-4 md:grid-cols-2">
                    <label className="mb-2 block space-y-1 text-sm">
                      <span className="text-muted-foreground">Service category</span>
                      <Select
                        value={serviceCategory}
                        onValueChange={(value) => setServiceCategory(value as ServiceCategory)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All services" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">All services</SelectItem>
                          <SelectItem value="Lab Test">Lab Test</SelectItem>
                          <SelectItem value="Radiology">Radiology</SelectItem>
                          <SelectItem value="Medicine">Medicine</SelectItem>
                          <SelectItem value="Consultation">Consultation</SelectItem>
                          <SelectItem value="Other">Other services</SelectItem>
                        </SelectContent>
                      </Select>
                    </label>
                    <div>
                    <label className=" block space-y-1 text-sm" htmlFor="">Services</label>
                    <CreatableSelect
                    styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: 32,
                          height: 32,
                          borderColor: state.isFocused ? "var(--ring)" : "var(--input)",
                          borderRadius: "0.375rem",
                          backgroundColor: "var(--background)",
                          boxShadow: state.isFocused ? "0 0 0 1px var(--ring)" : "none",
                          "&:hover": { borderColor: "var(--ring)" },
                        }),
                      }}
                      isClearable
                      placeholder="Search or create service..."
                      noOptionsMessage={() => "No services available in this category"}
                      options={serviceOptions}
                      value={null}
                      onChange={(option: any) => {
                        if (!option) return;

                        const service = option.service;

                        if (service) {
                          setSelectedServiceIds((current) => [...current, service.id]);

                          setSelectedServices((current) => [
                            ...current,
                            {
                              id: service.id,
                              name: service.name,
                              category: service.category,
                              fee: service.fee,
                              qty: 1,
                              rate: service.fee,
                              amount: service.fee,
                            },
                          ]);
                        }
                      }}
                      onCreateOption={(inputValue) => {
                        const customId = `custom-${Date.now()}`;

                        setSelectedServiceIds((current) => [...current, customId]);

                        setSelectedServices((current) => [
                          ...current,
                          {
                            id: customId,
                            name: inputValue,
                            category: "Custom",
                            fee: 0,
                            qty: 1,
                            rate: 0,
                            amount: 0,
                          },
                        ]);
                      }}
                    />
                    </div>
                  </div>

                  {selectedServices.length > 0 ? (
                    <div className="rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium">Service</th>
                            <th className="text-left px-3 py-2 font-medium">Category</th>
                            <th className="text-right px-3 py-2 font-medium">Qty</th>
                            <th className="text-right px-3 py-2 font-medium">Rate</th>
                            <th className="text-right px-3 py-2 font-medium">Amount</th>
                            <th className="text-right px-3 py-2 font-medium">Action</th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedServices.map((service) => {
                            const qty = Number(service.qty) || 1;
                            const lineTotal = Number(service.fee ?? service.rate ?? 0) * qty;

                            return (
                              <tr key={service.id} className="border-t border-border">
                                <td className="px-3 py-2">{service.name}</td>
                                <td className="px-3 py-2 text-muted-foreground">
                                  {service.category}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <Input
                                    type="number"                                    
                                    min={1}
                                    className="w-20 ml-auto"
                                    value={service.qty ?? ""}
                                    onChange={(event) =>
                                      updateServiceField(service.id, "qty", event.target.value)
                                    }
                                    onBlur={() => normalizeServiceField(service.id, "qty")}
                                  />
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    className="w-28 ml-auto"
                                    value={service.fee ?? ""}
                                    onChange={(event) =>
                                      updateServiceField(service.id, "fee", event.target.value)
                                    }
                                    onBlur={() => normalizeServiceField(service.id, "fee")}
                                  />
                                </td>

                                <td className="px-3 py-2 text-right font-medium">
                                  {inr((Number(service.qty) || 0) * (Number(service.fee) || 0))}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() => removeService(service.id)}
                                  >
                                    Remove
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No service selected
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border p-3">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
                      Discount (%)
                    </label>
                    <Input
                      type="number"
                      onKeyDown={preventNumberKeys}
                      onWheel={(e) => e.currentTarget.blur()}
                      // min={0}
                      max={100}
                      value={discountPercent}
                      onChange={(event) => setDiscountPercent(event.target.value)}
                    />
                  </div>

                  <div className="rounded-xl border border-border p-3">
                    <div className="rounded-xl border border-border p-3">
                      <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
                        Bill Date
                      </label>

                      <Input
                        type="date"
                        value={billDate}
                        onChange={(event) => setBillDate(event.target.value)}
                      />
                    </div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
                      Paid Amount
                    </label>
                    <div className="flex gap-2">
                      <Input
                      
                        type="number"
                        onKeyDown={preventNumberKeys}
                        onWheel={(e) => e.currentTarget.blur()}
                        // min={0}
                        // step="0.01"
                        value={paidAmount}
                        onChange={(event) => setPaidAmount(event.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPaidAmount(String(dueAmount))}
                      >
                        Clear Due
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-3">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
                      Payment Mode
                    </label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {["CASH", "CARD", "UPI", "CHEQUE", "INSURANCE"].map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-xl border border-border p-3 bg-muted/20">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Net Amount
                    </div>
                    <div className="text-2xl font-semibold mt-2">{inr(netTotal)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{inr(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span>-{inr(discountValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid against advance</span>
                    <span>{inr(selectedPatient.advancePayment)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-border pt-2">
                    <span>Balance due</span>
                    <span>{inr(balanceDue)}</span>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setSelectedPatient(null)}>
                  <X className="mr-1.5 h-4 w-4" />
                  Close
                </Button>

                <Button type="button" variant="secondary" onClick={handleCreateBill}>
                  Save Bill
                </Button>
                {/* {selectedPatient.dueAmount > 0 && (
  <Button type="button" onClick={handlePayDue}>
    Pay Existing Due
  </Button>
)} */}

                <Button type="button" onClick={handleDischarge}>
                  <CalendarClock className="mr-1.5 h-4 w-4" />
                  Create Bill & Discharge
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPatient} onOpenChange={(open) => !open && setEditPatient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit IPD Admission</DialogTitle>
            <DialogDescription>
              Update the same information captured during admission.
            </DialogDescription>
          </DialogHeader>

          {loadingEdit ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading admission details...
            </div>
          ) : (
            <div className="space-y-5">
              <EditSection title="Patient Information">
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Salutation</span>
                  <CreatableSelect
                    options={titleOptions}
                    value={titleOptions.find((option) => option.value === editForm.salutation) ??
                      (editForm.salutation
                        ? { value: editForm.salutation, label: editForm.salutation }
                        : null)}
                    onChange={(option: { value: string; label: string } | null) => {
                      const salutation = option?.value ?? "Mr.";
                      setEditForm((current) => ({
                        ...current,
                        salutation,
                        gender:
                          salutation === "Mr." || salutation === "Master" || salutation === "Mohd"
                            ? "Male"
                            : salutation === "Dr."
                              ? "-"
                              : "Female",
                      }));
                    }}
                    isClearable
                    isSearchable
                    placeholder="Select or type salutation"
                  />
                </label>
                <EditField
                  label="Patient name"
                  value={editForm.name}
                  onChange={(value) => updateEditField("name", value)}
                />
                <EditField
                  label="Date of birth"
                  type="date"
                  value={editForm.dob}
                  onChange={syncEditAgeFromDob}
                />
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Gender</span>
                  <Select
                    value={editForm.gender || "Male"}
                    onValueChange={(value) => updateEditField("gender", value)}
                  >
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
                </label>
                <EditField
                  label="Mobile"
                  value={editForm.mobile}
                  onChange={(value) => updateEditField("mobile", value)}
                />
                <EditField
                  label="Address"
                  value={editForm.address}
                  onChange={(value) => updateEditField("address", value)}
                />
                <EditField
                  label="City"
                  value={editForm.city}
                  onChange={(value) => updateEditField("city", value)}
                />
                <EditField
                  label="Emergency contact"
                  value={editForm.emergencyContact}
                  onChange={(value) => updateEditField("emergencyContact", value)}
                />
                <EditField
                  label="Attendant name"
                  value={editForm.attendantName}
                  onChange={(value) => updateEditField("attendantName", value)}
                />
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Age (Y/M/D)</span>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Y"
                      value={editForm.ageYears}
                      onChange={(event) => syncEditDobFromAge("ageYears", event.target.value)}
                    />
                    <Input
                      type="number"
                      min={0}
                      max={11}
                      placeholder="M"
                      value={editForm.ageMonths}
                      onChange={(event) => syncEditDobFromAge("ageMonths", event.target.value)}
                    />
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      placeholder="D"
                      value={editForm.ageDays}
                      onChange={(event) => syncEditDobFromAge("ageDays", event.target.value)}
                    />
                  </div>
                </label>
              </EditSection>

              <EditSection title="Admission Details">
                <EditField
                  label="Admission date"
                  type="date"
                  value={editForm.admissionDate}
                  onChange={(value) => updateEditField("admissionDate", value)}
                />
                <EditField
                  label="Admission time"
                  type="time"
                  value={editForm.admissionTime}
                  onChange={(value) => updateEditField("admissionTime", value)}
                />
                <EditField
                  label="Expected discharge"
                  type="date"
                  value={editForm.expectedDischargeDate ?? ""}
                  onChange={(value) => updateEditField("expectedDischargeDate", value)}
                />
                <EditField
                  label="Department"
                  value={editForm.department}
                  onChange={(value) => updateEditField("department", value)}
                />
                {/* <EditField
                  label="Doctor ID"
                  type="number"
                  value={editForm.doctorId}
                  onChange={(value) => updateEditField("doctorId", value)}
                /> */}
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Admission type</span>
                  <Select
                    value={editForm.admissionType}
                    onValueChange={(value) => updateEditField("admissionType", value)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {admissionTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Ward</span>
                  <Select
                    value={editForm.ward}
                    onValueChange={(value) => updateEditField("ward", value)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select ward" /></SelectTrigger>
                    <SelectContent>
                      {wardOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Room category</span>
                  <Select
                    value={editForm.roomCategory}
                    onValueChange={(value) => updateEditField("roomCategory", value)}
                  >
                    <SelectTrigger><SelectValue placeholder="Room category" /></SelectTrigger>
                    <SelectContent>
                      {roomCategoryOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <EditField
                  label="Referral"
                  value={editForm.referral}
                  onChange={(value) => updateEditField("referral", value)}
                />
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) => updateEditField("status", value)}
                  >
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      {admissionStatusOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              </EditSection>

              <EditSection title="Clinical Summary">
                <EditField
                  label="Reason for admission"
                  value={editForm.reason}
                  onChange={(value) => updateEditField("reason", value)}
                />
                <EditField
                  label="Diagnosis"
                  value={editForm.diagnosis}
                  onChange={(value) => updateEditField("diagnosis", value)}
                />
                <EditField
                  label="Clinical notes"
                  value={editForm.notes}
                  onChange={(value) => updateEditField("notes", value)}
                />
              </EditSection>

              <EditSection title="Billing & Insurance">
                <EditField
                  label="Insurance provider"
                  value={editForm.insurer}
                  onChange={(value) => updateEditField("insurer", value)}
                />
                <EditField
                  label="Policy number"
                  value={editForm.insurancePolicy}
                  onChange={(value) => updateEditField("insurancePolicy", value)}
                />
                <EditField
                  label="Advance payment"
                  type="number"
                  value={editForm.advancePayment}
                  onChange={(value) => updateEditField("advancePayment", value)}
                />
                <EditField
                  label="Package name"
                  value={editForm.packageName}
                  onChange={(value) => updateEditField("packageName", value)}
                />
              </EditSection>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditPatient(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleEditAdmission()}
              disabled={savingEdit || loadingEdit}
            >
              {savingEdit ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="grid gap-3 md:grid-cols-4">{children}</div>
    </section>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
