import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { appointments, findDoctor, findPatient, type Appointment } from "@/lib/mock-data";
import { Plus, CalendarDays } from "lucide-react";
import { dateFmt } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/opd/appointments")({
  component: Page,
});

function Page() {
  const cols: Column<Appointment>[] = [
    { key: "token", header: "Token", accessor: (r) => r.token, sortable: true,
      cell: (r) => <span className="font-mono text-xs">#{r.token}</span> },
    { key: "patient", header: "Patient", accessor: (r) => findPatient(r.patientId)?.name ?? "",
      cell: (r) => {
        const p = findPatient(r.patientId);
        return <div><div className="font-medium">{p?.name}</div><div className="text-xs text-muted-foreground">{p?.uhid}</div></div>;
      }},
    { key: "doctor", header: "Doctor", accessor: (r) => findDoctor(r.doctorId)?.name ?? "" },
    { key: "department", header: "Department", accessor: (r) => r.department },
    { key: "date", header: "Date", accessor: (r) => r.date, sortable: true, cell: (r) => dateFmt(r.date) },
    { key: "time", header: "Time", accessor: (r) => r.time },
    { key: "type", header: "Type", accessor: (r) => r.type,
      cell: (r) => <Badge variant="outline">{r.type}</Badge> },
    { key: "status", header: "Status", accessor: (r) => r.status,
      cell: (r) => (
        <Badge variant="outline" className={
          r.status === "Completed" ? "border-success text-success" :
          r.status === "In Consultation" ? "border-info text-info" :
          r.status === "Cancelled" ? "border-destructive text-destructive" :
          "border-warning text-warning"
        }>{r.status}</Badge>
      )},
  ];

  return (
    <>
      <PageHeader title="Appointments" description="Schedule, manage, and track patient appointments.">
        <Button variant="outline" size="sm" asChild>
          <Link to="/opd/queue"><CalendarDays className="h-4 w-4 mr-1.5" /> View Queue</Link>
        </Button>
        <Button size="sm" className="gradient-blue text-white border-0 hover:opacity-90">
          <Plus className="h-4 w-4 mr-1.5" /> Book Appointment
        </Button>
      </PageHeader>

      <DataTable
        data={appointments}
        columns={cols}
        searchKeys={["id", "department", "status"]}
        exportFileName="appointments"
      />
    </>
  );
}
