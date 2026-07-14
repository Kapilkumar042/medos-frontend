import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { medicines, type Medicine } from "@/lib/mock-data";
import { inr, dateFmt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pharmacy/inventory")({ component: Page });

function Page() {
  const cols: Column<Medicine>[] = [
    { key: "name", header: "Medicine", accessor: (r) => r.name, sortable: true,
      cell: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.brand}</div></div> },
    { key: "category", header: "Category", accessor: (r) => r.category },
    { key: "batch", header: "Batch", accessor: (r) => r.batch, cell: (r) => <span className="font-mono text-xs">{r.batch}</span> },
    { key: "expiry", header: "Expiry", accessor: (r) => r.expiry, sortable: true,
      cell: (r) => {
        const close = new Date(r.expiry).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 90;
        return <span className={close ? "text-warning" : ""}>{dateFmt(r.expiry)}{close && <AlertTriangle className="inline h-3 w-3 ml-1" />}</span>;
      }},
    { key: "stock", header: "Stock", accessor: (r) => r.stock, sortable: true,
      cell: (r) => <Badge variant="outline" className={r.stock < 50 ? "border-destructive text-destructive" : ""}>{r.stock} {r.unit}</Badge> },
    { key: "price", header: "Price", accessor: (r) => r.price, sortable: true, cell: (r) => inr(r.price) },
  ];
  return (
    <>
      <PageHeader title="Pharmacy Inventory" description="Track stock, batches, and expiry alerts.">
        <Button size="sm" className="gradient-blue text-white border-0"><Plus className="h-4 w-4 mr-1.5" /> Add Medicine</Button>
      </PageHeader>
      <DataTable data={medicines} columns={cols} searchKeys={["name", "brand", "batch"]} exportFileName="inventory" />
    </>
  );
}
