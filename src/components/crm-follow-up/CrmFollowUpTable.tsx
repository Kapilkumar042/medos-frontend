import {
  Archive,
  CalendarDays,
  Clock3,
  Eye,
  MoreVertical,
  PhoneCall,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type CrmFollowUpItem,
  type CrmLeadItem,
  useCrmFollowUpStore,
} from "@/store/crmFollowUpStore";

interface CrmFollowUpTableProps {
  source: "INTERNAL" | "EXTERNAL" | "LEAD";
  rows?: Array<CrmFollowUpItem | CrmLeadItem>;
  selectedIds?: string[];
  onToggleSelect?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  onUpdateFollowUp?: (item: CrmFollowUpItem | CrmLeadItem) => void;
  onViewDetails?: (item: CrmFollowUpItem | CrmLeadItem) => void;
  onViewHistory?: (item: CrmFollowUpItem | CrmLeadItem) => void;
  onCallPatient?: (item: CrmFollowUpItem | CrmLeadItem) => void;
  onArchive?: (ids: string[]) => void;
  onRestore?: (ids: string[]) => void;
  onDelete?: (id: string) => void;
}

const statusClassMap: Record<string, string> = {
  Pending: "bg-muted text-muted-foreground",
  Scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  Confirmed: "bg-primary/10 text-primary",
  Completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Missed: "bg-destructive/10 text-destructive",
  Cancelled: "bg-muted text-muted-foreground",
  Qualified: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  Converted: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Closed: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
};

export function CrmFollowUpTable({
  source,
  rows,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onUpdateFollowUp,
  onViewDetails,
  onViewHistory,
  onCallPatient,
  onArchive,
  onRestore,
  onDelete,
}: CrmFollowUpTableProps) {
  const followUps = useCrmFollowUpStore((state) => state.followUps);
  const leads = useCrmFollowUpStore((state) => state.leads);

  const data = rows ?? (source === "LEAD" ? leads : followUps.filter((item) => item.sourceType === source));
  const allChecked = data.length > 0 && data.every((row) => selectedIds.includes(row.id));

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 w-10">
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={(checked) => onSelectAll?.(checked === true)}
                />
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">UHID</th>
              <th className="px-4 py-3">{source === "LEAD" ? "Source" : "Doctor"}</th>
              <th className="px-4 py-3">{source === "LEAD" ? "Assigned To" : "Department"}</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Follow-ups</th>
              <th className="px-4 py-3">Next Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                  No records found for this section.
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const isLead = "leadName" in row;
                const name = isLead ? row.leadName : row.patientName;
                const phone = row.phone;
                const sourceLabel = isLead ? row.source : row.doctorName ?? "—";
                const extraLabel = isLead ? row.assignedTo ?? "—" : row.department ?? "—";
                const uhid = isLead ? "—" : row.uhid ?? "—";
                const type = isLead || !row.followUpType
                  ? "—"
                  : row.followUpType === "OPD_REVIEW"
                    ? "OPD Review"
                    : row.followUpType === "INVESTIGATION_REVIEW"
                      ? "Report Review"
                      : "Post-Procedure";
                const followUpCount = isLead ? "—" : `${row.logs?.length ?? 0} / 3`;
                const isArchived = !isLead && Boolean(row.archived);
                const overdue = !isLead && !isArchived && Boolean(row.nextDate) && new Date(`${row.nextDate}T00:00:00`) < new Date(new Date().setHours(0, 0, 0, 0));
                const nextDate = row.nextDate
                  ? new Date(row.nextDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";
                const status = row.status;

                return (
                  <tr
                    key={row.id}
                    className={`border-t border-border/80 ${selectedIds.includes(row.id) ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onCheckedChange={(checked) => onToggleSelect?.(row.id, checked === true)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{phone}</td>
                    <td className="px-4 py-3">{uhid}</td>
                    <td className="px-4 py-3">{sourceLabel}</td>
                    <td className="px-4 py-3">{extraLabel}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{type}</td>
                    <td className="px-4 py-3">{followUpCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        {nextDate}
                      </div>
                      {overdue && <Badge variant="destructive" className="mt-1">Overdue</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={statusClassMap[status] ?? "bg-muted text-muted-foreground"}>{status}</Badge>
                      {isArchived && <Badge variant="outline" className="ml-1">Archived</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails?.(row)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => onViewHistory?.(row)}>
                            <Clock3 className="h-4 w-4 mr-2" />
                            Follow-Up History
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => onCallPatient?.(row)}>
                            <PhoneCall className="h-4 w-4 mr-2" />
                            Call Patient
                          </DropdownMenuItem>

                          {!isLead && !isArchived && onUpdateFollowUp && (row.logs?.length ?? 0) < 3 && (
                            <DropdownMenuItem onClick={() => onUpdateFollowUp(row)}>
                              <CalendarDays className="h-4 w-4 mr-2" />
                              Schedule Follow-Up
                            </DropdownMenuItem>
                          )}

                          {!isLead && isArchived && onRestore && (
                            <DropdownMenuItem onClick={() => onRestore([row.id])}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restore
                            </DropdownMenuItem>
                          )}

                          {!isLead && !isArchived && onArchive && (
                            <DropdownMenuItem onClick={() => onArchive([row.id])}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}

                          {!isLead && onDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onDelete(row.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
