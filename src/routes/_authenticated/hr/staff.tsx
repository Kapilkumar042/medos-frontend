import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { staff, type StaffMember } from "@/lib/mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { inr, dateFmt } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/hr/staff")({ component: Page });

function Page() {
  const cols: Column<StaffMember>[] = [
    { key: "name", header: "Name", accessor: (r) => r.name, sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8"><AvatarFallback className="text-xs gradient-blue text-white">{r.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
          <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.contact}</div></div>
        </div>
      )},
    { key: "role", header: "Role", accessor: (r) => r.role },
    { key: "department", header: "Department", accessor: (r) => r.department },
    { key: "joined", header: "Joined", accessor: (r) => r.joined, cell: (r) => dateFmt(r.joined) },
    { key: "salary", header: "Salary", accessor: (r) => r.salary, sortable: true, cell: (r) => inr(r.salary) },
    { key: "status", header: "Status", accessor: (r) => r.status, cell: (r) => (
      <Badge variant="outline" className={
        r.status === "Active" ? "border-success text-success" :
        r.status === "On Leave" ? "border-warning text-warning" : "border-muted-foreground text-muted-foreground"
      }>{r.status}</Badge>
    )},
  ];
  return (
    <>
      <PageHeader title="Staff" description="Manage hospital staff records." />
      <DataTable data={staff} columns={cols} searchKeys={["name", "role", "department"]} exportFileName="staff" />
    </>
  );
}
