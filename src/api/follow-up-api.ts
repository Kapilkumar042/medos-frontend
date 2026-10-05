import api from "@/api/api";
import type {
  CallOutcome,
  FollowUpPatient,
  FollowUpStatus,
  FollowUpType,
  InvestigationStatus,
} from "@/store/followUpStore";

export type FollowUpInput = {
  patientId?: string;
  uhid?: string;
  encounterId?: string;
  name: string;
  phone: string;
  age?: number;
  doctorName?: string;
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
};

export type FollowUpUpdate = {
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
};

export type FollowUpCallInput = {
  outcome: CallOutcome;
  notes: string;
  calledBy?: string;
  nextCallAt?: string;
};

export const followUpApi = {
  list: async (archived?: boolean): Promise<FollowUpPatient[]> => {
    const response = await api.get("/follow-ups", {
      params: { archived },
    });
    const data = response.data;
    return Array.isArray(data) ? data : data.results ?? data.data ?? [];
  },

  deadLeads: async (): Promise<FollowUpPatient[]> => {
    const response = await api.get("/follow-ups/dead-leads");
    const data = response.data;
    return Array.isArray(data) ? data : data.results ?? data.data ?? [];
  },

  create: async (input: FollowUpInput): Promise<FollowUpPatient> => {
    const response = await api.post("/follow-ups", input);
    return response.data;
  },

  importRows: async (rows: FollowUpInput[]) => {
    const response = await api.post("/follow-ups/bulk", rows);
    return response.data;
  },

  record: async (ids: string[], input: FollowUpUpdate) => {
    const response = await api.post("/follow-ups/bulk/log", {
      followupIds: ids.map(Number),
      ...input,
    });
    return response.data;
  },

  recordOne: async (id: string, input: FollowUpUpdate) => {
    const response = await api.post(`/follow-ups/${Number(id)}/log`, input);
    return response.data;
  },

  addCall: async (id: string, input: FollowUpCallInput) => {
    const response = await api.post(`/follow-ups/${Number(id)}/calls`, input);
    return response.data;
  },

  setArchived: async (id: string, archived: boolean) => {
    const response = await api.patch(`/follow-ups/${Number(id)}/archive`, {
      archived,
    });
    return response.data;
  },

  restore: async (id: string) => {
    const response = await api.put(`/follow-ups/${Number(id)}/restore`);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await api.delete(`/follow-ups/${Number(id)}`);
    return response.data;
  },
};