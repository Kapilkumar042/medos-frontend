import { createFileRoute } from "@tanstack/react-router";
import { CatalogManager, type CatalogField } from "@/components/master/CatalogManager";

export const Route = createFileRoute("/_authenticated/master/departments")({ component: Page });

const fields: CatalogField[] = [
  { key: "code", label: "Dept Code", required: true, placeholder: "CARD" },
  { key: "name", label: "Department Name", required: true, placeholder: "Cardiology" },
  { key: "head", label: "Head of Department", placeholder: "Dr. Aarav Mehta" },
  { key: "location", label: "Location", placeholder: "Block A - 2nd Floor" },
  { key: "phone", label: "Contact Phone" },
  { key: "description", label: "Description" },
];

function Page() {
  return (
    <CatalogManager
      kind="department"
      title="Departments"
      description="Hospital departments, heads and locations."
      fields={fields}
      tableColumns={["code", "name", "head", "location", "phone"]}
      fileBase="departments"
    />
  );
}
