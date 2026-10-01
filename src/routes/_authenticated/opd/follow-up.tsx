import { createFileRoute } from "@tanstack/react-router";
import {
  useMemo,
  useRef,
  useState,
} from "react";
import * as XLSX from "xlsx";
import { format, isBefore, startOfDay } from "date-fns";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  FileDown,
  Upload,
  Plus,
  MoreVertical,
  Search,
  RotateCcw,
  Trash2,
  PhoneCall,
  CalendarDays,
  ClipboardList,
  Stethoscope,
  FlaskConical,
  UserRound,
  Clock3,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Archive,
  Eye,
  MessageSquare,
} from "lucide-react";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  useFollowUpStore,
  FOLLOWUP_STATUSES,
  MAX_FOLLOWUPS,
  type FollowUpStatus,
  type FollowUpPatient,
  type FollowUpType,
  type InvestigationStatus,
  type CallOutcome,
} from "@/store/followUpStore";

export const Route = createFileRoute(
  "/_authenticated/opd/follow-up",
)({
  head: () => ({
    meta: [
      {
        title: "Follow Up — MedOS",
      },
      {
        name: "description",
        content:
          "Hospital follow-up management",
      },
    ],
  }),

  component: FollowUpPage,
});

const statusColor: Record<
  FollowUpStatus,
  string
> = {
  Pending:
    "bg-muted text-muted-foreground border-border",

  Scheduled:
    "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",

  Confirmed:
    "bg-primary/10 text-primary border-primary/30",

  "Checked In":
    "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30",

  "In Consultation":
    "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",

  Completed:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",

  Missed:
    "bg-destructive/10 text-destructive border-destructive/30",

  Cancelled:
    "bg-muted text-muted-foreground border-border",

  Rescheduled:
    "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",

  "Not Reachable":
    "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30",

  "Call Back":
    "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",

  "Not Interested":
    "bg-destructive/10 text-destructive border-destructive/30",
};

const followUpTypeLabel: Record<
  FollowUpType,
  string
> = {
  OPD_REVIEW: "OPD Review",
  INVESTIGATION_REVIEW:
    "Report Review",
  POST_PROCEDURE:
    "Post-Procedure",
};

const followUpTypeIcon: Record<
  FollowUpType,
  React.ReactNode
> = {
  OPD_REVIEW: (
    <Stethoscope className="h-4 w-4" />
  ),

  INVESTIGATION_REVIEW: (
    <FlaskConical className="h-4 w-4" />
  ),

  POST_PROCEDURE: (
    <ClipboardList className="h-4 w-4" />
  ),
};

const investigationStatuses: InvestigationStatus[] =
  [
    "Not Required",
    "Pending",
    "Report Available",
    "Reviewed",
  ];

const callOutcomes: CallOutcome[] = [
  "Answered",
  "No Answer",
  "Busy",
  "Wrong Number",
  "Patient Requested Callback",
  "Confirmed Visit",
  "Cancelled",
  "Not Interested",
];

function isOverdue(nextDate?: string) {
  if (!nextDate) {
    return false;
  }

  const today = startOfDay(new Date());

  const date = startOfDay(
    new Date(nextDate),
  );

  return (
    isBefore(date, today)
  );
}

function formatDate(date?: string) {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return format(
    parsed,
    "dd MMM yyyy",
  );
}

function FollowUpPage() {
  const {
    items,
    add,
    bulkAdd,
    record,
    addCall,
    revive,
    archive,
    remove,
  } = useFollowUpStore();

  const [tab, setTab] = useState<
    "active" | "overdue" | "completed" | "missed" | "archived"
  >("active");

  const [q, setQ] =
    useState("");

  const [selected, setSelected] =
    useState<string[]>([]);

  const [statusDialog, setStatusDialog] =
    useState<{
      ids: string[];
      status: FollowUpStatus;
    } | null>(null);

  const [addOpen, setAddOpen] =
    useState(false);

  const [history, setHistory] =
    useState<FollowUpPatient | null>(
      null,
    );

  const [callPatient, setCallPatient] =
    useState<FollowUpPatient | null>(
      null,
    );

  const [details, setDetails] =
    useState<FollowUpPatient | null>(
      null,
    );

  const [result, setResult] =
    useState("");

  const [date, setDate] =
    useState<Date | undefined>();

  const [investigationStatus, setInvestigationStatus] =
    useState<InvestigationStatus>(
      "Not Required",
    );

  const [investigationName, setInvestigationName] =
    useState("");

  const [investigationOrderId, setInvestigationOrderId] =
    useState("");

  const [currentComplaint, setCurrentComplaint] =
    useState("");

  const [diagnosis, setDiagnosis] =
    useState("");

  const [doctorNotes, setDoctorNotes] =
    useState("");

  const [treatmentPlan, setTreatmentPlan] =
    useState("");

  const [callOutcome, setCallOutcome] =
    useState<CallOutcome>(
      "Answered",
    );

  const [callNotes, setCallNotes] =
    useState("");

  const [nextCallDate, setNextCallDate] =
    useState<Date | undefined>();

  const [np, setNp] = useState({
    patientId: "",
    uhid: "",
    encounterId: "",

    name: "",
    phone: "",
    age: "",

    doctorName: "",
    departmentName: "",

    followUpType:
      "OPD_REVIEW" as FollowUpType,

    query: "",

    nextDate: "",

    investigationStatus:
      "Not Required" as InvestigationStatus,

    investigationName: "",
    investigationOrderId: "",

    procedureName: "",
    procedureDate: "",
    dischargeDate: "",
  });

  const fileRef =
    useRef<HTMLInputElement>(null);

  const activeItems =
    items.filter(
      (x) => !x.archived,
    );

  const overdueItems =
    activeItems.filter((x) =>
      isOverdue(x.nextDate),
    );

  const completedItems =
    activeItems.filter(
      (x) =>
        x.status === "Completed",
    );

  const missedItems =
    activeItems.filter(
      (x) =>
        x.status === "Missed",
    );

  const archivedItems =
    items.filter(
      (x) => x.archived,
    );

  const rows = useMemo(() => {
    const search =
      q.trim().toLowerCase();

    let source: FollowUpPatient[];

    switch (tab) {
      case "overdue":
        source = overdueItems;
        break;

      case "completed":
        source = completedItems;
        break;

      case "missed":
        source = missedItems;
        break;

      case "archived":
        source = archivedItems;
        break;

      default:
        source = activeItems;
    }

    if (!search) {
      return source;
    }

    return source.filter(
      (x) =>
        x.name
          .toLowerCase()
          .includes(search) ||
        x.phone.includes(search) ||
        x.uhid
          ?.toLowerCase()
          .includes(search) ||
        x.doctorName
          ?.toLowerCase()
          .includes(search) ||
        x.departmentName
          ?.toLowerCase()
          .includes(search),
    );
  }, [
    items,
    q,
    tab,
    overdueItems,
    completedItems,
    missedItems,
    archivedItems,
    activeItems,
  ]);

  const allChecked =
    rows.length > 0 &&
    rows.every((r) =>
      selected.includes(r.id),
    );

  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter(
            (x) => x !== id,
          )
        : [...current, id],
    );
  };

  const resetStatusDialog = () => {
    setResult("");
    setDate(undefined);

    setInvestigationStatus(
      "Not Required",
    );

    setInvestigationName("");
    setInvestigationOrderId("");

    setCurrentComplaint("");
    setDiagnosis("");
    setDoctorNotes("");
    setTreatmentPlan("");
  };

  const openStatus = (
    ids: string[],
    status: FollowUpStatus,
  ) => {
    if (!ids.length) {
      toast.error(
        "Select at least one patient",
      );
      return;
    }

    resetStatusDialog();

    setStatusDialog({
      ids,
      status,
    });
  };

  const saveStatus = () => {
    if (!statusDialog) {
      return;
    }

    if (!result.trim()) {
      toast.error(
        "Enter follow-up result",
      );
      return;
    }

    const moved = record(
      statusDialog.ids,
      {
        status:
          statusDialog.status,

        result: result.trim(),

        nextDate: date
          ? format(
              date,
              "yyyy-MM-dd",
            )
          : undefined,

        currentComplaint:
          currentComplaint.trim() ||
          undefined,

        diagnosis:
          diagnosis.trim() ||
          undefined,

        doctorNotes:
          doctorNotes.trim() ||
          undefined,

        treatmentPlan:
          treatmentPlan.trim() ||
          undefined,

        investigationStatus,

        investigationName:
          investigationName.trim() ||
          undefined,

        investigationOrderId:
          investigationOrderId.trim() ||
          undefined,

        createdBy:
          "Current User",
      },
    );

    toast.success(
      `Follow-up saved${
        moved
          ? `, ${moved} patient(s) archived after ${MAX_FOLLOWUPS} follow-ups`
          : ""
      }`,
    );

    setStatusDialog(null);
    setSelected([]);
    resetStatusDialog();
  };

  const openCall = (
    patient: FollowUpPatient,
  ) => {
    setCallPatient(patient);
    setCallOutcome("Answered");
    setCallNotes("");
    setNextCallDate(undefined);
  };

  const saveCall = () => {
    if (!callPatient) {
      return;
    }

    if (!callNotes.trim()) {
      toast.error(
        "Enter call notes",
      );
      return;
    }

    addCall(
      callPatient.id,
      {
        outcome: callOutcome,
        notes: callNotes.trim(),
        calledBy:
          "Current User",
        nextCallAt:
          nextCallDate
            ? nextCallDate.toISOString()
            : undefined,
      },
    );

    if (
      callOutcome ===
      "Confirmed Visit"
    ) {
      toast.success(
        "Patient visit confirmed",
      );
    } else {
      toast.success(
        "Call history saved",
      );
    }

    setCallPatient(null);
  };

  const resetNewPatient = () => {
    setNp({
      patientId: "",
      uhid: "",
      encounterId: "",

      name: "",
      phone: "",
      age: "",

      doctorName: "",
      departmentName: "",

      followUpType:
        "OPD_REVIEW",

      query: "",

      nextDate: "",

      investigationStatus:
        "Not Required",

      investigationName: "",
      investigationOrderId: "",

      procedureName: "",
      procedureDate: "",
      dischargeDate: "",
    });
  };

  const saveNew = () => {
    if (!np.name.trim()) {
      toast.error(
        "Patient name is required",
      );
      return;
    }

    if (!np.phone.trim()) {
      toast.error(
        "Phone number is required",
      );
      return;
    }

    if (
      np.followUpType ===
        "INVESTIGATION_REVIEW" &&
      !np.investigationName.trim()
    ) {
      toast.error(
        "Investigation name is required",
      );
      return;
    }

    add({
      patientId:
        np.patientId.trim() ||
        undefined,

      uhid:
        np.uhid.trim() ||
        undefined,

      encounterId:
        np.encounterId.trim() ||
        undefined,

      name:
        np.name.trim(),

      phone:
        np.phone.trim(),

      age:
        Number(np.age) ||
        undefined,

      doctorName:
        np.doctorName.trim() ||
        undefined,

      departmentName:
        np.departmentName.trim() ||
        undefined,

      followUpType:
        np.followUpType,

      query:
        np.query.trim(),

      nextDate:
        np.nextDate ||
        undefined,

      investigationStatus:
        np.investigationStatus,

      investigationName:
        np.investigationName.trim() ||
        undefined,

      investigationOrderId:
        np.investigationOrderId.trim() ||
        undefined,

      procedureName:
        np.procedureName.trim() ||
        undefined,

      procedureDate:
        np.procedureDate ||
        undefined,

      dischargeDate:
        np.dischargeDate ||
        undefined,

      createdBy:
        "Current User",
    });

    resetNewPatient();
    setAddOpen(false);

    toast.success(
      "Follow-up patient added",
    );
  };

  const downloadTemplate = () => {
    const rows = [
      [
        "Patient ID",
        "UHID",
        "Encounter ID",
        "Patient Name",
        "Phone",
        "Age",
        "Doctor",
        "Department",
        "Follow-Up Type",
        "Patient Query",
        "Next Date",
        "Investigation Status",
        "Investigation Name",
        "Investigation Order ID",
        "Procedure Name",
        "Procedure Date",
        "Discharge Date",
      ],

      [
        "P001",
        "UH202600123",
        "OPD-2026-001",
        "Ravi Kumar",
        "9876543210",
        35,
        "Dr. Sharma",
        "Orthopedics",
        "OPD_REVIEW",
        "Knee pain review",
        "2026-10-15",
        "Not Required",
        "",
        "",
        "",
        "",
        "",
      ],

      [
        "P002",
        "UH202600124",
        "OPD-2026-002",
        "Amit Singh",
        "9876543211",
        42,
        "Dr. Gupta",
        "Radiology",
        "INVESTIGATION_REVIEW",
        "MRI report review",
        "2026-10-18",
        "Pending",
        "MRI Knee",
        "MRI-2026-1001",
        "",
        "",
        "",
      ],

      [
        "P003",
        "UH202600125",
        "IPD-2026-003",
        "Neha Jain",
        "9876543212",
        29,
        "Dr. Khan",
        "General Surgery",
        "POST_PROCEDURE",
        "Post surgery wound review",
        "2026-10-10",
        "Not Required",
        "",
        "",
        "Appendectomy",
        "2026-10-01",
        "2026-10-04",
      ],
    ];

    const ws =
      XLSX.utils.aoa_to_sheet(
        rows,
      );

    const wb =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Follow Up",
    );

    XLSX.writeFile(
      wb,
      "hims-follow-up-template.xlsx",
    );
  };

  const handleImport = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const wb =
        XLSX.read(
          await file.arrayBuffer(),
          {
            type: "array",
          },
        );

      const sheet =
        wb.Sheets[
          wb.SheetNames[0]
        ];

      if (!sheet) {
        toast.error(
          "Excel sheet not found",
        );
        return;
      }

      const data =
        XLSX.utils.sheet_to_json<
          Record<string, unknown>
        >(sheet, {
          defval: "",
        });

      const get = (
        row: Record<
          string,
          unknown
        >,
        ...keys: string[]
      ) => {
        const key =
          Object.keys(row).find(
            (x) =>
              keys.includes(
                x
                  .trim()
                  .toLowerCase(),
              ),
          );

        return key
          ? String(
              row[key],
            ).trim()
          : "";
      };

      const normalizeType = (
        value: string,
      ): FollowUpType => {
        const v =
          value
            .toLowerCase()
            .replaceAll(
              " ",
              "_",
            );

        if (
          v ===
            "investigation_review" ||
          v ===
            "report_review"
        ) {
          return "INVESTIGATION_REVIEW";
        }

        if (
          v ===
            "post_procedure" ||
          v ===
            "post-surgery"
        ) {
          return "POST_PROCEDURE";
        }

        return "OPD_REVIEW";
      };

      const parsed =
        data
          .map((row) => {
            const type =
              normalizeType(
                get(
                  row,
                  "follow-up type",
                  "followup type",
                  "type",
                ),
              );

            const investigation =
              get(
                row,
                "investigation status",
              ) as InvestigationStatus;

            return {
              patientId:
                get(
                  row,
                  "patient id",
                ) || undefined,

              uhid:
                get(
                  row,
                  "uhid",
                ) || undefined,

              encounterId:
                get(
                  row,
                  "encounter id",
                ) || undefined,

              name:
                get(
                  row,
                  "patient name",
                  "name",
                ),

              phone:
                get(
                  row,
                  "phone",
                  "mobile",
                ),

              age:
                Number(
                  get(
                    row,
                    "age",
                  ),
                ) ||
                undefined,

              doctorName:
                get(
                  row,
                  "doctor",
                  "doctor name",
                ) || undefined,

              departmentName:
                get(
                  row,
                  "department",
                  "department name",
                ) || undefined,

              followUpType:
                type,

              query:
                get(
                  row,
                  "patient query",
                  "query",
                  "reason",
                ),

              nextDate:
                get(
                  row,
                  "next date",
                  "follow-up date",
                ) || undefined,

              investigationStatus:
                investigationStatuses.includes(
                  investigation,
                )
                  ? investigation
                  : "Not Required",

              investigationName:
                get(
                  row,
                  "investigation name",
                ) || undefined,

              investigationOrderId:
                get(
                  row,
                  "investigation order id",
                  "order id",
                ) || undefined,

              procedureName:
                get(
                  row,
                  "procedure name",
                ) || undefined,

              procedureDate:
                get(
                  row,
                  "procedure date",
                ) || undefined,

              dischargeDate:
                get(
                  row,
                  "discharge date",
                ) || undefined,
            };
          })
          .filter(
            (x) => x.name,
          );

      if (!parsed.length) {
        toast.error(
          "No valid patient rows found",
        );
        return;
      }

      const count =
        bulkAdd(parsed);

      toast.success(
        `Imported ${count} patient(s)`,
      );
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to read Excel file",
      );
    } finally {
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  };

  const selectAll = (
    checked: boolean,
  ) => {
    setSelected(
      checked
        ? rows.map((x) => x.id)
        : [],
    );
  };

  const selectedRows =
    rows.filter((x) =>
      selected.includes(x.id),
    );

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <PageHeader
        title="Follow Up"
        description={`Manage OPD, investigation and post-procedure follow-ups. Maximum ${MAX_FOLLOWUPS} follow-ups per patient.`}
      >
        <Button
          variant="outline"
          onClick={
            downloadTemplate
          }
          className="gap-1.5"
        >
          <FileDown className="h-4 w-4" />
          Template
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            fileRef.current?.click()
          }
          className="gap-1.5"
        >
          <Upload className="h-4 w-4" />
          Import Excel
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={
            handleImport
          }
        />

        <Button
          onClick={() =>
            setAddOpen(true)
          }
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Follow-Up
        </Button>
      </PageHeader>

      {/* SUMMARY */}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

        <SummaryCard
          icon={
            <ClipboardList className="h-5 w-5" />
          }
          label="Active"
          value={
            activeItems.length
          }
        />

        <SummaryCard
          icon={
            <AlertCircle className="h-5 w-5" />
          }
          label="Overdue"
          value={
            overdueItems.length
          }
        />

        <SummaryCard
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
          label="Completed"
          value={
            completedItems.length
          }
        />

        <SummaryCard
          icon={
            <XCircle className="h-5 w-5" />
          }
          label="Missed"
          value={
            missedItems.length
          }
        />

        <SummaryCard
          icon={
            <Archive className="h-5 w-5" />
          }
          label="Archived"
          value={
            archivedItems.length
          }
        />

      </div>

      {/* MAIN */}

      <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">

        {/* FILTER BAR */}

        <div className="p-3 md:p-4 flex flex-col gap-3 border-b border-border">

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">

            <Tabs
              value={tab}
              onValueChange={(value) => {
                setTab(
                  value as typeof tab,
                );

                setSelected([]);
              }}
            >
              <TabsList className="flex-wrap h-auto">

                <TabsTrigger value="active">
                  Active (
                  {activeItems.length}
                  )
                </TabsTrigger>

                <TabsTrigger value="overdue">
                  Overdue (
                  {overdueItems.length}
                  )
                </TabsTrigger>

                <TabsTrigger value="completed">
                  Completed (
                  {completedItems.length}
                  )
                </TabsTrigger>

                <TabsTrigger value="missed">
                  Missed (
                  {missedItems.length}
                  )
                </TabsTrigger>

                <TabsTrigger value="archived">
                  Archived (
                  {archivedItems.length}
                  )
                </TabsTrigger>

              </TabsList>
            </Tabs>

            <div className="flex flex-wrap gap-2">

              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                <Input
                  value={q}
                  onChange={(e) =>
                    setQ(
                      e.target.value,
                    )
                  }
                  placeholder="Search name / UHID / phone"
                  className="pl-9 h-9"
                />
              </div>

              {tab !== "archived" && (
                <Select
                  value=""
                  onValueChange={(
                    value,
                  ) =>
                    openStatus(
                      selected,
                      value as FollowUpStatus,
                    )
                  }
                >
                  <SelectTrigger className="w-52 h-9">
                    <SelectValue
                      placeholder={`Bulk status (${selected.length})`}
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {FOLLOWUP_STATUSES.map(
                      (status) => (
                        <SelectItem
                          key={status}
                          value={status}
                        >
                          {status}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}

              {tab ===
                "archived" &&
                selected.length >
                  0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      revive(
                        selected,
                      );

                      setSelected(
                        [],
                      );

                      toast.success(
                        "Moved back to active follow-ups",
                      );
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-1.5" />
                    Restore
                  </Button>
                )}

            </div>
          </div>

        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-muted/40">

              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">

                <th className="px-4 py-3 w-10">
                  <Checkbox
                    checked={
                      allChecked
                    }
                    onCheckedChange={(
                      checked,
                    ) =>
                      selectAll(
                        Boolean(
                          checked,
                        ),
                      )
                    }
                  />
                </th>

                <th className="px-4 py-3">
                  Patient
                </th>

                <th className="px-4 py-3">
                  UHID
                </th>

                <th className="px-4 py-3">
                  Doctor
                </th>

                <th className="px-4 py-3">
                  Department
                </th>

                <th className="px-4 py-3">
                  Type
                </th>

                <th className="px-4 py-3">
                  Follow-ups
                </th>

                <th className="px-4 py-3">
                  Next Date
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-4 py-3 text-right">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {rows.length ===
                0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-14 text-muted-foreground"
                  >
                    No follow-up patients found.
                  </td>
                </tr>
              )}

              {rows.map((patient) => {

                const overdue =
                  isOverdue(
                    patient.nextDate,
                  );

                return (
                  <tr
                    key={
                      patient.id
                    }
                    className={cn(
                      "border-t border-border",
                      selected.includes(
                        patient.id,
                      ) &&
                        "bg-primary/5",
                    )}
                  >

                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.includes(
                          patient.id,
                        )}
                        onCheckedChange={() =>
                          toggle(
                            patient.id,
                          )
                        }
                      />
                    </td>

                    <td className="px-4 py-3">

                      <div className="font-medium">
                        {patient.name}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {patient.phone}
                      </div>

                    </td>

                    <td className="px-4 py-3">
                      {patient.uhid ||
                        "—"}
                    </td>

                    <td className="px-4 py-3">
                      {patient.doctorName ||
                        "—"}
                    </td>

                    <td className="px-4 py-3">
                      {patient.departmentName ||
                        "—"}
                    </td>

                    <td className="px-4 py-3">

                      {patient.followUpType ? (
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          {followUpTypeIcon[
                            patient.followUpType
                          ]}

                          {
                            followUpTypeLabel[
                              patient.followUpType
                            ]
                          }
                        </div>
                      ) : (
                        "—"
                      )}

                    </td>

                    <td className="px-4 py-3">

                      <span
                        className={cn(
                          patient.logs
                            .length >=
                            MAX_FOLLOWUPS &&
                            "text-destructive font-medium",
                        )}
                      >
                        {
                          patient.logs
                            .length
                        }{" "}
                        /{" "}
                        {
                          MAX_FOLLOWUPS
                        }
                      </span>

                    </td>

                    <td className="px-4 py-3">

                      <div className="flex items-center gap-1.5 whitespace-nowrap">

                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />

                        {formatDate(
                          patient.nextDate,
                        )}

                      </div>

                      {overdue && (
                        <Badge
                          variant="destructive"
                          className="mt-1"
                        >
                          Overdue
                        </Badge>
                      )}

                    </td>

                    <td className="px-4 py-3">

                      <Badge
                        variant="outline"
                        className={
                          statusColor[
                            patient.status
                          ]
                        }
                      >
                        {patient.status}
                      </Badge>

                      {patient.archived && (
                        <Badge
                          variant="outline"
                          className="ml-1"
                        >
                          Archived
                        </Badge>
                      )}

                    </td>

                    <td className="px-4 py-3 text-right">

                      <DropdownMenu>

                        <DropdownMenuTrigger
                          asChild
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">

                          <DropdownMenuItem
                            onClick={() =>
                              setDetails(
                                patient,
                              )
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              setHistory(
                                patient,
                              )
                            }
                          >
                            <Clock3 className="h-4 w-4 mr-2" />
                            Follow-Up History
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              openCall(
                                patient,
                              )
                            }
                          >
                            <PhoneCall className="h-4 w-4 mr-2" />
                            Call Patient
                          </DropdownMenuItem>

                          {!patient.archived && (
                            <DropdownMenuItem
                              onClick={() =>
                                openStatus(
                                  [
                                    patient.id,
                                  ],
                                  "Scheduled",
                                )
                              }
                            >
                              <CalendarDays className="h-4 w-4 mr-2" />
                              Schedule Follow-Up
                            </DropdownMenuItem>
                          )}

                          {patient.archived && (
                            <DropdownMenuItem
                              onClick={() => {
                                revive([
                                  patient.id,
                                ]);

                                toast.success(
                                  "Follow-up restored",
                                );
                              }}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restore
                            </DropdownMenuItem>
                          )}

                          {!patient.archived && (
                            <DropdownMenuItem
                              onClick={() => {
                                archive([
                                  patient.id,
                                ]);

                                toast.success(
                                  "Follow-up archived",
                                );
                              }}
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              remove([
                                patient.id,
                              ]);

                              toast.success(
                                "Patient removed",
                              );
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>

                        </DropdownMenuContent>

                      </DropdownMenu>

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>

        {/* SELECTION FOOTER */}

        {selectedRows.length >
          0 && (
          <div className="border-t border-border bg-muted/30 px-4 py-3 flex items-center justify-between">

            <span className="text-sm">
              {selectedRows.length} patient(s) selected
            </span>

            <div className="flex gap-2">

              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setSelected([])
                }
              >
                Clear
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  archive(
                    selected,
                  );

                  setSelected([]);

                  toast.success(
                    "Selected follow-ups archived",
                  );
                }}
              >
                <Archive className="h-4 w-4 mr-1.5" />
                Archive
              </Button>

            </div>

          </div>
        )}

      </div>

      {/* CREATE FOLLOW-UP */}

      <Dialog
        open={addOpen}
        onOpenChange={
          setAddOpen
        }
      >

        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">

          <DialogHeader>
            <DialogTitle>
              Add Follow-Up
            </DialogTitle>

            <DialogDescription>
              Create a clinical follow-up for an existing or new patient.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">

            {/* PATIENT */}

            <section>

              <SectionTitle
                icon={
                  <UserRound className="h-4 w-4" />
                }
                title="Patient Information"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">

                <Field
                  label="Patient ID"
                  value={
                    np.patientId
                  }
                  onChange={(value) =>
                    setNp({
                      ...np,
                      patientId:
                        value,
                    })
                  }
                />

                <Field
                  label="UHID"
                  value={
                    np.uhid
                  }
                  onChange={(value) =>
                    setNp({
                      ...np,
                      uhid: value,
                    })
                  }
                  placeholder="UH202600123"
                />

                <Field
                  label="Encounter ID"
                  value={
                    np.encounterId
                  }
                  onChange={(value) =>
                    setNp({
                      ...np,
                      encounterId:
                        value,
                    })
                  }
                  placeholder="OPD-2026-001"
                />

                <div className="md:col-span-2">
                  <Field
                    label="Patient Name *"
                    value={
                      np.name
                    }
                    onChange={(value) =>
                      setNp({
                        ...np,
                        name: value,
                      })
                    }
                  />
                </div>

                <Field
                  label="Phone *"
                  value={
                    np.phone
                  }
                  onChange={(value) =>
                    setNp({
                      ...np,
                      phone: value,
                    })
                  }
                />

                <Field
                  label="Age"
                  type="number"
                  value={
                    np.age
                  }
                  onChange={(value) =>
                    setNp({
                      ...np,
                      age: value,
                    })
                  }
                />

              </div>

            </section>

            {/* CLINICAL */}

            <section>

              <SectionTitle
                icon={
                  <Stethoscope className="h-4 w-4" />
                }
                title="Clinical Follow-Up"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">

                <div>
                  <Label className="text-xs">
                    Department
                  </Label>

                  <Input
                    className="mt-1"
                    value={
                      np.departmentName
                    }
                    onChange={(e) =>
                      setNp({
                        ...np,
                        departmentName:
                          e.target.value,
                      })
                    }
                    placeholder="Orthopedics"
                  />
                </div>

                <div>
                  <Label className="text-xs">
                    Doctor
                  </Label>

                  <Input
                    className="mt-1"
                    value={
                      np.doctorName
                    }
                    onChange={(e) =>
                      setNp({
                        ...np,
                        doctorName:
                          e.target.value,
                      })
                    }
                    placeholder="Dr. Sharma"
                  />
                </div>

                <div>
                  <Label className="text-xs">
                    Follow-Up Type *
                  </Label>

                  <Select
                    value={
                      np.followUpType
                    }
                    onValueChange={(
                      value,
                    ) =>
                      setNp({
                        ...np,
                        followUpType:
                          value as FollowUpType,
                      })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>

                      <SelectItem value="OPD_REVIEW">
                        Doctor / OPD Review
                      </SelectItem>

                      <SelectItem value="INVESTIGATION_REVIEW">
                        Investigation / Report Review
                      </SelectItem>

                      <SelectItem value="POST_PROCEDURE">
                        Post-Procedure / Discharge
                      </SelectItem>

                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">
                    Follow-Up Date
                  </Label>

                  <Input
                    className="mt-1"
                    type="date"
                    value={
                      np.nextDate
                    }
                    onChange={(e) =>
                      setNp({
                        ...np,
                        nextDate:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-xs">
                    Reason / Patient Query
                  </Label>

                  <Textarea
                    className="mt-1"
                    rows={3}
                    value={
                      np.query
                    }
                    onChange={(e) =>
                      setNp({
                        ...np,
                        query:
                          e.target.value,
                      })
                    }
                    placeholder="Why does the patient need follow-up?"
                  />
                </div>

              </div>

            </section>

            {/* INVESTIGATION */}

            {np.followUpType ===
              "INVESTIGATION_REVIEW" && (
              <section>

                <SectionTitle
                  icon={
                    <FlaskConical className="h-4 w-4" />
                  }
                  title="Investigation Details"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">

                  <div>
                    <Label className="text-xs">
                      Investigation Status
                    </Label>

                    <Select
                      value={
                        np.investigationStatus
                      }
                      onValueChange={(
                        value,
                      ) =>
                        setNp({
                          ...np,
                          investigationStatus:
                            value as InvestigationStatus,
                        })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {investigationStatuses.map(
                          (status) => (
                            <SelectItem
                              key={status}
                              value={status}
                            >
                              {status}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <Field
                    label="Investigation Name *"
                    value={
                      np.investigationName
                    }
                    onChange={(value) =>
                      setNp({
                        ...np,
                        investigationName:
                          value,
                      })
                    }
                    placeholder="MRI Knee"
                  />

                  <Field
                    label="Order ID"
                    value={
                      np.investigationOrderId
                    }
                    onChange={(value) =>
                      setNp({
                        ...np,
                        investigationOrderId:
                          value,
                      })
                    }
                    placeholder="MRI-2026-001"
                  />

                </div>

              </section>
            )}

            {/* PROCEDURE */}

            {np.followUpType ===
              "POST_PROCEDURE" && (
              <section>

                <SectionTitle
                  icon={
                    <ClipboardList className="h-4 w-4" />
                  }
                  title="Procedure / Discharge"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">

                  <Field
                    label="Procedure / Surgery"
                    value={
                      np.procedureName
                    }
                    onChange={(value) =>
                      setNp({
                        ...np,
                        procedureName:
                          value,
                      })
                    }
                    placeholder="Appendectomy"
                  />

                  <div>
                    <Label className="text-xs">
                      Procedure Date
                    </Label>

                    <Input
                      className="mt-1"
                      type="date"
                      value={
                        np.procedureDate
                      }
                      onChange={(e) =>
                        setNp({
                          ...np,
                          procedureDate:
                            e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label className="text-xs">
                      Discharge Date
                    </Label>

                    <Input
                      className="mt-1"
                      type="date"
                      value={
                        np.dischargeDate
                      }
                      onChange={(e) =>
                        setNp({
                          ...np,
                          dischargeDate:
                            e.target.value,
                        })
                      }
                    />
                  </div>

                </div>

              </section>
            )}

          </div>

          <DialogFooter>

            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(
                  false,
                );

                resetNewPatient();
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={saveNew}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create Follow-Up
            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

      {/* STATUS / CLINICAL UPDATE */}

      <Dialog
        open={
          !!statusDialog
        }
        onOpenChange={(open) => {
          if (!open) {
            setStatusDialog(
              null,
            );

            resetStatusDialog();
          }
        }}
      >

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

          <DialogHeader>

            <DialogTitle>
              Update Follow-Up
            </DialogTitle>

            <DialogDescription>
              {
                statusDialog?.ids
                  .length
              }{" "}
              patient(s) selected
            </DialogDescription>

          </DialogHeader>

          <div className="space-y-5">

            <div>
              <Label className="text-xs">
                Status
              </Label>

              <Select
                value={
                  statusDialog?.status
                }
                onValueChange={(
                  value,
                ) =>
                  statusDialog &&
                  setStatusDialog({
                    ...statusDialog,
                    status:
                      value as FollowUpStatus,
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {FOLLOWUP_STATUSES.map(
                    (status) => (
                      <SelectItem
                        key={status}
                        value={status}
                      >
                        {status}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">
                Follow-Up Result *
              </Label>

              <Textarea
                className="mt-1"
                rows={3}
                value={
                  result
                }
                onChange={(e) =>
                  setResult(
                    e.target.value,
                  )
                }
                placeholder="What happened during the follow-up?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              <div>
                <Label className="text-xs">
                  Current Complaint
                </Label>

                <Textarea
                  className="mt-1"
                  rows={2}
                  value={
                    currentComplaint
                  }
                  onChange={(e) =>
                    setCurrentComplaint(
                      e.target.value,
                    )
                  }
                />
              </div>

              <div>
                <Label className="text-xs">
                  Diagnosis
                </Label>

                <Textarea
                  className="mt-1"
                  rows={2}
                  value={
                    diagnosis
                  }
                  onChange={(e) =>
                    setDiagnosis(
                      e.target.value,
                    )
                  }
                />
              </div>

              <div>
                <Label className="text-xs">
                  Doctor Notes
                </Label>

                <Textarea
                  className="mt-1"
                  rows={2}
                  value={
                    doctorNotes
                  }
                  onChange={(e) =>
                    setDoctorNotes(
                      e.target.value,
                    )
                  }
                />
              </div>

              <div>
                <Label className="text-xs">
                  Treatment Plan
                </Label>

                <Textarea
                  className="mt-1"
                  rows={2}
                  value={
                    treatmentPlan
                  }
                  onChange={(e) =>
                    setTreatmentPlan(
                      e.target.value,
                    )
                  }
                />
              </div>

            </div>

            <div className="border-t pt-4">

              <div className="flex items-center gap-2 mb-3">

                <FlaskConical className="h-4 w-4" />

                <span className="text-sm font-semibold">
                  Investigation
                </span>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                <div>
                  <Label className="text-xs">
                    Report Status
                  </Label>

                  <Select
                    value={
                      investigationStatus
                    }
                    onValueChange={(
                      value,
                    ) =>
                      setInvestigationStatus(
                        value as InvestigationStatus,
                      )
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {investigationStatuses.map(
                        (status) => (
                          <SelectItem
                            key={status}
                            value={status}
                          >
                            {status}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <Field
                  label="Investigation"
                  value={
                    investigationName
                  }
                  onChange={
                    setInvestigationName
                  }
                />

                <Field
                  label="Order ID"
                  value={
                    investigationOrderId
                  }
                  onChange={
                    setInvestigationOrderId
                  }
                />

              </div>

            </div>

            <div className="border-t pt-4">

              <Label className="text-xs">
                Next Follow-Up Date
              </Label>

              <div className="mt-2 flex justify-center rounded-lg border">

                <Calendar
                  mode="single"
                  selected={
                    date
                  }
                  onSelect={
                    setDate
                  }
                  className="p-3 pointer-events-auto"
                />

              </div>

              {date && (
                <p className="text-sm text-center mt-2 text-muted-foreground">
                  Next follow-up:{" "}
                  <strong>
                    {format(
                      date,
                      "dd MMM yyyy",
                    )}
                  </strong>
                </p>
              )}

            </div>

          </div>

          <DialogFooter>

            <Button
              variant="outline"
              onClick={() =>
                setStatusDialog(
                  null,
                )
              }
            >
              Cancel
            </Button>

            <Button
              onClick={
                saveStatus
              }
            >
              Save Follow-Up
            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

      {/* CALL DIALOG */}

      <Dialog
        open={
          !!callPatient
        }
        onOpenChange={(open) =>
          !open &&
          setCallPatient(
            null,
          )
        }
      >

        <DialogContent className="max-w-lg">

          <DialogHeader>

            <DialogTitle>
              <div className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5" />
                Call Patient
              </div>
            </DialogTitle>

            <DialogDescription>
              {callPatient?.name}
              {" · "}
              {callPatient?.phone}
            </DialogDescription>

          </DialogHeader>

          <div className="space-y-4">

            <div>
              <Label className="text-xs">
                Call Outcome
              </Label>

              <Select
                value={
                  callOutcome
                }
                onValueChange={(
                  value,
                ) =>
                  setCallOutcome(
                    value as CallOutcome,
                  )
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {callOutcomes.map(
                    (outcome) => (
                      <SelectItem
                        key={outcome}
                        value={outcome}
                      >
                        {outcome}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">
                Call Notes *
              </Label>

              <Textarea
                className="mt-1"
                rows={4}
                value={
                  callNotes
                }
                onChange={(e) =>
                  setCallNotes(
                    e.target.value,
                  )
                }
                placeholder="Enter conversation notes..."
              />
            </div>

            <div>
              <Label className="text-xs">
                Next Call Date
              </Label>

              <div className="mt-1 flex justify-center rounded-lg border">

                <Calendar
                  mode="single"
                  selected={
                    nextCallDate
                  }
                  onSelect={
                    setNextCallDate
                  }
                  className="p-3 pointer-events-auto"
                />

              </div>
            </div>

          </div>

          <DialogFooter>

            <Button
              variant="outline"
              onClick={() =>
                setCallPatient(
                  null,
                )
              }
            >
              Cancel
            </Button>

            <Button
              onClick={
                saveCall
              }
            >
              <PhoneCall className="h-4 w-4 mr-1.5" />
              Save Call
            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

      {/* HISTORY */}

      <Dialog
        open={
          !!history
        }
        onOpenChange={(open) =>
          !open &&
          setHistory(null)
        }
      >

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

          <DialogHeader>

            <DialogTitle>
              {history?.name} — Follow-Up History
            </DialogTitle>

            <DialogDescription>
              {history?.uhid ||
                "No UHID"}
              {" · "}
              {history?.phone}
            </DialogDescription>

          </DialogHeader>

          <div className="space-y-4">

            {!history?.logs.length && (
              <div className="text-center py-10 text-muted-foreground">
                No clinical follow-ups yet.
              </div>
            )}

            {history?.logs.map(
              (log) => (
                <div
                  key={
                    log.id
                  }
                  className="rounded-xl border border-border p-4"
                >

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">

                    <div>

                      <div className="font-semibold">
                        Follow-Up #
                        {
                          log.followUpNumber
                        }
                      </div>

                      <div className="text-xs text-muted-foreground mt-1">
                        {format(
                          new Date(
                            log.at,
                          ),
                          "dd MMM yyyy, hh:mm a",
                        )}
                      </div>

                    </div>

                    <div className="flex gap-2">

                      <Badge variant="outline">
                        {
                          followUpTypeLabel[
                            log.type
                          ]
                        }
                      </Badge>

                      <Badge
                        variant="outline"
                        className={
                          statusColor[
                            log.status
                          ]
                        }
                      >
                        {
                          log.status
                        }
                      </Badge>

                    </div>

                  </div>

                  <div className="mt-3 space-y-2 text-sm">

                    <HistoryRow
                      label="Result"
                      value={
                        log.result
                      }
                    />

                    <HistoryRow
                      label="Complaint"
                      value={
                        log.currentComplaint
                      }
                    />

                    <HistoryRow
                      label="Diagnosis"
                      value={
                        log.diagnosis
                      }
                    />

                    <HistoryRow
                      label="Doctor Notes"
                      value={
                        log.doctorNotes
                      }
                    />

                    <HistoryRow
                      label="Treatment Plan"
                      value={
                        log.treatmentPlan
                      }
                    />

                    {log.investigationName && (
                      <HistoryRow
                        label="Investigation"
                        value={`${log.investigationName}${
                          log.investigationStatus
                            ? ` · ${log.investigationStatus}`
                            : ""
                        }`}
                      />
                    )}

                    {log.nextDate && (
                      <HistoryRow
                        label="Next Follow-Up"
                        value={formatDate(
                          log.nextDate,
                        )}
                      />
                    )}

                  </div>

                </div>
              ),
            )}

          </div>

        </DialogContent>

      </Dialog>

      {/* DETAILS */}

      <Dialog
        open={
          !!details
        }
        onOpenChange={(open) =>
          !open &&
          setDetails(null)
        }
      >

        <DialogContent className="max-w-2xl">

          <DialogHeader>

            <DialogTitle>
              Patient Follow-Up Details
            </DialogTitle>

            <DialogDescription>
              {details?.name}
            </DialogDescription>

          </DialogHeader>

          {details && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              <InfoCard
                label="UHID"
                value={
                  details.uhid
                }
              />

              <InfoCard
                label="Encounter"
                value={
                  details.encounterId
                }
              />

              <InfoCard
                label="Phone"
                value={
                  details.phone
                }
              />

              <InfoCard
                label="Age"
                value={
                  details.age?.toString()
                }
              />

              <InfoCard
                label="Doctor"
                value={
                  details.doctorName
                }
              />

              <InfoCard
                label="Department"
                value={
                  details.departmentName
                }
              />

              <InfoCard
                label="Follow-Up Type"
                value={
                  details.followUpType
                    ? followUpTypeLabel[
                        details.followUpType
                      ]
                    : undefined
                }
              />

              <InfoCard
                label="Status"
                value={
                  details.status
                }
              />

              <InfoCard
                label="Next Date"
                value={formatDate(
                  details.nextDate,
                )}
              />

              <InfoCard
                label="Follow-Up Count"
                value={`${details.logs.length} / ${MAX_FOLLOWUPS}`}
              />

              <div className="md:col-span-2 rounded-lg border p-3">

                <div className="text-xs text-muted-foreground">
                  Reason / Query
                </div>

                <div className="mt-1 text-sm">
                  {details.query ||
                    "—"}
                </div>

              </div>

              {details.investigationName && (
                <div className="md:col-span-2 rounded-lg border p-3">

                  <div className="text-xs text-muted-foreground">
                    Investigation
                  </div>

                  <div className="mt-1 text-sm font-medium">
                    {
                      details.investigationName
                    }
                  </div>

                  <div className="text-xs text-muted-foreground mt-1">
                    Status:{" "}
                    {
                      details.investigationStatus
                    }
                  </div>

                </div>
              )}

              {details.procedureName && (
                <div className="md:col-span-2 rounded-lg border p-3">

                  <div className="text-xs text-muted-foreground">
                    Procedure
                  </div>

                  <div className="mt-1 text-sm font-medium">
                    {
                      details.procedureName
                    }
                  </div>

                  <div className="text-xs text-muted-foreground mt-1">
                    Procedure:{" "}
                    {formatDate(
                      details.procedureDate,
                    )}
                    {" · "}
                    Discharge:{" "}
                    {formatDate(
                      details.dischargeDate,
                    )}
                  </div>

                </div>
              )}

              <div className="md:col-span-2 flex gap-2 pt-2">

                <Button
                  variant="outline"
                  onClick={() => {
                    setDetails(
                      null,
                    );

                    if (
                      details
                    ) {
                      openCall(
                        details,
                      );
                    }
                  }}
                >
                  <PhoneCall className="h-4 w-4 mr-1.5" />
                  Call Patient
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setDetails(
                      null,
                    );

                    setHistory(
                      details,
                    );
                  }}
                >
                  <Clock3 className="h-4 w-4 mr-1.5" />
                  View History
                </Button>

              </div>

            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDetails(null)
              }
            >
              Close
            </Button>
          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>
  );
}

/* ---------------- HELPERS ---------------- */

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">

      <div className="flex items-center justify-between">

        <div className="text-muted-foreground">
          {icon}
        </div>

        <div className="text-2xl font-bold">
          {value}
        </div>

      </div>

      <div className="text-xs text-muted-foreground mt-2">
        {label}
      </div>

    </div>
  );
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 font-semibold text-sm">
      {icon}
      {title}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <Label className="text-xs">
        {label}
      </Label>

      <Input
        className="mt-1"
        type={type}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value,
          )
        }
        placeholder={
          placeholder
        }
      />
    </div>
  );
}

function HistoryRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <span className="font-medium">
        {label}:
      </span>{" "}
      <span className="text-muted-foreground">
        {value}
      </span>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-lg border p-3">

      <div className="text-xs text-muted-foreground">
        {label}
      </div>

      <div className="text-sm font-medium mt-1">
        {value || "—"}
      </div>

    </div>
  );
}