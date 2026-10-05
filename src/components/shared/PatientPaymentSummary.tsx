import { inr } from "@/lib/format";

export type PatientPaymentSummaryData = {
  total_collected?: number;
  total_due?: number;
  collection_by_payment_mode?: Record<string, number>;
};

const modes = ["CASH", "CARD", "UPI", "CHEQUE", "INSURANCE"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizePatientPaymentSummary(
  response: unknown,
): PatientPaymentSummaryData {
  const outer = isRecord(response) ? response : {};
  const data = isRecord(outer.data) ? outer.data : outer;

  const hasDashboardFields = [
    "collection_by_payment_mode",
    "collection_in_period",
    "total_collection_in_period",
    "outstanding_due_all_time",
  ].some((field) => field in data);

  const rawModes = isRecord(data.collection_by_payment_mode)
    ? data.collection_by_payment_mode
    : hasDashboardFields
      ? {}
      : data;

  const modes = Object.entries(rawModes).reduce<Record<string, number>>(
    (totals, [mode, amount]) => {
      const key = mode.trim().toUpperCase();
      totals[key] = (totals[key] ?? 0) + (Number(amount) || 0);
      return totals;
    },
    {},
  );

  const modeTotal = Object.values(modes).reduce((sum, amount) => sum + amount, 0);

  return {
    collection_by_payment_mode: modes,
    total_collected: Number(
      data.collection_in_period ?? data.total_collection_in_period ?? modeTotal,
    ),
    total_due:
      data.outstanding_due_all_time == null
        ? undefined
        : Number(data.outstanding_due_all_time),
  };
}

export function PatientPaymentSummary({
  title,
  summary,
}: {
  title: string;
  summary: PatientPaymentSummaryData | null;
}) {
  return (
    <section className="border-t border-border px-4 py-2">
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th className="py-2">Collection</th>
              {modes.map((mode) => <th key={mode} className="py-2">{mode}</th>)}
              <th className="py-2">Due</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border font-medium">
              <td className="py-2">{inr(summary?.total_collected ?? 0)}</td>
              {modes.map((mode) => (
                <td key={mode} className="py-2">
                  {inr(summary?.collection_by_payment_mode?.[mode] ?? 0)}
                </td>
              ))}
              <td className="py-2">
  {summary?.total_due == null ? "—" : inr(summary.total_due)}
</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}