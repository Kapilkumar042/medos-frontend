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
import { Receipt, BedDouble, Pencil, Trash2, Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { openBillPreview } from "@/lib/opd-bill-print";
import { MessageCircle } from "lucide-react";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";

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
}

function Page() {
  const hospitalName = useAuthStore((state) => state.hospital?.name ?? "Hospital");
  const { patients, loading, loadPatients, updatePatient, removePatient } = useOpdStore();
  const { doctors } = useDoctors();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);

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

  const onPrintBill = async (patientId: string | number) => {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      toast.error("Please allow popups to print the bill");
      return;
    }

    printWindow.document.write(`
    <html>
      <body>
        <p>Generating bill...</p>
      </body>
    </html>
  `);

    try {
      const html = await opdApi.printPatient(patientId);

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (error) {
      printWindow.close();
      console.error(error);
      toast.error("Failed to print bill");
    }
  };
    const onViewPatient = (p: OpdPatient) => {
    navigate({
      to: "/opd/patient/$patientId",
      params: { patientId: String(p.id) },
    });
  };
  useEffect(() => {
    loadPatients();
    opdApi
      .listVisits()
      .then(setVisits)
      .catch(console.error)
      .finally(() => setVisitsLoading(false));
  }, []);

  useEffect(() => {
    loadPatients();

    Promise.all([opdApi.listVisits().catch(() => []), opdApi.listBills().catch(() => [])])
      .then(([visitsData, billsData]) => {
        setVisits(visitsData);
        setBills(billsData);
      })
      .finally(() => setVisitsLoading(false));
  }, []);

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

  const onTransferIPD = (p: OpdPatient) => {
    updatePatient(p.id, { status: "Transferred to IPD" });
    toast.success(`${p.name} transferred to IPD`);
    navigate({ to: "/ipd/admission" });
  };

  const onMakeBilling = async (p: OpdPatient) => {
    await onPrintBill(p.id);
  };

  const onEdit = (p: OpdPatient) => {
    navigate({
      to: "/opd/registration",
      search: { edit: String(p.id), billing: 1 } as never,
    });
  };

  const isLoading = loading || visitsLoading;

  return (
    <>
      <PageHeader
        title="OPD Patients"
        description="OPD registered patients — make billing, transfer to IPD, or edit details."
      >
        <Button size="sm" asChild className="bg-primary text-primary-foreground hover:opacity-90">
          <Link to="/opd/registration">
            <Plus className="h-4 w-4 mr-1.5" /> New Registration
          </Link>
        </Button>
      </PageHeader>

      <div className="rounded-2xl bg-card border border-border shadow-soft">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, UHID, mobile…"
              className="pl-9"
            />
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
                <th className="text-left px-4 py-2 font-medium">Visit Date</th>
                <th className="text-left px-4 py-2 font-medium">Symptoms</th>
                <th className="text-left px-4 py-2 font-medium">Net</th>
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
                    <tr key={p.id} className="border-t border-border hover:bg-muted/30">
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
                        <div className="text-xs text-muted-foreground max-w-[140px] truncate">
                          {visit?.symptoms ?? "—"}
                        </div>
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
                              {bill && (
                                <DropdownMenuItem onClick={() => onMakeBilling(p)}>
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

                              {/* <DropdownMenuItem onClick={() => onTransferIPD(p)}>
                                <BedDouble className="h-4 w-4 mr-2" />
                                Transfer to IPD
                              </DropdownMenuItem> */}

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
                                    toast.success("Patient deleted");
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
      </div>
    </>
  );
}
