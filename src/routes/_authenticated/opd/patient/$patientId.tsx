import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { opdApi } from "@/lib/opd-api";
import { inr } from "@/lib/format";
import { ArrowLeft, UserRound, ReceiptText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/opd/patient/$patientId")({
  component: PatientDetailPage,
});

function PatientDetailPage() {
  const { patientId } = Route.useParams();

  const [patient, setPatient] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [patientData, visitData, billData] = await Promise.all([
          opdApi.getPatient(patientId),
          opdApi.listVisits(),
          opdApi.listBills(),
        ]);

        const patientVisits = (visitData || []).filter(
          (visit: any) => String(visit.patient_id) === String(patientId),
        );

        const patientBills = (billData || []).filter(
          (bill: any) => String(bill.patient_id) === String(patientId),
        );

        const fullBills = await Promise.all(
          patientBills.map(async (bill: any) => {
            try {
              return await opdApi.getBill(bill.id);
            } catch {
              return bill;
            }
          }),
        );

        setPatient(patientData);
        setVisits(patientVisits);
        setBills(fullBills);
      } catch (error) {
        console.error("Patient detail load failed:", error);
        setPatient(null);
        setVisits([]);
        setBills([]);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [patientId]);

  const sortedBills = useMemo(
    () => [...bills].sort((a, b) => Number(b.id) - Number(a.id)),
    [bills],
  );

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading patient details...</div>;
  }

  if (!patient) {
    return (
      <div className="p-6">
        <PageHeader title="Patient not found" description="No record for this patient." />
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link to="/opd/patients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title={patient.name} description="Patient details and billing history">
        <Button asChild variant="outline" size="sm">
          <Link to="/opd/patients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_2fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Patient</p>
              <h3 className="text-xl font-semibold">{patient.name}</h3>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted/40 p-3"><div className="text-muted-foreground">UHID</div><div className="font-medium">{patient.uhid ?? "—"}</div></div>
            <div className="rounded-lg bg-muted/40 p-3"><div className="text-muted-foreground">OPD No</div><div className="font-medium">{patient.opdNo ?? "—"}</div></div>
            <div className="rounded-lg bg-muted/40 p-3"><div className="text-muted-foreground">Mobile</div><div className="font-medium">{patient.mobile ?? "—"}</div></div>
            <div className="rounded-lg bg-muted/40 p-3"><div className="text-muted-foreground">Gender</div><div className="font-medium">{patient.gender ?? "—"}</div></div>
            <div className="rounded-lg bg-muted/40 p-3"><div className="text-muted-foreground">DOB</div><div className="font-medium">{patient.dob ?? "—"}</div></div>
            <div className="rounded-lg bg-muted/40 p-3"><div className="text-muted-foreground">Blood Group</div><div className="font-medium">{patient.bloodGroup ?? "—"}</div></div>
            <div className="rounded-lg bg-muted/40 p-3 col-span-2"><div className="text-muted-foreground">Address</div><div className="font-medium">{patient.address ?? "—"}</div></div>
            <div className="rounded-lg bg-muted/40 p-3"><div className="text-muted-foreground">Doctor</div><div className="font-medium">{patient.doctorId ?? "—"}</div></div>
            <div className="rounded-lg bg-muted/40 p-3"><div className="text-muted-foreground">Department</div><div className="font-medium">{patient.department ?? "—"}</div></div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
  <div className="flex items-center gap-2">
    <ReceiptText className="h-5 w-5 text-primary" />
    <h3 className="text-lg font-semibold">Visits & Bills</h3>
  </div>

  <div className="mt-4 space-y-5">
    <div className="rounded-xl border border-border p-4">
      <h4 className="font-medium mb-3">Visits</h4>

      {visits.length === 0 ? (
        <div className="text-sm text-muted-foreground">No visits found for this patient.</div>
      ) : (
        <div className="space-y-3">
          {visits
            .slice()
            .sort((a, b) => new Date(b.visit_date || 0).getTime() - new Date(a.visit_date || 0).getTime())
            .map((visit: any) => (
              <div key={visit.id} className="rounded-lg bg-muted/30 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">Visit #{visit.id}</span>
                  <span>{visit.visit_date ?? "—"}</span>
                </div>

                <div className="mt-2 text-muted-foreground">
                  Doctor: {visit.doctor_id ?? "—"} • Dept: {visit.department ?? "—"}
                </div>

                <div className="mt-1 text-muted-foreground">
                  Symptoms: {visit.symptoms ?? "—"}
                </div>

                <div className="mt-1 text-muted-foreground">
                  Notes: {visit.notes ?? "—"}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>

    <div className="rounded-xl border border-border p-4">
      <h4 className="font-medium mb-3">Bills</h4>

      {sortedBills.length === 0 ? (
        <div className="text-sm text-muted-foreground">No bills found for this patient.</div>
      ) : (
        <div className="space-y-4">
          {sortedBills.map((bill: any) => {
            const items = Array.isArray(bill.items) ? bill.items : [];

            return (
              <div key={bill.id} className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Bill #{bill.id}</div>
                  <Badge variant="outline" className="border-primary text-primary">
                    Active
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="rounded-md bg-background p-2">
                    <div className="text-muted-foreground">Total</div>
                    <div className="font-medium">{inr(Number(bill.total_amount ?? bill.net_amount ?? 0))}</div>
                  </div>

                  <div className="rounded-md bg-background p-2">
                    <div className="text-muted-foreground">Net</div>
                    <div className="font-medium">{inr(Number(bill.net_amount ?? 0))}</div>
                  </div>

                  <div className="rounded-md bg-background p-2">
                    <div className="text-muted-foreground">Paid</div>
                    <div className="font-medium">{inr(Number(bill.paid_amount ?? 0))}</div>
                  </div>

                  <div className="rounded-md bg-background p-2">
                    <div className="text-muted-foreground">Due</div>
                    <div className="font-medium">{inr(Number(bill.due_amount ?? 0))}</div>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="mt-4 overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left">Category</th>
                          <th className="px-3 py-2 text-left">Item</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                          <th className="px-3 py-2 text-right">Amt</th>
                          <th className="px-3 py-2 text-right">Disc</th>
                        </tr>
                      </thead>

                      <tbody>
                        {items.map((item: any, idx: number) => (
                          <tr key={`${bill.id}-${idx}`} className="border-t border-border">
                            <td className="px-3 py-2">{item.category ?? "—"}</td>
                            <td className="px-3 py-2">{item.name ?? "—"}</td>
                            <td className="px-3 py-2 text-right">{item.qty ?? 0}</td>
                            <td className="px-3 py-2 text-right">{inr(Number(item.amount ?? 0))}</td>
                            <td className="px-3 py-2 text-right">{inr(Number(item.discount ?? 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
</div>
      </div>
    </div>
  );
}