import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useOpdStore, type OpdPatient } from "@/store/opdStore";
import { useDoctors } from "@/hooks/useDoctors";
import { opdApi } from "@/lib/opd-api";
import { inr } from "@/lib/format";
import { Receipt, BedDouble, Pencil, Trash2, Plus, Search, Loader2, Download, ReceiptText, Printer, IndianRupee, Percent } from "lucide-react";
import { toast } from "sonner";
import { openBillPreview } from "@/lib/opd-bill-print";
import { MessageCircle } from "lucide-react";
import { MoreVertical } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, ChevronDown, Filter, RotateCcw } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import type { DateRange } from "react-day-picker";
import { useAuthStore } from "@/store/authStore";
import { useCatalogStore, type CatalogItem } from "@/store/catalogStore";
import {
  PatientPaymentSummary,
  normalizePatientPaymentSummary,
  type PatientPaymentSummaryData,
} from "@/components/shared/PatientPaymentSummary";
import { dashboardApi } from "@/api/dashboardApi";
import CreatableSelect from "react-select/creatable";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/opd/patients")({
  component: Page,
});

interface Visit {
  id: number;
  patient_id: number;
  doctor_id: number;
  department: string;
  visit_date: string;
  symptoms?: string;
  notes?: string;
  status?: string;
}

interface Bill {
  id: number;
  patient_id: number;
  visit_id?: number;
  net_amount?: number;
  total_amount?: number;
  paid_amount?: number;
  due_amount?: number;
  pay_mode?: string;
  status?: string;
  remark?:string;
  payment_type?: "Single Paymode" | "Multi Paymode";
  discount_source?: "Hospital Discount" | "Doctor Discount";
}

type BillCategory =
  | "Advance"
  | "Lab Test"
  | "Radiology"
  | "Other"
  | "Medicine"
  | "Consultation fee";

type BillItem = {
  category: BillCategory;
  name: string;
  code: string;
  qty: number | string;
  amount: number | string;
  discount: number | string;
  remarks: string;
};

const newBillItem = (category: BillCategory = "Consultation fee"): BillItem => ({
  category,
  name: "",
  code: "",
  qty: 1,
  amount: 0,
  discount: 0,
  remarks: "",
});

type DatePreset = "today" | "yesterday" | "week" | "month" | "year" | "custom";

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateRange(preset: DatePreset): DateRange {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);

  if (preset === "yesterday") {
    start.setDate(today.getDate() - 1);
    end.setDate(today.getDate() - 1);
  }

  if (preset === "week") {
    const day = today.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;
    start.setDate(today.getDate() - daysFromMonday);
  }

  if (preset === "month") {
    start.setDate(1);
  }

  if (preset === "year") {
    start.setMonth(0, 1);
  }

  return { from: start, to: end };
}
function formatDisplayDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function getDateFilterLabel(preset: DatePreset, range: DateRange) {
  if (preset === "custom") {
    if (!range.from) return "Custom Date Range";

    const from = formatDisplayDate(range.from);
    const to = range.to ? formatDisplayDate(range.to) : "";

    return to && to !== from ? `${from} to ${to}` : from;
  }

  const labels: Record<Exclude<DatePreset, "custom">, string> = {
    today: "Today",
    yesterday: "Yesterday",
    week: "This Week",
    month: "This Month",
    year: "This Year",
  };

  return labels[preset];
}
function Page() {
  const hospitalName = useAuthStore((state) => state.hospital?.name ?? "Hospital");
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRange("today"));
  const { patients, loading, loadPatients, updatePatient, removePatient } = useOpdStore();
  const { doctors } = useDoctors();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [billingPatient, setBillingPatient] = useState<OpdPatient | null>(null);
  const [billingVisitId, setBillingVisitId] = useState<number | null>(null);
  const [editingBillId, setEditingBillId] = useState<number | null>(null);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [totalDiscountAmt, setTotalDiscountAmt] = useState("0");
  const [totalDiscountPct, setTotalDiscountPct] = useState("0");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentType, setPaymentType] = useState<"Single Paymode" | "Multi Paymode">(
    "Single Paymode",
  );
  const [paymentMode, setPaymentMode] = useState<"CASH" | "CARD" | "UPI" | "CHEQUE" | "INSURANCE">(
    "CASH",
  );
  const [discountSource, setDiscountSource] = useState<"Hospital Discount" | "Doctor Discount">(
    "Hospital Discount",
  );
  const [billCategory, setBillCategory] = useState<BillCategory>("Consultation fee");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [zeroBill, setZeroBill] = useState(false);
  const [submitAction, setSubmitAction] = useState<"save" | "print">("save");
  const [billRemark, setBillRemark] = useState("");
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingSaving, setBillingSaving] = useState(false);

  const loadCatalog = useCatalogStore((state) => state.loadCatalog);
  const labItems = useCatalogStore((state) => state.items.lab);
  const radiologyItems = useCatalogStore((state) => state.items.radiology);
  const serviceItems = useCatalogStore((state) => state.items.service);
  const medicineItems = useCatalogStore((state) => state.items.medicine);
  const [paymentSummary, setPaymentSummary] =
  useState<PatientPaymentSummaryData | null>(null);
const [transferringPatientId, setTransferringPatientId] = useState<string | null>(null);
  useEffect(() => {
    Promise.all([
      loadCatalog("lab"),
      loadCatalog("radiology"),
      loadCatalog("service"),
      loadCatalog("medicine"),
    ]).catch(() => toast.error("Failed to load catalog items"));
  }, [loadCatalog]);

  const catalogForCategory = (category: BillCategory): CatalogItem[] => {
    switch (category) {
      case "Lab Test":
        return labItems;
      case "Radiology":
        return radiologyItems;
      case "Other":
        return serviceItems;
      case "Medicine":
        return medicineItems;
      default:
        return [];
    }
  };

  // const onPrintBill = async (billId: number, patient: OpdPatient, visit: Visit | null) => {
  //   try {
  //     const bill = await opdApi.getBill(billId);

  //     const items = (bill.items ?? []).map((item: any) => ({
  //       name: item.name,
  //       category: item.category,
  //       code: item.code,
  //       qty: item.qty,
  //       amount: item.amount,
  //       discount: item.discount,
  //       remarks: item.remarks,
  //     }));

  //     const totals = {
  //       sub: bill.total_amount ?? 0,
  //       itemDisc: items.reduce((sum: any, item: any) => sum + (Number(item.discount) || 0), 0),
  //       totalDisc: bill.total_discount ?? 0,
  //       net: bill.net_amount ?? 0,
  //       due: bill.due_amount ?? 0,
  //     };

  //     const billPayload = {
  //       uhid: patient.uhid,
  //       opdNo: patient.opdNo,
  //       name: patient.name,
  //       gender: patient.gender,
  //       dob: patient.dob,
  //       bloodGroup: patient.bloodGroup,
  //       mobile: patient.mobile,
  //       email: patient.email,
  //       address: patient.address,
  //       department: visit?.department ?? patient.department,
  //       doctorId: String(visit?.doctor_id ?? patient.doctorId ?? ""),
  //       visitDate: visit?.visit_date ?? patient.visitDate,
  //       symptoms: visit?.symptoms ?? patient.symptoms,
  //       items,
  //       discountSource: bill.discount_source ?? bill.discountSource,
  //       payMode1: bill.pay_mode ?? bill.payment_mode,
  //       amount1: bill.paid_amount ?? bill.paidAmount,
  //       remark: bill.remark,
  //     };

  //     openBillPreview(billPayload, totals, doctors, {
  //       billNo: bill.bill_no ?? bill.billNo ?? `BL-${bill.id}`,
  //       autoPrint: true,
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     toast.error("Failed to load bill");
  //   }
  // };

  // const onPrintBill = async (patientId: string | number) => {
  //   const printWindow = window.open("", "_blank");

  //   if (!printWindow) {
  //     toast.error("Please allow popups to print the bill");
  //     return;
  //   }

  //   printWindow.document.write(`
  //   <html>
  //     <body>
  //       <p>Generating bill...</p>
  //     </body>
  //   </html>
  // `);

  //   try {
  //     const html = await opdApi.printPatient(patientId);

  //     printWindow.document.open();
  //     printWindow.document.write(html);
  //     printWindow.document.close();
  //   } catch (error) {
  //     printWindow.close();
  //     console.error(error);
  //     toast.error("Failed to print bill");
  //   }
  // };
  const onViewPatient = (p: OpdPatient) => {
    navigate({
      to: "/opd/patient/$patientId",
      params: { patientId: String(p.id) },
    });
  };
  // useEffect(() => {
  //   loadPatients();
  //   opdApi
  //     .listVisits()
  //     .then(setVisits)
  //     .catch(console.error)
  //     .finally(() => setVisitsLoading(false));
  // }, []);

  // useEffect(() => {
  //   loadPatients();

  //   Promise.all([opdApi.listVisits().catch(() => []), opdApi.listBills().catch(() => [])])
  //     .then(([visitsData, billsData]) => {
  //       setVisits(visitsData);
  //       setBills(billsData);
  //     })
  //     .finally(() => setVisitsLoading(false));
  // }, []);

  useEffect(() => {
    const from = dateRange.from;
    const to = dateRange.to ?? dateRange.from;

    if (!from || !to) return;

    loadPatients({
      start_date: formatDate(from),
      end_date: formatDate(to),
    }).catch(console.error);

    Promise.all([opdApi.listVisits().catch(() => []), opdApi.listBills().catch(() => [])])
      .then(([visitsData, billsData]) => {
        setVisits(visitsData);
        setBills(billsData);
      })
      .finally(() => setVisitsLoading(false));
  }, [dateRange, loadPatients]);
  function normalizeWhatsAppNumber(value?: string) {
    const digits = String(value ?? "").replace(/\D/g, "");

    return digits.length === 10 ? `91${digits}` : digits;
  }

  async function sendBillOnWhatsApp(patient: OpdPatient, bill: Bill) {
    try {
      const phone = normalizeWhatsAppNumber(patient.mobile);

      if (phone.length < 12) {
        toast.error("Invalid patient WhatsApp number");
        return;
      }

      const shareData = await opdApi.getBillShareLink(bill.id);

      const message = `Dear ${patient.name},

We hope you're feeling well today.

Your OPD bill is ready. You can view and download it from the link below:

Patient Name: ${patient.name}
UHID: ${patient.uhid ?? ""}
Bill Number: ${bill.id}

Bill Link: ${shareData.print_url}

Take care,
${hospitalName}`;

      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      toast.error("Could not generate bill link");
    }
  }
  // Helper to get latest bill for a patient:
  const getLatestBill = (patientId: string) => {
    return (
      bills
        .filter((b) => String(b.patient_id) === String(patientId))
        .sort((a, b) => b.id - a.id)[0] ?? null
    );
  };

  // Get latest visit for a patient
  const getLatestVisit = (patientId: string) => {
    const patientVisits = visits
      .filter((v) => String(v.patient_id) === String(patientId))
      .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
    return patientVisits[0] ?? null;
  };

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return patients;
    return patients.filter(
      (p) =>
        p.name?.toLowerCase().includes(t) ||
        p.uhid?.toLowerCase().includes(t) ||
        p.mobile?.toLowerCase().includes(t),
    );
  }, [patients, q]);

  const docName = (doctorId: string) => {
    const doc = doctors.find((d) => String(d.id) === String(doctorId));
    return doc ? `${doc.specialization} • Room ${doc.room_no}` : "—";
  };

    

  const onTransferIPD = async (patient: OpdPatient) => {
    setTransferringPatientId(String(patient.id));

    try {
      const visit = getLatestVisit(patient.id);
      const doctorId = visit?.doctor_id ?? Number(patient.doctorId);

      const patientWithDateTime = patient as OpdPatient & {
  date_time?: string;
  dateTime?: string;
};

const registrationDateTime =
  patientWithDateTime.date_time ??
  patientWithDateTime.dateTime;

const admission = await opdApi.admitFromOpd({
  patient_id: Number(patient.id),
  doctor_id:
    Number.isInteger(doctorId) && doctorId > 0
      ? doctorId
      : null,
  department: visit?.department ?? patient.department ?? null,
  admission_date: registrationDateTime
    ? registrationDateTime.length === 16
      ? `${registrationDateTime}:00`
      : registrationDateTime
    : undefined,
});

      toast.success(
        `Admission created${admission?.admission_no ? `: ${admission.admission_no}` : ""}`,
      );
      const admissionRecord =
        admission?.admission ??
        admission?.data?.admission ??
        admission?.data?.data ??
        admission?.data ??
        admission;
      const admissionId = admissionRecord?.id ?? admissionRecord?.admission_id;

      navigate({
        to: "/ipd/patients",
        search: admissionId ? { edit: String(admissionId) } : {},
      });
    } catch (error) {
      console.error("OPD to IPD admission failed:", error);
      toast.error("Failed to transfer patient to IPD");
    } finally {
      setTransferringPatientId(null);
    }
  };

  const onPrintBill = async (patient: OpdPatient) => {
    const bill = getLatestBill(patient.id);
    if (!bill) {
      toast.error("No bill found for this patient");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print the bill");
      return;
    }

    try {
      const html = await opdApi.printBill(bill.id);
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (error) {
      printWindow.close();
      console.error(error);
      toast.error("Failed to print bill");
    }
  };
  const onMakeBilling = async (patient: OpdPatient) => {
    setBillingLoading(true);
    setBillingPatient(patient);

    try {
      const visit = getLatestVisit(patient.id);
      const existingBill = getLatestBill(patient.id);
      const bill = existingBill ? await opdApi.getBill(existingBill.id) : null;

      const rawItems = bill?.items ?? [];
      const parsedItems = typeof rawItems === "string" ? JSON.parse(rawItems) : rawItems;

      setBillingVisitId(visit?.id ?? bill?.visit_id ?? null);
      setEditingBillId(bill ? Number(bill.id) : null);
      setBillItems(
        Array.isArray(parsedItems) && parsedItems.length
          ? parsedItems.map((item: Partial<BillItem>) => ({
              ...newBillItem(),
              ...item,
              qty: Number(item.qty) || 1,
              amount: Number(item.amount) || 0,
              discount: Number(item.discount) || 0,
            }))
          : [newBillItem()],
      );
      const firstCategory = Array.isArray(parsedItems)
        ? parsedItems.find((item: Partial<BillItem>) => item.category)?.category
        : undefined;
      const consultationItem = Array.isArray(parsedItems)
        ? parsedItems.find((item: Partial<BillItem>) => item.category === "Consultation fee")
        : undefined;
      setBillCategory(firstCategory ?? "Consultation fee");
      setSelectedDoctorId(consultationItem?.code ?? "");
      setZeroBill(false);
      setTotalDiscountAmt(String(Number(bill?.total_discount) || 0));
      const loadedBase = Array.isArray(parsedItems)
        ? parsedItems.reduce(
            (sum: number, item: Partial<BillItem>) =>
              sum + (Number(item.qty) || 0) * (Number(item.amount) || 0) - (Number(item.discount) || 0),
            0,
          )
        : 0;
      setTotalDiscountPct(
        String(loadedBase > 0 ? Number(((Number(bill?.total_discount || 0) / loadedBase) * 100).toFixed(2)) : 0),
      );
      setAmountPaid(String(Number(bill?.paid_amount) || 0));
      setPaymentType(bill?.payment_type ?? "Single Paymode");
      setPaymentMode(String(bill?.payment_mode ?? "CASH").toUpperCase() as typeof paymentMode);
      setDiscountSource(bill?.discount_source ?? "Hospital Discount");
      setBillRemark(bill?.remark ?? "");
    } catch (error) {
      console.error(error);
      toast.error("Could not load bill details");
      setBillingPatient(null);
    } finally {
      setBillingLoading(false);
    }
  };

  const subtotal = billItems.reduce(
    (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.amount) || 0),
    0,
  );
  const itemDiscount = billItems.reduce((sum, item) => sum + (Number(item.discount) || 0), 0);
  const discountBase = Math.max(0, subtotal - itemDiscount);
  const billDiscount = Math.min(discountBase, Number(totalDiscountAmt) || 0);
  const calculatedNet = Math.max(0, discountBase - billDiscount);
  const netAmount = zeroBill ? 0 : calculatedNet;
  const displaySubtotal = zeroBill ? 0 : subtotal;
  const displayDiscount = zeroBill ? discountBase : billDiscount;
  const totalDue = Math.max(0, netAmount - (Number(amountPaid) || 0));

  const addCatalogItemToBill = (catalogItem: CatalogItem) => {
    setBillItems((current) => [
      ...current,
      {
        ...newBillItem(billCategory),
        name: catalogItem.name,
        code: catalogItem.code || String(catalogItem.id ?? catalogItem.name),
        amount: Number(catalogItem.unitPrice ?? catalogItem.price ?? catalogItem.mrp ?? 0),
      },
    ]);
  };

  const addCustomBillItem = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setBillItems((current) => [...current, { ...newBillItem(billCategory), name: trimmedName }]);
  };

  const handleDiscountAmountChange = (value: string) => {
    setTotalDiscountAmt(value);
    const amount = Math.max(0, Number(value) || 0);
    setTotalDiscountPct(String(discountBase > 0 ? Number(((amount / discountBase) * 100).toFixed(2)) : 0));
  };

  const handleDiscountPercentageChange = (value: string) => {
    setTotalDiscountPct(value);
    const percentage = Math.min(100, Math.max(0, Number(value) || 0));
    setTotalDiscountAmt(String(Number(((discountBase * percentage) / 100).toFixed(2))));
  };

  const selectConsultant = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    const doctor = doctors.find((entry) => String(entry.id) === doctorId);
    if (!doctor) return;

    const consultationItem: BillItem = {
      ...newBillItem("Consultation fee"),
      name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
      code: String(doctor.id),
      amount: Number(doctor.normal_fee) || 0,
    };
    setBillItems((current) => {
      const index = current.findIndex((item) => item.category === "Consultation fee");
      if (index < 0) return [...current, consultationItem];
      return current.map((item, itemIndex) => itemIndex === index ? consultationItem : item);
    });
  };

  const updateBillItem = (index: number, patch: Partial<BillItem>) => {
    setBillItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
  };

  const saveBilling = async (action: "save" | "print") => {
    if (!billingPatient) return;
    setSubmitAction(action);

    const printWindow = action === "print" ? window.open("", "_blank") : null;
    if (action === "print" && !printWindow) {
      toast.error("Please allow pop-ups to print the bill");
      return;
    }

    setBillingSaving(true);
    try {
      const payload = {
        patient_id: billingPatient.id,
        visit_id: billingVisitId,
        total_amount: subtotal,
        total_discount: zeroBill ? discountBase : billDiscount,
        net_amount: netAmount,
        paid_amount: Number(amountPaid) || 0,
        due_amount: totalDue,
        payment_mode: paymentMode,
        payment_type: paymentType,
        discount_source: discountSource,
        remark: billRemark,
        items: billItems.map((item) => ({
          category: item.category,
          name: item.name,
          code: item.code,
          qty: Number(item.qty) || 0,
          amount: Number(item.amount) || 0,
          discount: Number(item.discount) || 0,
          remarks: item.remarks,
        })),
      };

      let savedBill: any;
      if (editingBillId) {
        savedBill = await opdApi.updateBill(editingBillId, payload);
      } else {
        savedBill = await opdApi.createBill(payload);
      }

      const refreshedBills = await opdApi.listBills();
      setBills(refreshedBills);
      toast.success(editingBillId ? "Bill updated" : "Bill created");

      if (action === "print" && printWindow) {
        const billId = Number(savedBill?.id ?? savedBill?.bill?.id ?? editingBillId);
        const latestBillId = billId || Number(
          refreshedBills
            .filter((bill: Bill) => String(bill.patient_id) === String(billingPatient.id))
            .sort((first: Bill, second: Bill) => second.id - first.id)[0]?.id,
        );
        if (!latestBillId) throw new Error("Saved bill ID was not returned");

        const html = await opdApi.printBill(latestBillId);
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
      } else {
        setBillingPatient(null);
      }
    } catch (error) {
      printWindow?.close();
      console.error(error);
      toast.error("Failed to save bill");
    } finally {
      setBillingSaving(false);
    }
  };
  const onEdit = (p: OpdPatient) => {
    navigate({
      to: "/opd/registration",
      search: { edit: String(p.id), billing: 1 } as never,
    });
  };

  const isLoading = loading || visitsLoading;

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
    .getOpd({
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
      const blob = await opdApi.exportPatients({
        start_date: formatDate(from),
        end_date: formatDate(to),
        file_format: fileFormat,
      });

      downloadBlob(blob, `opd-patients-${formatDate(from)}-to-${formatDate(to)}.${fileFormat}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to export OPD patients");
    }
  };

  return (
    <>
      <PageHeader
        title="OPD Patients"
        description="OPD registered patients — make billing, transfer to IPD, or edit details."
      >
        <Button variant="outline" onClick={() => handleExport("xlsx")}>
          <Download className="mr-1.5 h-4 w-4" />
          Export Excel
        </Button>

        <Button variant="outline" onClick={() => handleExport("pdf")}>
          <Download className="mr-1.5 h-4 w-4" />
          Export PDF
        </Button>
        <Button size="sm" asChild className="bg-primary text-primary-foreground hover:opacity-90">
          <Link to="/opd/registration">
            <Plus className="h-4 w-4 mr-1.5" /> New Registration
          </Link>
        </Button>
      </PageHeader>

      <div className="rounded-2xl bg-card border border-border shadow-soft">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <div className="flex items-center justify-between gap-3">
            {/* Search left */}
            <div className="relative w-96 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Search by name, UHID, mobile..."
                className="pl-9"
              />
            </div>

            {/* Filters right */}
            <div className="flex items-center gap-2">
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

                <DropdownMenuContent align="end" className="w-44">
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

                  <DropdownMenuItem
                    onClick={() => {
                      setDatePreset("custom");
                    }}
                  >
                    Custom Date Range
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {rows.length} of {patients.length} patients
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-medium">UHID</th>
                <th className="text-left px-4 py-2 font-medium">Patient</th>
                <th className="text-left px-4 py-2 font-medium">Mobile</th>
                <th className="text-left px-4 py-2 font-medium">Doctor / Dept</th>
                <th className="text-left px-4 py-2 font-medium">FollowUp Date</th>
                <th className="text-left px-4 py-2 font-medium">Net</th>
                <th className="text-left px-4 py-2 font-medium">Discount Reason</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-right px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} className="text-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground mt-2">Loading patients…</p>
                  </td>
                </tr>
              )}

              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-muted-foreground text-sm">
                    No OPD patients yet.{" "}
                    <Link to="/opd/registration" className="text-primary underline">
                      Register a patient
                    </Link>
                    .
                  </td>
                </tr>
              )}

              {!isLoading &&
                rows.map((p) => {
                  const visit = getLatestVisit(p.id);
                  const bill = getLatestBill(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`border-t border-border ${
                        p.status === "Billed"
                          ? "bg-green-50 hover:bg-green-100"
                          : p.status === "Transferred to IPD"
                            ? "bg-blue-50 hover:bg-blue-100"
                            : p.status === "Registered" || !p.status
                              ? "bg-yellow-50 hover:bg-yellow-100"
                              : "bg-yellow-50 hover:bg-yellow-100"
                      }`}
                      //  className="border-t border-border hover:bg-muted/30"
                    >
                      <td className="px-4 py-2 font-mono text-xs">{p.uhid ?? "—"}</td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => onViewPatient(p)}
                          className="font-medium text-primary hover:underline text-left"
                        >
                          {p.name}
                        </button>
                        <div className="text-xs text-muted-foreground">
                          {p.gender} • {p.bloodGroup}
                        </div>
                      </td>
                      <td className="px-4 py-2">{p.mobile}</td>
                      <td className="px-4 py-2">
                        <div className="text-xs font-medium">
                          {/* Use visit's doctor_id if available, fallback to patient's */}
                          {docName(String(visit?.doctor_id ?? p.doctorId))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {visit?.department ?? p.department}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {visit?.visit_date ?? p.visitDate ?? "—"}
                        {visits.filter((v) => String(v.patient_id) === String(p.id)).length > 1 && (
                          <div className="text-xs text-muted-foreground">
                            +
                            {visits.filter((v) => String(v.patient_id) === String(p.id)).length - 1}{" "}
                            more
                          </div>
                        )}
                      </td>
                      
                      <td className="px-4 py-2">
                        {bill ? (
                          <div>
                            <div className="font-medium">
                              {inr(bill.net_amount ?? bill.total_amount ?? 0)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Paid: {inr(bill.paid_amount ?? 0)}
                              {(bill.due_amount ?? 0) > 0 && (
                                <span className="text-destructive ml-1">
                                  • Due: {inr(bill.due_amount!)}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No bill</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-xs text-muted-foreground max-w-[140px] truncate">
                          {bill?.remark ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          variant="outline"
                          className={
                            p.status === "Billed"
                              ? "border-success text-success"
                              : p.status === "Transferred to IPD"
                                ? "border-info text-info"
                                : "border-warning text-warning"
                          }
                        >
                          {p.status ?? "Registered"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        {/* <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => onMakeBilling(p)}>
                            <Receipt className="h-3.5 w-3.5 mr-1" />
                            {getLatestBill(p.id) ? "Print Bill" : "Billing"}
                          </Button>
                          {bill && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendBillOnWhatsApp(p, bill)}
                            >
                              <MessageCircle className="h-3.5 w-3.5 mr-1" />
                              WhatsApp Bill
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => onTransferIPD(p)}>
                            <BedDouble className="h-3.5 w-3.5 mr-1" /> IPD
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onEdit(p)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Delete ${p.name}?`)) {
                                removePatient(p.id);
                                toast.success("Patient deleted");
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div> */}
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => void onMakeBilling(p)}>
                                <ReceiptText className="mr-1.5 h-3.5 w-3.5" />
                                Billing
                              </DropdownMenuItem>
                              {bill && (
                                <DropdownMenuItem onClick={() => onPrintBill(p)}>
                                  <Receipt className="h-4 w-4 mr-2" />
                                  {"Print Bill"}
                                </DropdownMenuItem>
                              )}

                              {bill && (
                                <DropdownMenuItem onClick={() => sendBillOnWhatsApp(p, bill)}>
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  WhatsApp Bill
                                </DropdownMenuItem>
                              )}

                               <DropdownMenuItem
  disabled={transferringPatientId === String(p.id)}
  onClick={() => void onTransferIPD(p)}
>
  <BedDouble className="mr-2 h-4 w-4" />
  {transferringPatientId === String(p.id)
    ? "Transferring..."
    : "Transfer to IPD"}
</DropdownMenuItem>

                              <DropdownMenuItem onClick={() => onEdit(p)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm(`Delete ${p.name}?`)) {
                                    removePatient(p.id);
                                    toast.success("Patient deleted", {
                                      duration: 500,
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <PatientPaymentSummary title="Total Sale" summary={paymentSummary} />
      </div>
      <Dialog open={!!billingPatient} onOpenChange={(open) => !open && setBillingPatient(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Billing{billingPatient ? `: ${billingPatient.name}` : ""}</DialogTitle>
            <DialogDescription>
              Update bill details. Patient and visit records are not changed here.
            </DialogDescription>
          </DialogHeader>

          {billingLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading bill…</p>
          ) : (
            <>
              <section className="space-y-3 rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold">Visit Details</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Visit Purpose">
                    <Select
                      value={billCategory}
                      onValueChange={(value) => setBillCategory(value as BillCategory)}
                    >
                      <SelectTrigger><SelectValue placeholder="Select visit purpose" /></SelectTrigger>
                      <SelectContent>
                        {[
                          "Advance",
                          "Lab Test",
                          "Radiology",
                          "Other",
                          "Medicine",
                          "Consultation fee",
                        ].map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Select Service">
                    <CreatableSelect
                      isClearable
                      isSearchable
                      value={null}
                      placeholder="Search or create service"
                      options={catalogForCategory(billCategory).map((item) => ({
                        value: String(item.id || item.code || item.name),
                        label: item.name,
                        expiry: item.expiry,
                        item,
                      }))}
                      formatOptionLabel={(option) => (
                        <span>
                          {option?.label ?? ""}
                          {billCategory === "Medicine" && option?.expiry && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              Exp: ({option.expiry})
                            </span>
                          )}
                        </span>
                      )}
                      onChange={(option) => {
                        if (option) addCatalogItemToBill(option.item);
                      }}
                      onCreateOption={addCustomBillItem}
                    />
                  </Field>

                  <Field label="Consultant Doctor">
                    <Select value={selectedDoctorId} onValueChange={selectConsultant}>
                      <SelectTrigger><SelectValue placeholder="Select consultant doctor" /></SelectTrigger>
                      <SelectContent>
                        {doctors
                          .filter((doctor) => doctor.status)
                          .map((doctor) => (
                            <SelectItem key={doctor.id} value={String(doctor.id)}>
                              Dr. {doctor.first_name} {doctor.last_name} - Fee: {inr(doctor.normal_fee)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </section>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left">Purpose</th>
                      <th className="p-2 text-left">Item Name</th>
                      <th className="p-2 text-left">Code</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2 text-right">Discount</th>
                      <th className="p-2 text-right">Net Amt</th>
                      <th className="p-2 text-left">Remarks</th>
                      <th className="p-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((item, index) => {
                      const catalog: CatalogItem[] = catalogForCategory(item.category);
                      const selected = catalog.find(
                        (entry) =>
                          (item.code &&
                            (String(entry.code ?? "") === item.code ||
                              String(entry.id ?? "") === item.code)) ||
                          (item.name && entry.name === item.name),
                      );
                      const selectedValue = selected
                        ? String(selected.id || selected.code || selected.name)
                        : "";
                      const selectedDoctor = doctors.find(
                        (doctor) =>
                          String(doctor.id) === item.code ||
                          `Dr. ${doctor.first_name} ${doctor.last_name}` === item.name,
                      );

                      return (
                        <tr key={index} className="border-t border-border">
                          <td className="p-2">
                            <Select
                              value={item.category}
                              onValueChange={(value) =>
                                updateBillItem(index, { category: value as BillCategory })
                              }
                            >
                              <SelectTrigger className="min-w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[
                                  "Advance",
                                  "Lab Test",
                                  "Radiology",
                                  "Other",
                                  "Medicine",
                                  "Consultation fee",
                                ].map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>

                          <td className="p-2">
                            {item.category === "Consultation fee" ? (
                              <Select
                                value={selectedDoctor ? String(selectedDoctor.id) : ""}
                                onValueChange={(value) => {
                                  const doctor = doctors.find((entry) => String(entry.id) === value);
                                  if (!doctor) return;

                                  updateBillItem(index, {
                                    name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
                                    code: String(doctor.id),
                                    amount: Number(doctor.normal_fee) || 0,
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select consultant doctor…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {doctors
                                    .filter((doctor) => doctor.status)
                                    .map((doctor) => (
                                      <SelectItem key={doctor.id} value={String(doctor.id)}>
                                        Dr. {doctor.first_name} {doctor.last_name} - Fee: {inr(doctor.normal_fee)}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            ) : catalog.length > 0 ? (
                              <Select
                                value={selectedValue}
                                onValueChange={(value) => {
                                  const selectedItem = catalog.find(
                                    (entry) =>
                                      String(entry.id || entry.code || entry.name) === value,
                                  );
                                  if (!selectedItem) return;

                                  updateBillItem(index, {
                                    name: selectedItem.name,
                                    code:
                                      selectedItem.code ||
                                      String(selectedItem.id || selectedItem.name),
                                    amount: Number(
                                      selectedItem.unitPrice ??
                                        selectedItem.price ??
                                        selectedItem.mrp ??
                                        0,
                                    ),
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select item…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {catalog
                                    .slice()
                                    .sort((a, b) =>
                                      a.name.localeCompare(b.name, undefined, {
                                        sensitivity: "base",
                                        numeric: true,
                                      }),
                                    )
                                    .map((entry) => (
                                      <SelectItem
                                        key={String(entry.id || entry.code || entry.name)}
                                        value={String(entry.id || entry.code || entry.name)}
                                      >
                                        {entry.name}{" "}
                                        {entry.expiry && (
                                          <span className="text-xs text-muted-foreground">
                                            Exp: ({entry.expiry})
                                          </span>
                                        )}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={item.name}
                                onChange={(event) =>
                                  updateBillItem(index, { name: event.target.value })
                                }
                                placeholder="Item name"
                              />
                            )}
                          </td>

                          <td className="p-2">
                            <Input
                              value={item.code}
                              onChange={(event) =>
                                updateBillItem(index, { code: event.target.value })
                              }
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min={1}
                              step={1}
                              value={item.qty || ""}
                              onKeyDown={(event) => {
                                if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                                  event.preventDefault();
                                }
                              }}
                              onWheel={(event) => event.currentTarget.blur()}
                              onChange={(event) =>
                                updateBillItem(index, { qty: event.target.value })
                              }
                              onBlur={() =>
                                updateBillItem(index, {
                                  qty: Math.max(1, Math.floor(Number(item.qty) || 1)),
                                })
                              }
                              className="w-20"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min={0}
                              value={item.amount}
                              onChange={(event) =>
                                updateBillItem(index, { amount: event.target.value })
                              }
                              className="w-24"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min={0}
                              value={item.discount}
                              onChange={(event) =>
                                updateBillItem(index, { discount: event.target.value })
                              }
                              className="w-24"
                            />
                          </td>
                          <td className="p-2 text-right font-medium">
                            <Input
                              className="w-24 bg-muted/40 text-right"
                              value={Math.max(
                                0,
                                (Number(item.qty) || 0) * (Number(item.amount) || 0) -
                                  (Number(item.discount) || 0),
                              )}
                              readOnly
                              tabIndex={-1}
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={item.remarks}
                              onChange={(event) =>
                                updateBillItem(index, { remarks: event.target.value })
                              }
                            />
                          </td>
                          <td className="p-2">
                            <div className="flex items-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Add bill item"
                                title="Add bill item"
                                onClick={() =>
                                  setBillItems((current) => [
                                    ...current,
                                    newBillItem(item.category),
                                  ])
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Remove bill item"
                                title="Remove bill item"
                                onClick={() =>
                                  setBillItems((current) =>
                                    current.filter((_, itemIndex) => itemIndex !== index),
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <section className="space-y-4 rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold">Bill Summary</h3>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={zeroBill} onCheckedChange={(checked) => setZeroBill(Boolean(checked))} />
                    Make bill zero
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Net Payable: <span className="font-semibold text-primary">{inr(netAmount)}</span>
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <Field label="Total Amount">
                    <Input value={inr(displaySubtotal)} readOnly className="bg-muted/40" />
                  </Field>
                  <div className="flex items-center gap-0 md:mt-7">
                    <div className="flex items-center">
                      <div className="flex h-10 w-9 items-center justify-center border border-r-0 bg-muted">
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0"
                        value={totalDiscountAmt}
                        onChange={(event) => handleDiscountAmountChange(event.target.value)}
                        className="h-10 w-20 rounded-none"
                      />
                    </div>
                    <div className="flex items-center">
                      <div className="flex h-10 w-9 items-center justify-center border border-r-0 bg-muted">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        placeholder="0"
                        value={totalDiscountPct}
                        onChange={(event) => handleDiscountPercentageChange(event.target.value)}
                        className="h-10 w-20 rounded-none"
                      />
                    </div>
                  </div>
                  <Field label="Total Discount">
                    <Input value={inr(displayDiscount)} readOnly className="bg-muted/40" />
                  </Field>
                  <Field label="Net Amount">
                    <Input value={inr(netAmount)} readOnly className="bg-muted/40 font-semibold" />
                  </Field>
                  <Field label="Payment Type">
                    <Select value={paymentType} onValueChange={(value) => setPaymentType(value as typeof paymentType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single Paymode">Single Paymode</SelectItem>
                        <SelectItem value="Multi Paymode">Multi Paymode</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Pay Mode">
                    <Select value={paymentMode} onValueChange={(value) => setPaymentMode(value as typeof paymentMode)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["CASH", "CARD", "UPI", "CHEQUE", "INSURANCE"].map((mode) => (
                          <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Amount Paid">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={amountPaid}
                      onChange={(event) => setAmountPaid(event.target.value)}
                    />
                  </Field>
                  <Field label="Total Due">
                    <Input value={inr(zeroBill ? 0 : totalDue)} readOnly className="bg-muted/40 font-medium" />
                  </Field>
                  <Field label="Offer By">
                    <Select value={discountSource} onValueChange={(value) => setDiscountSource(value as typeof discountSource)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hospital Discount">Hospital Discount</SelectItem>
                        <SelectItem value="Doctor Discount">Doctor Discount</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Discount Reason">
                    <Input value={billRemark} onChange={(event) => setBillRemark(event.target.value)} />
                  </Field>
                </div>
              </section>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBillingPatient(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void saveBilling("save")}
              disabled={billingLoading || billingSaving}
            >
              {billingSaving && submitAction === "save"
                ? "Saving..."
                : editingBillId
                  ? "Update Bill"
                  : "Save Bill"}
            </Button>
            <Button
              type="button"
              onClick={() => void saveBilling("print")}
              disabled={billingLoading || billingSaving}
            >
              <Printer className="mr-1.5 h-4 w-4" />
              {billingSaving && submitAction === "print" ? "Generating bill..." : "Save & Generate Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
      <Label className="text-[15px]">{label}</Label>
      <div className="mt-1">{children}</div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
