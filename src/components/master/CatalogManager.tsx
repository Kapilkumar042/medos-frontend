import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Pencil, Upload, FileDown, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { useCatalogStore, type CatalogItem, type CatalogKind } from "@/store/catalogStore";

export type FieldType = "text" | "number" | "select" | "date";

export interface CatalogField {
  key: keyof CatalogItem;
  label: string;
  type?: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

interface Props {
  kind: CatalogKind;
  title: string;
  description: string;
  fields: CatalogField[];
  tableColumns: (keyof CatalogItem)[];
  priceField?: keyof CatalogItem;
  fileBase: string;
}

export function CatalogManager({
  kind,
  title,
  description,
  fields,
  tableColumns,
  priceField,
  fileBase,
}: Props) {
  const items = useCatalogStore((s: any) => s.items[kind]);
  const loadCatalog = useCatalogStore((s) => s.loadCatalog);
  const { add, update, remove, importCatalog } = useCatalogStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCatalog(kind);
  }, [kind, loadCatalog]);

  const makeDefaults = (): Partial<CatalogItem> => {
    const d: Record<string, unknown> = { status: "Active" };
    fields.forEach((f) => {
      if (f.type === "number") d[f.key as string] = 0;
      else if (f.type === "select" && f.options?.length) d[f.key as string] = f.options[0];
      else d[f.key as string] = "";
    });
    return d as Partial<CatalogItem>;
  };

  const [form, setForm] = useState<Partial<CatalogItem>>(makeDefaults());

  const openAdd = () => {
    setEditingId(null);
    setForm(makeDefaults());
    setOpen(true);
  };
  const openEdit = (row: CatalogItem) => {
    setEditingId(row.id);
    setForm({ ...row });
    setOpen(true);
  };

  const submit = async () => {
    for (const f of fields) {
      if (f.required && !String(form[f.key] ?? "").trim()) {
        toast.error(`${f.label} is required`);
        return;
      }
    }

    const payload = {
      ...(form as CatalogItem),
      status: (form.status as "Active" | "Inactive") || "Active",
    };

    try {
      if (editingId) {
        await update(kind, editingId, payload);
        toast.success(`${title.replace(/s$/, "")} updated`);
      } else {
        const { id: _id, createdAt: _c, ...rest } = payload as CatalogItem;
        await add(kind, rest);
        toast.success(`${title.replace(/s$/, "")} added`);
      }
      setOpen(false);
    } catch (err) {
      toast.error("Save failed");
    }
  };

  const excelKeys = fields.map((f) => f.key as string);

  const downloadTemplate = () => {
    const example: Record<string, unknown> = {};
    fields.forEach((f) => {
      example[f.key as string] =
        f.type === "number" ? 0 : f.type === "select" ? (f.options?.[0] ?? "") : "";
    });
    const ws = XLSX.utils.aoa_to_sheet([excelKeys, excelKeys.map((k) => example[k])]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, `${fileBase}-template.xlsx`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

 try {
  const result = await importCatalog(kind, file);
  toast.success(result?.message ?? "Imported successfully");
} catch (err) {
  console.error("Import failed", err);
  toast.error("Failed to import file");
} finally {
  if (fileRef.current) fileRef.current.value = "";
}
  };

  const cols: Column<CatalogItem>[] = [
    ...tableColumns.map<Column<CatalogItem>>((k) => {
      const field = fields.find((f) => f.key === k);
      const label = field?.label ?? String(k);
      return {
        key: String(k),
        header: label,
        accessor: (r) => (r[k] as string | number) ?? "",
        sortable: true,
        cell:
          priceField === k
            ? (r) => (
                <span className="inline-flex items-center font-medium">
                  <IndianRupee className="h-3 w-3" />
                  {r[k] ?? 0}
                </span>
              )
            : undefined,
      };
    }),
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge variant={r.status === "Active" ? "default" : "secondary"}>{r.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(r)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive"
            onClick={async () => {
              await remove(kind, r.id);
              toast.success("Removed");
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description}>
        <Button variant="outline" onClick={downloadTemplate} className="gap-1.5">
          <FileDown className="h-4 w-4" /> Template
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-1.5">
          <Upload className="h-4 w-4" /> Import Excel
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleImport}
        />
        <Button onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add {title.replace(/s$/, "")}
        </Button>
      </PageHeader>

      <DataTable
        data={items}
        columns={cols}
        searchKeys={["name", "code", "category"] as (keyof CatalogItem)[]}
        exportFileName={fileBase}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? `Edit ${title.replace(/s$/, "")}` : `Add ${title.replace(/s$/, "")}`}
            </DialogTitle>
            <DialogDescription>Fill in the details below.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={String(f.key)}>
                <Label className="text-xs">
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </Label>
                <div className="mt-1">
                  {f.type === "select" ? (
                    <Select
                      value={String(form[f.key] ?? "")}
                      onValueChange={(v) => setForm((s: any) => ({ ...s, [f.key]: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {f.options?.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                      placeholder={f.placeholder}
                      value={String(form[f.key] ?? "")}
                      onChange={(e) =>
                        setForm((s: any) => ({
                          ...s,
                          [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              </div>
            ))}

            <div>
              <Label className="text-xs">Status</Label>
              <div className="mt-1">
                <Select
                  value={(form.status as string) ?? "Active"}
                  onValueChange={(v) =>
                    setForm((s: any) => ({ ...s, status: v as "Active" | "Inactive" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editingId ? "Update" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
