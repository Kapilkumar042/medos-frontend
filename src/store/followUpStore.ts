import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_FOLLOWUPS = 3;

export const FOLLOWUP_TYPES = [
  "OPD_REVIEW",
  "INVESTIGATION_REVIEW",
  "POST_PROCEDURE",
] as const;

export type FollowUpType = (typeof FOLLOWUP_TYPES)[number];

export const FOLLOWUP_STATUSES = [
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
] as const;

export type FollowUpStatus = (typeof FOLLOWUP_STATUSES)[number];

export const CALL_OUTCOMES = [
  "Answered",
  "No Answer",
  "Busy",
  "Wrong Number",
  "Patient Requested Callback",
  "Confirmed Visit",
  "Cancelled",
  "Not Interested",
] as const;

export type CallOutcome = (typeof CALL_OUTCOMES)[number];

export type InvestigationStatus =
  | "Not Required"
  | "Pending"
  | "Report Available"
  | "Reviewed";

export interface FollowUpCallLog {
  id: string;
  calledAt: string;
  calledBy: string;
  outcome: CallOutcome;
  notes: string;
  nextCallAt?: string;
}

export interface FollowUpLog {
  id: string;
  followUpNumber: number;
  at: string;

  type: FollowUpType;
  status: FollowUpStatus;

  result: string;

  currentComplaint?: string;
  diagnosis?: string;
  doctorNotes?: string;
  treatmentPlan?: string;

  investigationStatus?: InvestigationStatus;
  investigationName?: string;
  investigationOrderId?: string;

  procedureName?: string;
  procedureDate?: string;
  dischargeDate?: string;

  nextDate?: string;
  nextFollowUpId?: string;

  createdBy?: string;
}

export interface FollowUpPatient {
  id: string;

  patientId?: string;
  uhid?: string;
  encounterId?: string;

  name: string;
  phone: string;
  age?: number;
  source?: string;
  assignedTo?: string;

  doctorId?: string;
  doctorName?: string;

  departmentId?: string;
  departmentName?: string;

  query: string;

  followUpType?: FollowUpType;
  status: FollowUpStatus;
  nextDate?: string;

  investigationStatus?: InvestigationStatus;
  investigationName?: string;
  investigationOrderId?: string;

  procedureName?: string;
  procedureDate?: string;
  dischargeDate?: string;

  logs: FollowUpLog[];
  calls: FollowUpCallLog[];

  archived: boolean;

  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

interface AddPatientInput {
  patientId?: string;
  uhid?: string;
  encounterId?: string;

  name: string;
  phone: string;
  age?: number;
  source?: string;
  assignedTo?: string;

  doctorId?: string;
  doctorName?: string;

  departmentId?: string;
  departmentName?: string;

  query?: string;

  followUpType?: FollowUpType;
  nextDate?: string;

  investigationStatus?: InvestigationStatus;
  investigationName?: string;
  investigationOrderId?: string;

  procedureName?: string;
  procedureDate?: string;
  dischargeDate?: string;

  createdBy?: string;
}

interface RecordInput {
  status: FollowUpStatus;
  result: string;
  nextDate?: string;

  currentComplaint?: string;
  diagnosis?: string;
  doctorNotes?: string;
  treatmentPlan?: string;

  investigationStatus?: InvestigationStatus;
  investigationName?: string;
  investigationOrderId?: string;

  procedureName?: string;
  procedureDate?: string;
  dischargeDate?: string;

  createdBy?: string;
}

interface AddCallInput {
  outcome: CallOutcome;
  notes: string;
  calledBy?: string;
  nextCallAt?: string;
}

interface FollowUpStore {
  items: FollowUpPatient[];

  add: (input: AddPatientInput) => string;
  bulkAdd: (inputs: AddPatientInput[]) => number;

  record: (
    ids: string[],
    input: RecordInput,
  ) => number;

  addCall: (
    id: string,
    input: AddCallInput,
  ) => void;

  updatePatient: (
    id: string,
    patch: Partial<FollowUpPatient>,
  ) => void;

  revive: (ids: string[]) => void;
  archive: (ids: string[]) => void;
  remove: (ids: string[]) => void;

  createNextFollowUp: (
    id: string,
    nextDate: string,
    type?: FollowUpType,
  ) => string | undefined;
}

const makeId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const now = () => new Date().toISOString();

export const useFollowUpStore = create<FollowUpStore>()(
  persist(
    (set, get) => ({
      items: [],

      add: (input) => {
        const id = makeId();

        const patient: FollowUpPatient = {
          id,

          patientId: input.patientId,
          uhid: input.uhid,
          encounterId: input.encounterId,

          name: input.name,
          phone: input.phone,
          age: input.age,

          doctorId: input.doctorId,
          doctorName: input.doctorName,

          departmentId: input.departmentId,
          departmentName: input.departmentName,

          query: input.query ?? "",

          followUpType: input.followUpType ?? "OPD_REVIEW",
          status: input.nextDate ? "Scheduled" : "Pending",
          nextDate: input.nextDate,

          investigationStatus:
            input.investigationStatus ?? "Not Required",
          investigationName: input.investigationName,
          investigationOrderId: input.investigationOrderId,

          procedureName: input.procedureName,
          procedureDate: input.procedureDate,
          dischargeDate: input.dischargeDate,

          logs: [],
          calls: [],

          archived: false,

          createdAt: now(),
          updatedAt: now(),
          createdBy: input.createdBy,
        };

        set((state) => ({
          items: [patient, ...state.items],
        }));

        return id;
      },

      bulkAdd: (inputs) => {
        const existing = get().items;

        const newPatients: FollowUpPatient[] = inputs
          .filter((input) => input.name?.trim())
          .map((input) => ({
            id: makeId(),

            patientId: input.patientId,
            uhid: input.uhid,
            encounterId: input.encounterId,

            name: input.name.trim(),
            phone: input.phone.trim(),
            age: input.age,

            doctorId: input.doctorId,
            doctorName: input.doctorName,

            departmentId: input.departmentId,
            departmentName: input.departmentName,

            query: input.query ?? "",

            followUpType: input.followUpType ?? "OPD_REVIEW",
            status: input.nextDate ? "Scheduled" : "Pending",
            nextDate: input.nextDate,

            investigationStatus:
              input.investigationStatus ?? "Not Required",
            investigationName: input.investigationName,
            investigationOrderId: input.investigationOrderId,

            procedureName: input.procedureName,
            procedureDate: input.procedureDate,
            dischargeDate: input.dischargeDate,

            logs: [],
            calls: [],

            archived: false,

            createdAt: now(),
            updatedAt: now(),
            createdBy: input.createdBy,
          }));

        set({
          items: [...newPatients, ...existing],
        });

        return newPatients.length;
      },

      record: (ids, input) => {
        let movedToArchive = 0;

        set((state) => ({
          items: state.items.map((patient) => {
            if (!ids.includes(patient.id)) {
              return patient;
            }

            const followUpNumber = patient.logs.length + 1;

            const log: FollowUpLog = {
              id: makeId(),
              followUpNumber,
              at: now(),

              type:
                patient.followUpType ??
                "OPD_REVIEW",

              status: input.status,
              result: input.result,

              currentComplaint: input.currentComplaint,
              diagnosis: input.diagnosis,
              doctorNotes: input.doctorNotes,
              treatmentPlan: input.treatmentPlan,

              investigationStatus:
                input.investigationStatus,
              investigationName:
                input.investigationName,
              investigationOrderId:
                input.investigationOrderId,

              procedureName: input.procedureName,
              procedureDate: input.procedureDate,
              dischargeDate: input.dischargeDate,

              nextDate: input.nextDate,

              createdBy: input.createdBy,
            };

            const reachedLimit =
              followUpNumber >= MAX_FOLLOWUPS &&
              input.status !== "Completed";

            if (reachedLimit) {
              movedToArchive += 1;
            }

            return {
              ...patient,

              status: input.status,

              nextDate: input.nextDate,

              currentComplaint: input.currentComplaint,
              query:
                input.currentComplaint ??
                patient.query,

              investigationStatus:
                input.investigationStatus ??
                patient.investigationStatus,

              investigationName:
                input.investigationName ??
                patient.investigationName,

              investigationOrderId:
                input.investigationOrderId ??
                patient.investigationOrderId,

              procedureName:
                input.procedureName ??
                patient.procedureName,

              procedureDate:
                input.procedureDate ??
                patient.procedureDate,

              dischargeDate:
                input.dischargeDate ??
                patient.dischargeDate,

              logs: [...patient.logs, log],

              archived:
                reachedLimit
                  ? true
                  : patient.archived,

              updatedAt: now(),
            };
          }),
        }));

        return movedToArchive;
      },

      addCall: (id, input) => {
        set((state) => ({
          items: state.items.map((patient) => {
            if (patient.id !== id) {
              return patient;
            }

            const call: FollowUpCallLog = {
              id: makeId(),
              calledAt: now(),
              calledBy: input.calledBy ?? "Current User",
              outcome: input.outcome,
              notes: input.notes,
              nextCallAt: input.nextCallAt,
            };

            return {
              ...patient,
              calls: [...patient.calls, call],
              updatedAt: now(),
            };
          }),
        }));
      },

      updatePatient: (id, patch) => {
        set((state) => ({
          items: state.items.map((patient) =>
            patient.id === id
              ? {
                  ...patient,
                  ...patch,
                  updatedAt: now(),
                }
              : patient,
          ),
        }));
      },

      revive: (ids) => {
        set((state) => ({
          items: state.items.map((patient) =>
            ids.includes(patient.id)
              ? {
                  ...patient,
                  archived: false,
                  status:
                    patient.nextDate
                      ? "Scheduled"
                      : "Pending",
                  updatedAt: now(),
                }
              : patient,
          ),
        }));
      },

      archive: (ids) => {
        set((state) => ({
          items: state.items.map((patient) =>
            ids.includes(patient.id)
              ? {
                  ...patient,
                  archived: true,
                  updatedAt: now(),
                }
              : patient,
          ),
        }));
      },

      remove: (ids) => {
        set((state) => ({
          items: state.items.filter(
            (patient) => !ids.includes(patient.id),
          ),
        }));
      },

      createNextFollowUp: (id, nextDate, type) => {
        const patient = get().items.find(
          (x) => x.id === id,
        );

        if (!patient) {
          return undefined;
        }

        const followUpType =
          type ??
          patient.followUpType ??
          "OPD_REVIEW";

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  nextDate,
                  followUpType,
                  status: "Scheduled",
                  updatedAt: now(),
                }
              : item,
          ),
        }));

        return id;
      },
    }),
    {
      name: "hims-follow-up-store",
    },
  ),
);