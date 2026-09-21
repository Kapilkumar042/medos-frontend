import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
  ReceiptText,
  UserRoundCheck,
  CalendarClock,
  BedDouble,
  Stethoscope,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { inr } from "@/lib/format";
import { useEffect } from "react";

import {
  getAdmissions,
  dischargePatient,
  createIPDBill
} from "@/api/ipd-api";

// import {
//   createIPDBill,
// } from "@/api/ipd-payment-api";

export const Route = createFileRoute("/_authenticated/ipd/patients")({
  component: IpdPatientsPage,
});

type AdmissionPatient = {
  id: number;
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
  diagnosis: string;
};

type ServiceItem = {
  id: string;
  name: string;
  category: string;
  fee: number;
};

const billingServices: ServiceItem[] = [
  { id: "consultation", name: "Consultation", category: "Doctor", fee: 500 },
  { id: "room", name: "Room & Board", category: "Ward", fee: 1800 },
  { id: "lab", name: "Lab Investigation", category: "Diagnostics", fee: 1200 },
  { id: "radiology", name: "Radiology", category: "Diagnostics", fee: 1600 },
  { id: "pharmacy", name: "Medication", category: "Pharmacy", fee: 950 },
  { id: "nursing", name: "Nursing Care", category: "Care", fee: 700 },
];

const initialPatients: AdmissionPatient[] = [
  {
    id: 101,
    name: "Aarav Sharma",
    uhid: "UH10021",
    mobile: "9876543210",
    doctor: "Dr. Mehta",
    department: "General Medicine",
    ward: "General",
    room: "G-204",
    admissionDate: "2026-09-18",
    status: "Admitted",
    advancePayment: 4000,
    diagnosis: "Fever and dehydration",
  },
  {
    id: 102,
    name: "Priya Nair",
    uhid: "UH10042",
    mobile: "9988776655",
    doctor: "Dr. Kapoor",
    department: "Cardiology",
    ward: "ICU",
    room: "ICU-01",
    admissionDate: "2026-09-15",
    status: "Observation",
    advancePayment: 6000,
    diagnosis: "Chest discomfort monitoring",
  },
  {
    id: 103,
    name: "Rohan Verma",
    uhid: "UH10072",
    mobile: "9123456789",
    doctor: "Dr. Singh",
    department: "Orthopedics",
    ward: "Private",
    room: "P-12",
    admissionDate: "2026-09-10",
    status: "Pending",
    advancePayment: 2500,
    diagnosis: "Post-operative recovery",
  },
  {
    id: 104,
    name: "Isha Gupta",
    uhid: "UH10105",
    mobile: "9765432100",
    doctor: "Dr. Iyer",
    department: "Pediatrics",
    ward: "General",
    room: "G-118",
    admissionDate: "2026-09-08",
    status: "Discharged",
    advancePayment: 8000,
    diagnosis: "Respiratory infection",
  },
];

export function IpdPatientsPage() {
  const [patients, setPatients] =
  useState<AdmissionPatient[]>([]);
  const [query, setQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<AdmissionPatient | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([
    "consultation",
    "room",
    "nursing",
  ]);
  const [discountPercent, setDiscountPercent] = useState(10);

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

  const openBillingDialog = (patient: AdmissionPatient) => {
    setSelectedPatient(patient);
    setSelectedServiceIds(["consultation", "room", "nursing"]);
    setDiscountPercent(Math.min(15, Math.max(0, patient.advancePayment > 0 ? 10 : 0)));
  };

  const toggleService = (id: string) => {
    setSelectedServiceIds((current) =>
      current.includes(id) ? current.filter((serviceId) => serviceId !== id) : [...current, id],
    );
  };

  const selectedServices = billingServices.filter((service) => selectedServiceIds.includes(service.id));
  const subtotal = selectedServices.reduce((sum, service) => sum + service.fee, 0);
  const discountValue = subtotal * (discountPercent / 100);
  const netTotal = subtotal - discountValue;

  const loadPatients = async () => {
  try {
    const data =
      await getAdmissions();

    setPatients(data);
  } catch {
    toast.error(
      "Failed to load patients"
    );
  }
};

useEffect(() => {
  loadPatients();
}, []);

 const handleCreateBill =
  async () => {

    if (!selectedPatient)
      return;

    try {

      const items =
        selectedServices.map(
          (service) => ({
            category:
              service.category,

            name:
              service.name,

            qty: 1,

            rate:
              service.fee,

            amount:
              service.fee,

            discount: 0,

            remarks: "",
          })
        );

      const billPayload = {

        admission_id:
          selectedPatient.id,

        patient_id:
          selectedPatient.patient_id,

        total_amount:
          subtotal,

        discount_amount:
          discountValue,

        net_amount:
          netTotal,

        paid_amount: 0,

        payment_mode:
          "Cash",

        remark: "",

        items,
      };

      const bill =
        await createIPDBill(
          billPayload
        );

      toast.success(
        "Bill created successfully"
      );

      window.open(
        `/api/ipd-billing/${bill.id}/print`,
        "_blank"
      );

      setSelectedPatient(
        null
      );

    } catch {

      toast.error(
        "Failed to create bill"
      );
    }
};

  const handleDischarge =
  async () => {

    if (!selectedPatient)
      return;

    try {

      const items =
        selectedServices.map(
          (service) => ({
            category:
              service.category,

            name:
              service.name,

            qty: 1,

            rate:
              service.fee,

            amount:
              service.fee,

            discount: 0,

            remarks: "",
          })
        );

      const bill =
        await createIPDBill({
          admission_id:
            selectedPatient.id,

          patient_id:
            selectedPatient.patient_id,

          total_amount:
            subtotal,

          discount_amount:
            discountValue,

          net_amount:
            netTotal,

          paid_amount: 0,

          payment_mode:
            "Cash",

          remark: "",

          items,
        });

      await dischargePatient(
        selectedPatient.id
      );

      toast.success(
        "Patient discharged successfully"
      );

      window.open(
        `/api/ipd-billing/${bill.id}/print`,
        "_blank"
      );

      loadPatients();

      setSelectedPatient(
        null
      );

    } catch {

      toast.error(
        "Discharge failed"
      );
    }
};

const quickDischarge =
  async (
    patient:
    AdmissionPatient
  ) => {

    try {

      await dischargePatient(
        patient.id
      );

      toast.success(
        "Patient discharged"
      );

      loadPatients();

    } catch {

      toast.error(
        "Discharge failed"
      );
    }
};

  const statusClasses: Record<AdmissionPatient["status"], string> = {
    Admitted: "border-success text-success",
    Observation: "border-info text-info",
    Pending: "border-warning text-warning",
    Discharged: "border-muted text-muted-foreground",
  };

  return (
    <>
      <PageHeader title="IPD Patients" description="Inpatient list with quick billing and discharge workflow.">
        <Button size="sm" className="bg-primary text-primary-foreground">
          New Admission
        </Button>
      </PageHeader>

      <div className="rounded-2xl bg-card border border-border shadow-soft">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, UHID, mobile…"
              className="pl-9"
            />
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
                <th className="text-left px-4 py-2 font-medium">Diagnosis</th>
                <th className="text-left px-4 py-2 font-medium">Advance</th>
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

                  <td className="px-4 py-2 text-xs text-muted-foreground max-w-[180px] truncate">
                    {patient.diagnosis}
                  </td>

                  <td className="px-4 py-2">
                    <div className="font-medium">{inr(patient.advancePayment)}</div>
                    <div className="text-xs text-muted-foreground">Paid</div>
                  </td>

                  <td className="px-4 py-2">
                    <Badge variant="outline" className={statusClasses[patient.status]}>
                      {patient.status}
                    </Badge>
                  </td>

                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openBillingDialog(patient)}>
                        <ReceiptText className="mr-1.5 h-3.5 w-3.5" />
                        Billing
                      </Button>

                      {patient.status !== "Discharged" && (
                        <Button size="sm" variant="secondary" onClick={() => quickDischarge(patient)}>
                          <UserRoundCheck className="mr-1.5 h-3.5 w-3.5" />
                          Discharge
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedPatient && (
            <>
              <DialogHeader>
                <DialogTitle>Billing & Discharge</DialogTitle>
                <DialogDescription>
                  Review patient details, choose services, apply discount, and complete the discharge.
                </DialogDescription>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Patient</div>
                      <div className="text-lg font-semibold">{selectedPatient.name}</div>
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
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Select Services
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  {billingServices.map((service) => {
                    const isChecked = selectedServiceIds.includes(service.id);

                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleService(service.id)}
                        className={[
                          "flex items-center justify-between rounded-xl border p-3 text-left transition-colors",
                          isChecked ? "border-primary bg-primary/5" : "border-border bg-card",
                        ].join(" ")}
                      >
                        <div>
                          <div className="text-sm font-medium">{service.name}</div>
                          <div className="text-xs text-muted-foreground">{service.category}</div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-medium">{inr(service.fee)}</div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {isChecked ? "Selected" : "Add"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border p-3">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
                      Discount (%)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={discountPercent}
                      onChange={(event) => setDiscountPercent(Number(event.target.value) || 0)}
                    />
                  </div>

                  <div className="rounded-xl border border-border p-3 bg-muted/20">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Net Amount</div>
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
                    <span>{inr(Math.max(netTotal - selectedPatient.advancePayment, 0))}</span>
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

                <Button type="button" onClick={handleDischarge}>
                  <CalendarClock className="mr-1.5 h-4 w-4" />
                  Create Bill & Discharge
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}