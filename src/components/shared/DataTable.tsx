import { useMemo, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  Download,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell?: (row: T) => ReactNode;
  accessor?: (row: T) => string | number;
  className?: string;
  sortable?: boolean;
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  pageSize?: number;
  toolbar?: ReactNode;
  onRowClick?: (row: T) => void;
  exportFileName?: string;
  emptyMessage?: string;
  initialSort?: { key: string; dir: "asc" | "desc" };
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  initialSort,
  searchKeys,
  pageSize = 10,
  toolbar,
  onRowClick,
  exportFileName = "export",
  emptyMessage = "No records found",
}: Props<T>) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null,);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let rows = data;
    if (q && searchKeys) {
      const t = q.toLowerCase();
      rows = rows.filter((r) => searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(t)));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.accessor) {
        rows = [...rows].sort((a, b) => {
          const av = col.accessor!(a);
          const bv = col.accessor!(b);
          if (av < bv) return sort.dir === "asc" ? -1 : 1;
          if (av > bv) return sort.dir === "asc" ? 1 : -1;
          return 0;
        });
      }
    }
    return rows;
  }, [data, q, sort, columns, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice(page * pageSize, page * pageSize + pageSize);

  const exportCSV = () => {
    const headers = columns.map((c) => c.header).join(",");
    const rows = filtered.map((r) =>
      columns
        .map((c) => {
          const v = c.accessor ? c.accessor(r) : (r as any)[c.key];
          return `"${String(v ?? "").replace(/"/g, '""')}"`;
        })
        .join(","),
    );
    const blob = new Blob([headers + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
      <div className="p-3 md:p-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between border-b border-border">
        {searchKeys && (
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="Search…"
              className="pl-9 h-9 bg-muted/50 border-transparent"
            />
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {toolbar}
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "text-left text-[13px] font-bold uppercase tracking-wider text-foreground px-4 py-3",
                    c.className,
                  )}
                >
                  {c.sortable && c.accessor ? (
                    <button
                      onClick={() =>
                        setSort((s) =>
                          s?.key === c.key
                            ? s.dir === "asc"
                              ? { key: c.key, dir: "desc" }
                              : null
                            : { key: c.key, dir: "asc" },
                        )
                      }
                      className="inline-flex text-foreground  items-center gap-1 hover:text-muted-foreground"
                    >
                      {c.header}
                      {sort?.key === c.key ? (
                        sort.dir === "asc" ? (
                          <ChevronUp className="h-3 w-3 " />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40 " />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {pageRows.map((r) => (
              <tr
                key={String(r.id)}
                onClick={() => onRowClick?.(r)}
                className={cn(
                  "border-t border-border transition-colors",
                  onRowClick && "cursor-pointer hover:bg-muted/40",
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                    {c.cell ? c.cell(r) : c.accessor ? c.accessor(r) : (r as any)[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 flex items-center justify-between border-t border-border text-xs text-muted-foreground">
        <div>
          Showing {filtered.length === 0 ? 0 : page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
