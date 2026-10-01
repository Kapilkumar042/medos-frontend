import api from "./api";

export type DashboardPeriod =
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "this_year"
  | "custom";

type DashboardParams = {
  period: DashboardPeriod;
  start_date?: string;
  end_date?: string;
};

function request(path: string, params: DashboardParams) {
  return api.get(path, { params }).then((response) => response.data);
}

export const dashboardApi = {
  getOpd: (params: DashboardParams) => request("/dashboard/opd", params),
  getIpd: (params: DashboardParams) => request("/dashboard/ipd", params),
};