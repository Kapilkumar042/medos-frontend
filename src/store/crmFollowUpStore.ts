import { create } from "zustand";
import { persist } from "zustand/middleware";

export const CRM_FOLLOWUP_STATUSES = [
  "Pending",
  "Scheduled",
  "Confirmed",
  "Checked In",
  "In Consultation",
  "Completed",
  "Missed",
  "Cancelled",
  "Rescheduled",
  "Not Reachable",
  "Call Back",
  "Not Interested",
  "Converted",
  "Qualified",
  "Closed",
] as const;

export const CRM_FOLLOWUP_TYPES = [
  "OPD_REVIEW",
  "INVESTIGATION_REVIEW",
  "POST_PROCEDURE",
] as const;

export const CRM_INVESTIGATION_STATUSES = [
  "Not Required",
  "Pending",
  "Report Available",
  "Reviewed",
] as const;

export const CRM_CALL_OUTCOMES = [
  "Answered",
  "No Answer",
  "Busy",
  "Wrong Number",
  "Patient Requested Callback",
  "Confirmed Visit",
  "Cancelled",
  "Not Interested",
] as const;

export const CRM_MAX_FOLLOWUPS = 3;

export type CrmFollowUpStatus = (typeof CRM_FOLLOWUP_STATUSES)[number];
export type CrmSourceType = "INTERNAL" | "EXTERNAL" | "LEAD";
export type CrmFollowUpType = (typeof CRM_FOLLOWUP_TYPES)[number];
export type CrmInvestigationStatus = (typeof CRM_INVESTIGATION_STATUSES)[number];
export type CrmCallOutcome = (typeof CRM_CALL_OUTCOMES)[number];

export interface CrmFollowUpLog {
  id: string;
  at: string;
  status: CrmFollowUpStatus;
  result: string;
  followUpNumber: number;
  type?: CrmFollowUpType;
  nextDate?: string;
  currentComplaint?: string;
  diagnosis?: string;
  doctorNotes?: string;
  treatmentPlan?: string;
  investigationStatus?: CrmInvestigationStatus;
  investigationName?: string;
  investigationOrderId?: string;
  procedureName?: string;
  procedureDate?: string;
  dischargeDate?: string;
  createdBy?: string;
}

export interface CrmCallLog {
  id: string;
  calledAt: string;
  calledBy: string;
  outcome: CrmCallOutcome;
  notes: string;
  nextCallAt?: string;
}

export interface CrmFollowUpItem {
  id: string;
  patientName: string;
  phone: string;
  patientId?: string;
  uhid?: string;
  encounterId?: string;
  age?: number;
  sourceType: CrmSourceType;
  status: CrmFollowUpStatus;
  followUpType?: CrmFollowUpType;
  query?: string;
  nextDate?: string;
  doctorName?: string;
  department?: string;
  sourceLabel?: string;
  notes?: string;
  logs?: CrmFollowUpLog[];
  calls?: CrmCallLog[];
  investigationStatus?: CrmInvestigationStatus;
  investigationName?: string;
  investigationOrderId?: string;
  procedureName?: string;
  procedureDate?: string;
  dischargeDate?: string;
  archived?: boolean;
  createdAt: string;
}

export interface CrmLeadItem {
  id: string;
  leadName: string;
  phone: string;
  source: string;
  status: CrmFollowUpStatus;
  nextDate?: string;
  assignedTo?: string;
  notes?: string;
  query?: string;
  followUpType?: CrmFollowUpType;
  logs?: CrmFollowUpLog[];
  calls?: CrmCallLog[];
  archived?: boolean;
  converted?: boolean;
  createdAt: string;
}

interface CrmFollowUpStore {
  followUps: CrmFollowUpItem[];
  leads: CrmLeadItem[];
  addInternal: (item: Omit<CrmFollowUpItem, "id" | "createdAt" | "sourceType">) => void;
  addExternal: (item: Omit<CrmFollowUpItem, "id" | "createdAt" | "sourceType">) => void;
  addLead: (item: Omit<CrmLeadItem, "id" | "createdAt">) => void;
  updateStatus: (id: string, status: CrmFollowUpStatus, sourceType?: CrmSourceType) => void;
  recordFollowUp: (ids: string[], log: Omit<CrmFollowUpLog, "id" | "at" | "followUpNumber">, sourceType?: CrmSourceType) => void;
  addCall: (id: string, call: Omit<CrmCallLog, "id" | "calledAt">, sourceType?: CrmSourceType) => void;
  setArchived: (ids: string[], archived: boolean, sourceType?: CrmSourceType) => void;
  removeFollowUp: (id: string, sourceType?: CrmSourceType) => void;
}

const nowIso = () => new Date().toISOString();
const createId = (prefix: string) => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

const seedFollowUps: CrmFollowUpItem[] = [
  {
    id: "crm-1",
    patientName: "Aarav Sharma",
    phone: "9876543210",
    sourceType: "INTERNAL",
    status: "Scheduled",
    nextDate: "2026-10-09",
    doctorName: "Dr. Mehta",
    department: "Orthopedics",
    sourceLabel: "OPD registration",
    notes: "Review knee pain after therapy",
    archived: false,
    createdAt: nowIso(),
  },
  {
    id: "crm-2",
    patientName: "Neha Kapoor",
    phone: "9988776655",
    sourceType: "INTERNAL",
    status: "Pending",
    nextDate: "2026-10-11",
    doctorName: "Dr. Singh",
    department: "Cardiology",
    sourceLabel: "Post-discharge",
    notes: "Follow-up after ECG review",
    archived: false,
    createdAt: nowIso(),
  },
  {
    id: "crm-3",
    patientName: "Rohan Iyer",
    phone: "9654321098",
    sourceType: "EXTERNAL",
    status: "Confirmed",
    nextDate: "2026-10-12",
    doctorName: "Dr. Nair",
    department: "Neurology",
    sourceLabel: "Referral",
    notes: "External referral from partner clinic",
    archived: false,
    createdAt: nowIso(),
  },
  {
    id: "crm-4",
    patientName: "Sara Ali",
    phone: "9765432101",
    sourceType: "EXTERNAL",
    status: "Completed",
    nextDate: "2026-10-06",
    doctorName: "Dr. Reddy",
    department: "Dermatology",
    sourceLabel: "Excel import",
    notes: "Follow-up completed successfully",
    archived: false,
    createdAt: nowIso(),
  },
];

const seedLeads: CrmLeadItem[] = [
  {
    id: "lead-1",
    leadName: "Vikram Joshi",
    phone: "9811122233",
    source: "Instagram Ads",
    status: "Qualified",
    nextDate: "2026-10-10",
    assignedTo: "Marketing Team",
    notes: "Interested in cardiac check-up package",
    converted: false,
    createdAt: nowIso(),
  },
  {
    id: "lead-2",
    leadName: "Ritika Verma",
    phone: "9876123456",
    source: "Facebook Campaign",
    status: "Converted",
    nextDate: "2026-10-08",
    assignedTo: "Front desk",
    notes: "Converted to patient registration",
    converted: true,
    createdAt: nowIso(),
  },
  {
    id: "lead-3",
    leadName: "Anand Sethi",
    phone: "9988998899",
    source: "Google Ads",
    status: "Pending",
    nextDate: "2026-10-14",
    assignedTo: "CRM team",
    notes: "Needs counselling about diabetes package",
    converted: false,
    createdAt: nowIso(),
  },
];

export const useCrmFollowUpStore = create<CrmFollowUpStore>()(
  persist(
    (set) => ({
      followUps: seedFollowUps,
      leads: seedLeads,

      addInternal: (item) =>
        set((state) => ({
          followUps: [
            {
              ...item,
              id: createId("crm"),
              sourceType: "INTERNAL",
              createdAt: nowIso(),
            },
            ...state.followUps,
          ],
        })),

      addExternal: (item) =>
        set((state) => ({
          followUps: [
            {
              ...item,
              id: createId("crm"),
              sourceType: "EXTERNAL",
              createdAt: nowIso(),
            },
            ...state.followUps,
          ],
        })),

      addLead: (item) =>
        set((state) => ({
          leads: [
            {
              ...item,
              id: createId("lead"),
              createdAt: nowIso(),
            },
            ...state.leads,
          ],
        })),

      updateStatus: (id, status, sourceType) =>
        set((state) => ({
          followUps:
            sourceType === "LEAD"
              ? state.followUps
              : state.followUps.map((item) =>
                  item.id === id ? { ...item, status } : item,
                ),
          leads: sourceType === "LEAD"
            ? state.leads.map((lead) => (lead.id === id ? { ...lead, status } : lead))
            : state.leads,
        })),
      recordFollowUp: (ids, log, sourceType = "INTERNAL") =>
        set((state) => ({
          followUps: sourceType === "LEAD" ? state.followUps : state.followUps.map((item) =>
            item.sourceType === sourceType && ids.includes(item.id) && (item.logs?.length ?? 0) < CRM_MAX_FOLLOWUPS
              ? {
                  ...item,
                  status: log.status,
                  nextDate: log.nextDate,
                  notes: log.result,
                  followUpType: log.type ?? item.followUpType,
                  investigationStatus: log.investigationStatus ?? item.investigationStatus,
                  investigationName: log.investigationName ?? item.investigationName,
                  investigationOrderId: log.investigationOrderId ?? item.investigationOrderId,
                  procedureName: log.procedureName ?? item.procedureName,
                  procedureDate: log.procedureDate ?? item.procedureDate,
                  dischargeDate: log.dischargeDate ?? item.dischargeDate,
                  logs: [
                    ...(item.logs ?? []),
                    { ...log, followUpNumber: (item.logs?.length ?? 0) + 1, id: createId("crm-log"), at: nowIso() },
                  ],
                }
              : item,
          ),
          leads: sourceType === "LEAD" ? state.leads.map((item) =>
            ids.includes(item.id) && (item.logs?.length ?? 0) < CRM_MAX_FOLLOWUPS
              ? { ...item, status: log.status, nextDate: log.nextDate, notes: log.result, followUpType: log.type ?? item.followUpType, logs: [...(item.logs ?? []), { ...log, followUpNumber: (item.logs?.length ?? 0) + 1, id: createId("lead-log"), at: nowIso() }] }
              : item,
          ) : state.leads,
        })),
      addCall: (id, call, sourceType = "INTERNAL") =>
        set((state) => ({
          followUps: sourceType === "LEAD" ? state.followUps : state.followUps.map((item) =>
            item.sourceType === sourceType && item.id === id
              ? { ...item, calls: [...(item.calls ?? []), { ...call, id: createId("crm-call"), calledAt: nowIso() }] }
              : item,
          ),
          leads: sourceType === "LEAD" ? state.leads.map((item) => item.id === id ? { ...item, calls: [...(item.calls ?? []), { ...call, id: createId("lead-call"), calledAt: nowIso() }] } : item) : state.leads,
        })),
      setArchived: (ids, archived, sourceType = "INTERNAL") =>
        set((state) => ({
          followUps: sourceType === "LEAD" ? state.followUps : state.followUps.map((item) => item.sourceType === sourceType && ids.includes(item.id) ? { ...item, archived } : item),
          leads: sourceType === "LEAD" ? state.leads.map((item) => ids.includes(item.id) ? { ...item, archived } : item) : state.leads,
        })),
      removeFollowUp: (id, sourceType = "INTERNAL") =>
        set((state) => ({
          followUps: sourceType === "LEAD" ? state.followUps : state.followUps.filter((item) => item.sourceType !== sourceType || item.id !== id),
          leads: sourceType === "LEAD" ? state.leads.filter((item) => item.id !== id) : state.leads,
        })),
    }),
    {
      name: "crm-follow-up-store",
      merge: (persisted, current) => {
        const next = persisted as Partial<CrmFollowUpStore>;
        const base = current as CrmFollowUpStore;

        return {
          ...base,
          ...next,
          followUps: (Array.isArray(next.followUps) && next.followUps.length > 0 ? next.followUps : seedFollowUps)
            .map((item) => ({ ...item, logs: item.logs ?? [], calls: item.calls ?? [], archived: item.archived ?? false })),
          leads: (Array.isArray(next.leads) && next.leads.length > 0 ? next.leads : seedLeads)
            .map((item) => ({ ...item, logs: item.logs ?? [], calls: item.calls ?? [], archived: item.archived ?? false })),
        };
      },
    },
  ),
);
