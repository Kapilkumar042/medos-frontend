// src/lib/opd-bill-print.ts
import type { Doctor } from "@/hooks/useDoctors";
import { toast } from "sonner";

export interface BillPrintLineItem {
  name?: string;
  category?: string;
  code?: string;
  qty?: number | string;
  amount?: number | string;
  discount?: number | string;
  remarks?: string;
}

export interface BillPrintTotals {
  sub: number;
  itemDisc: number;
  totalDisc: number;
  net: number;
  due: number;
}

export interface BillPrintData {
  uhid?: string;
  opdNo?: string;
  name?: string;
  gender?: string;
  dob?: string;
  bloodGroup?: string;
  mobile?: string;
  email?: string;
  address?: string;
  department?: string;
  doctorId?: string;
  visitDate?: string;
  symptoms?: string;
  items?: BillPrintLineItem[];
  discountSource?: string;
  payMode1?: string;
  amount1?: number | string;
  remark?: string;
}

export interface BillPrintOptions {
  billNo?: string;
  date?: Date;
  autoPrint?: boolean;
}

export function openBillPreview(
  d: BillPrintData,
  totals: BillPrintTotals,
  doctorsList: Doctor[],
  options: BillPrintOptions = {},
) {
  const doctor = doctorsList.find((x) => String(x.id) === String(d.doctorId));
  const doctorLabel = doctor
    ? `Dr. ${doctor.first_name} (User #${doctor.user_id}) — ${doctor.specialization}`
    : "-";
  const billNo = options.billNo ?? `BL-${Date.now().toString().slice(-8)}`;
  const dateStr = (options.date ?? new Date()).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const isPaid = totals.due <= 0;

  const rows = (d.items ?? [])
    .map((i, idx) => {
      const net = Math.max(
        0,
        (Number(i.qty) || 0) * (Number(i.amount) || 0) - (Number(i.discount) || 0),
      );
      return `
      <tr>
        <td class="idx">${idx + 1}</td>
        <td>
          <div class="item-name">${escapeHtml(i.name)}</div>
          <div class="muted">${escapeHtml(i.category)}${i.code ? " • " + escapeHtml(i.code) : ""}</div>
        </td>
        <td class="r">${i.qty}</td>
        <td class="r">₹${fmt(i.amount)}</td>
        <td class="r">₹${fmt(i.discount)}</td>
        <td class="r net-cell">₹${fmt(net)}</td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"/>
<title>Bill ${billNo}</title>
<style>
  :root {
    --brand: #2563eb;
    --brand-dark: #1d4ed8;
    --ink: #0f172a;
    --muted: #64748b;
    --line: #e2e8f0;
    --panel: #f8fafc;
    --success: #059669;
    --success-bg: #ecfdf5;
    --warn: #d97706;
    --warn-bg: #fffbeb;
  }
  * { box-sizing: border-box; }
  body {
    font-family: "Inter", -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    color: var(--ink);
    margin: 0;
    padding: 32px 16px;
    background: #f1f5f9;
    -webkit-font-smoothing: antialiased;
  }
  .wrap {
    max-width: 800px;
    margin: 0 auto;
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(15, 23, 42, .06), 0 12px 32px -12px rgba(15, 23, 42, .12);
  }

  /* header */
  .head { padding: 18px 28px 16px; text-align: center; border-bottom: 2px solid var(--ink); }
  .head-top { display: flex; align-items: center; justify-content: center; gap: 14px; position: relative; }
  .logo {
    position: absolute; left: 0; top: 50%; transform: translateY(-50%);
    width: 54px; height: 54px; border-radius: 10px;
    background: var(--brand); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 20px; letter-spacing: -0.02em;
  }
  .head h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: .01em; color: var(--ink); }
  .head .contact { margin-top: 6px; font-size: 13px; font-weight: 700; color: var(--ink); }
  .head .address { margin-top: 2px; font-size: 12.5px; font-weight: 700; color: var(--ink); }

  .meta {
    padding: 14px 28px;
    display: grid;
    grid-template-columns: 1.3fr 0.8fr 1fr;
    gap: 6px 24px;
    border-bottom: 1px solid var(--line);
    font-size: 13px;
  }
  .meta .field { display: flex; }
  .meta .label { flex: 0 0 96px; color: var(--ink); }
  .meta .colon { flex: 0 0 10px; color: var(--ink); }
  .meta .value { font-weight: 700; color: var(--ink); }

  .sect { padding: 22px 28px; }
  .sect + .sect { border-top: 1px solid var(--line); }
  h2 {
    font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em;
    color: var(--muted); margin: 0 0 14px;
  }

  /* patient info card */
  .info-card {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 16px 18px;
  }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 28px; font-size: 13px; }
  .grid .full { grid-column: 1/-1; }
  .grid div span { display: block; font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); margin-bottom: 2px; }
  .grid div b { font-weight: 600; }

  /* table */
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 10px 10px; text-align: left; }
  thead th {
    background: var(--panel);
    font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
    color: var(--muted); border-bottom: 1px solid var(--line);
  }
  tbody tr:not(:last-child) td { border-bottom: 1px solid var(--line); }
  tbody tr:nth-child(even) { background: #fafbfc; }
  td.r, th.r { text-align: right; }
  td.idx { color: var(--muted); font-variant-numeric: tabular-nums; width: 28px; }
  .item-name { font-weight: 600; }
  .net-cell { font-weight: 700; color: var(--ink); }
  .muted { color: #94a3b8; font-size: 11px; margin-top: 2px; }

  /* qr + totals row */
  .bottom-row { display: flex; gap: 20px; align-items: flex-start; margin-top: 18px; }
  .qr-card {
    flex: 0 0 170px; text-align: center; padding: 14px;
    border: 1px solid var(--line); border-radius: 12px; background: var(--panel);
  }
  .qr-card .label { font-size: 9.5px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin-bottom: 8px; }
  .qr-card img { width: 130px; height: 130px; background: #fff; border-radius: 8px; padding: 4px; border: 1px solid var(--line); }
  .qr-card .name { font-size: 11.5px; margin-top: 8px; font-weight: 600; }
  .qr-card .uhid { font-size: 10.5px; color: var(--muted); margin-top: 1px; }

  .totals { margin: 0 0 0 auto; width: 290px; font-size: 13px; }
  .totals .row { display: flex; justify-content: space-between; padding: 5px 0; color: var(--muted); }
  .totals .row b { color: var(--ink); font-weight: 600; }
  .totals .divider { border-top: 1px dashed var(--line); margin: 8px 0; }
  .totals .net {
    display: flex; justify-content: space-between; align-items: baseline;
    padding-top: 4px; font-weight: 700; font-size: 17px; color: var(--brand-dark);
    letter-spacing: -0.01em;
  }
  .totals .net span:first-child { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--ink); }
  .status-row { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
  .pill {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px;
  }
  .pill.paid { background: var(--success-bg); color: var(--success); }
  .pill.due { background: var(--warn-bg); color: var(--warn); }
  .pill::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

  .remark { margin-top: 14px; font-size: 12px; color: var(--muted); background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; }
  .remark b { color: var(--ink); }

  .foot {
    padding: 16px 28px; background: var(--panel); border-top: 1px solid var(--line);
    font-size: 11px; color: var(--muted); display: flex; justify-content: space-between;
  }

  @media print {
    body { padding: 0; background: #fff; }
    .wrap { border-radius: 0; box-shadow: none; }
  }
</style></head>
<body>
  <div class="wrap">
    <div class="head">
      <div class="head-top">
        <div class="logo">M+</div>
        <h1>Ncuresoft Hospital</h1>
      </div>
      <div class="contact">Mobile Number : +91 98765 43210 &nbsp; Email ID : INFO@MEDOSHOSPITAL.COM</div>
      <div class="address">123 HEALTH AVENUE, BENGALURU, KARNATAKA, 560001</div>
    </div>

    <div class="meta">
      <div class="field"><span class="label">UHID No.</span><span class="colon">:</span><span class="value">${escapeHtml(d.uhid)}</span></div>
      <div class="field"><span class="label">Bill No.</span><span class="colon">:</span><span class="value">${billNo}</span></div>
      <div class="field"><span class="label">Date</span><span class="colon">:</span><span class="value">${dateStr}</span></div>

      <div class="field"><span class="label">Name</span><span class="colon">:</span><span class="value">${escapeHtml(d.name)}</span></div>
      <div class="field"></div>
      <div class="field"><span class="label">Age/Sex</span><span class="colon">:</span><span class="value">${escapeHtml(d.gender)}${d.dob ? " / " + escapeHtml(d.dob) : ""}</span></div>

      <div class="field"><span class="label">Doctor</span><span class="colon">:</span><span class="value">${escapeHtml(doctorLabel)}</span></div>
      <div class="field"></div>
      <div class="field"><span class="label">Mobile</span><span class="colon">:</span><span class="value">${escapeHtml(d.mobile)}</span></div>

      <div class="field"><span class="label">Address</span><span class="colon">:</span><span class="value">${escapeHtml(d.address)}</span></div>
      <div class="field"></div>
      <div class="field"><span class="label">Department</span><span class="colon">:</span><span class="value">${escapeHtml(d.department)}</span></div>

      <div class="field"><span class="label">Blood Group</span><span class="colon">:</span><span class="value">${escapeHtml(d.bloodGroup)}</span></div>
      <div class="field"></div>
      <div class="field"><span class="label">Visit Date</span><span class="colon">:</span><span class="value">${escapeHtml(d.visitDate)}</span></div>

      <div class="field"><span class="label">Symptoms</span><span class="colon">:</span><span class="value">${escapeHtml(d.symptoms || "-")}</span></div>
      <div class="field"></div>
      <div class="field"><span class="label">Email</span><span class="colon">:</span><span class="value">${escapeHtml(d.email || "-")}</span></div>
    </div>

    <div class="sect">
      <h2>Billing Items</h2>
      <table>
        <thead>
          <tr><th>#</th><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Disc</th><th class="r">Net</th></tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:22px">No items</td></tr>`}</tbody>
      </table>

      <div class="bottom-row">
        <div class="qr-card">
          <div class="label">Scan for Patient Info</div>
          <img src="${patientQrUrl(d, billNo, dateStr, doctorLabel)}" alt="Patient QR"/>
          <div class="name">${escapeHtml(d.name)}</div>
          <div class="uhid">UHID: ${escapeHtml(d.uhid)}</div>
        </div>

        <div class="totals">
          <div class="row"><span>Total Amount</span><b>₹${fmt(totals.sub)}</b></div>
          <div class="row"><span>Item Discount</span><b>− ₹${fmt(totals.itemDisc)}</b></div>
          <div class="row"><span>Bill Discount</span><b>− ₹${fmt(totals.totalDisc - totals.itemDisc)}</b></div>
          <div class="row"><span>Discount Source</span><b>${escapeHtml(d.discountSource)}</b></div>
          <div class="divider"></div>
          <div class="net"><span>Net Payable</span><span>₹${fmt(totals.net)}</span></div>
          <div class="divider"></div>
          <div class="row"><span>Paid (${escapeHtml(d.payMode1)})</span><b>₹${fmt(Number(d.amount1) || 0)}</b></div>
          <div class="row"><span>Due Amount</span><b>₹${fmt(totals.due)}</b></div>
          <div class="status-row">
            <span></span>
            <span class="pill ${isPaid ? "paid" : "due"}">${isPaid ? "Paid in full" : "Payment due"}</span>
          </div>
        </div>
      </div>
      ${d.remark ? `<div class="remark"><b>Remark:</b> ${escapeHtml(d.remark)}</div>` : ""}
    </div>

    <div class="foot">
      <div>This is a computer-generated bill. No signature required.</div>
      <div>Thank you for visiting Ncuresoft Hospital.</div>
    </div>
  </div>
  <script>window.onload=()=>{${options.autoPrint ? "setTimeout(()=>window.print(),200);" : ""}}</script>
</body></html>`;

  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) {
    toast.error("Pop-up blocked. Allow pop-ups to print the bill.");
    return false;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}

function fmt(n: number | string | undefined) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(n) || 0);
}
function patientQrUrl(d: BillPrintData, billNo: string, dateStr: string, doctorName?: string) {
  const info = [
    `Ncuresoft Hospital`,
    `Bill No: ${billNo}`,
    `Date: ${dateStr}`,
    `UHID: ${d.uhid}`,
    `Name: ${d.name}`,
    `Gender: ${d.gender}`,
    `DOB: ${d.dob || "-"}`,
    `Blood Group: ${d.bloodGroup}`,
    `Mobile: ${d.mobile}`,
    d.email ? `Email: ${d.email}` : "",
    `Address: ${d.address}`,
    doctorName ? `Doctor: ${doctorName}` : "",
    `Department: ${d.department}`,
    `Visit Date: ${d.visitDate}`,
    d.symptoms ? `Symptoms: ${d.symptoms}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=${encodeURIComponent(info)}`;
}
function escapeHtml(s: string | undefined) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
