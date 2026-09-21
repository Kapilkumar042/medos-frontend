import { createFileRoute } from "@tanstack/react-router";
import { CatalogManager, type CatalogField } from "@/components/master/CatalogManager";
export const Route = createFileRoute("/_authenticated/master/radiology-tests")({ component: Page });
const fields: CatalogField[] = [
  { key: "code", label: "Test Code", placeholder: "XR-CH" },
  { key: "name", label: "Test Name", required: true, placeholder: "X-Ray Chest PA" },
  {
    key: "modality",
    label: "Modality",
    type: "select",
    options: ["X-Ray", "MRI", "CT", "USG", "Mammography", "PET-CT", "Fluoroscopy"],
  },
  { key: "body_part", label: "Body Part", placeholder: "Chest / Brain / Abdomen" },
  { key: "reportTime", label: "Report Time", placeholder: "1 hr" },
  { key: "price", label: "Price (₹)", type: "number", required: true },
];
function Page() {
  return (
    <CatalogManager
      kind="radiology"
      title="Radiology Tests"
      description="Master catalog of imaging investigations."
      fields={fields}
      tableColumns={["code", "name", "modality", "body_part", "reportTime", "price"]}
      priceField="price"
      fileBase="radiology-tests"
    />
  );
}
