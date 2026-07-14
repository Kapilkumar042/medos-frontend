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

function Page() {
  const { patients, loading, loadPatients, updatePatient, removePatient } = useOpdStore();
  const { doctors } = useDoctors();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(true);

  useEffect(() => {
    loadPatients();
    opdApi
      .listVisits()
      .then(setVisits)
      .catch(console.error)
      .finally(() => setVisitsLoading(false));
  }, []);

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

  const onMakeBilling = (p: OpdPatient) => {
    navigate({ to: "/opd/registration", search: { edit: p.id, billing: 1 } as never });
  };

  const onEdit = (p: OpdPatient) => {
    navigate({ to: "/opd/registration", search: { edit: p.id } as never });
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
                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono text-xs">{p.uhid ?? "—"}</td>
                      <td className="px-4 py-2">
                        <div className="font-medium">{p.name}</div>
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
                      <td className="px-4 py-2">{p.netAmount ? inr(p.netAmount) : "—"}</td>
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
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => onMakeBilling(p)}>
                            <Receipt className="h-3.5 w-3.5 mr-1" /> Billing
                          </Button>
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
