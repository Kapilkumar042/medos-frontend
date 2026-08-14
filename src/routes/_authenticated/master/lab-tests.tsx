import { createFileRoute } from "@tanstack/react-router";
import { CatalogManager, type CatalogField } from "@/components/master/CatalogManager";
export const Route = createFileRoute("/_authenticated/master/lab-tests")({ component: Page });
const fields: CatalogField[] = [
  { key: "code", label: "Test Code", required: true, placeholder: "CBC" },
  { key: "name", label: "Test Name", required: true, placeholder: "Complete Blood Count" },
  {
    key: "category",
    label: "Category",
    type: "select",
    options: [
      "Hematology",
      "Biochemistry",
      "Endocrinology",
      "Microbiology",
      "Serology",
      "Histopathology",
      "Urine",
      "Other",
    ],
  },
  { key: "sampleType", label: "Sample Type", placeholder: "Serum / EDTA Blood" },
  { key: "method", label: "Method", placeholder: "Automated" },
  { key: "referenceRange", label: "Reference Range" },
  { key: "reportTime", label: "Report Time", placeholder: "4 hrs" },
  { key: "price", label: "Price (₹)", type: "number", required: true },
];
function Page() {
  return (
    <CatalogManager
      kind="lab"
      title="Lab Tests"
      description="Master catalog of laboratory tests, sample types and pricing."
      fields={fields}
      tableColumns={["code", "name", "category", "sampleType", "reportTime", "price"]}
      priceField="price"
      fileBase="lab-tests"
    />
  );
}
