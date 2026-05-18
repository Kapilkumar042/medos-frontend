import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { invoices, findPatient, type Invoice } from "@/lib/mock-data";
import { inr, dateFmt } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/billing/opd")({ component: Page });

function Page() {
  const data = invoices.filter((i) => i.type === "OPD");
  const cols: Column<Invoice>[] = [
    { key: "id", header: "Invoice", accessor: (r) => r.id, cell: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "patient", header: "Patient", accessor: (r) => findPatient(r.patientId)?.name ?? "" },
    { key: "date", header: "Date", accessor: (r) => r.date, sortable: true, cell: (r) => dateFmt(r.date) },
    { key: "amount", header: "Amount", accessor: (r) => r.amount, sortable: true, cell: (r) => inr(r.amount) },
    { key: "paid", header: "Paid", accessor: (r) => r.paid, cell: (r) => inr(r.paid) },
    { key: "mode", header: "Mode", accessor: (r) => r.mode },
    { key: "status", header: "Status", accessor: (r) => r.status, cell: (r) => (
      <Badge variant="outline" className={
        r.status === "Paid" ? "border-success text-success" :
        r.status === "Pending" ? "border-destructive text-destructive" : "border-warning text-warning"
      }>{r.status}</Badge>
    )},
  ];
  return (
    <>
      <PageHeader title="OPD Billing" description="All OPD invoices and collection status." />
      <DataTable data={data} columns={cols} searchKeys={["id", "mode", "status"]} exportFileName="opd-billing" />
    </>
  );
}
