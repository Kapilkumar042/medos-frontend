import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { labTests, findPatient, type LabTest } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { inr, dateFmt } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/lab/booking")({ component: Page });

function Page() {
  const cols: Column<LabTest>[] = [
    { key: "id", header: "ID", accessor: (r) => r.id, cell: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "patient", header: "Patient", accessor: (r) => findPatient(r.patientId)?.name ?? "" },
    { key: "test", header: "Test", accessor: (r) => r.test, sortable: true },
    { key: "category", header: "Category", accessor: (r) => r.category },
    { key: "date", header: "Booked", accessor: (r) => r.bookedOn, cell: (r) => dateFmt(r.bookedOn) },
    { key: "price", header: "Price", accessor: (r) => r.price, cell: (r) => inr(r.price) },
    { key: "status", header: "Status", accessor: (r) => r.status, cell: (r) => (
      <Badge variant="outline" className={
        r.status === "Completed" ? "border-success text-success" :
        r.status === "Processing" ? "border-info text-info" :
        r.status === "Sample Collected" ? "border-warning text-warning" : ""
      }>{r.status}</Badge>
    )},
  ];
  return (
    <>
      <PageHeader title="Lab Test Booking" description="Track all booked laboratory tests." />
      <DataTable data={labTests} columns={cols} searchKeys={["test", "category", "status"]} exportFileName="lab-tests" />
    </>
  );
}
