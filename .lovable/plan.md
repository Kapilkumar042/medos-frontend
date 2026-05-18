
# Hospital Management System — Build Plan

## Scope & Approach

This is a large multi-module frontend. I'll build it as a **frontend-only app with mock data** (no backend yet) so every screen is navigable and interactive. We can wire Lovable Cloud later for real persistence/auth.

### Stack adjustments vs your prompt
The Lovable template uses **TanStack Start + TanStack Router** (not React Router DOM) and **Tailwind v4** with CSS tokens (not tailwind.config.js). Everything else from your stack stays: TypeScript, shadcn/ui, TanStack Query, Zustand, React Hook Form + Zod, Recharts, Framer Motion, Lucide. Functionally identical — just the routing import changes.

### Design system
- Palette applied via `oklch` tokens in `src/styles.css` (Slate Navy primary, Teal secondary, Blue accent, plus success/warning/danger).
- Glassmorphism cards, soft shadows, `rounded-2xl`, generous spacing, Inter typography.
- Light + dark mode via `.dark` class toggle (Zustand-persisted).
- Reusable semantic tokens — no hardcoded colors in components.

## Build phases

### Phase 1 — Foundation
- Design tokens (palette, shadows, gradients, glass utility) in `src/styles.css`.
- Core layout: `AppLayout` with collapsible `Sidebar` (grouped accordion menus, mobile drawer) + sticky `TopNavbar` (logo, global search, notifications, theme toggle, profile, datetime).
- Zustand stores: `uiStore` (sidebar/theme), `searchStore` (history), `authStore` (mock).
- Shared primitives: `PageHeader`, `MetricCard`, `DataTable` (sort/filter/paginate/export/bulk), `EmptyState`, `LoadingSkeleton`, `ConfirmDialog`, `ModalWrapper`, form fields wrapping shadcn + RHF.
- Mock data layer in `src/services/mock/` (patients, doctors, appointments, beds, meds, lab tests, invoices) + faux async via TanStack Query.

### Phase 2 — Global Search & Command Palette
- Top-nav search: debounced, instant suggestions across UHID / name / mobile, recent searches, keyboard nav, skeleton + empty states.
- Selecting a patient opens a **Patient Drawer** with tabs: Overview, OPD/IPD History, Prescriptions, Invoices.
- `Ctrl/Cmd+K` command palette for navigation + quick patient search.

### Phase 3 — Dashboard
- 8 animated metric cards with sparklines, gradients, trend deltas.
- Recharts: OPD monthly, IPD admissions/discharges, revenue area, cash vs online donut, department performance bar, appointment trends, bed occupancy, doctor performance.
- Activity timeline + real-time-feel updates (interval-based mock).

### Phase 4 — OPD module
- **Appointment**: multi-step booking (patient → doctor/dept → date/slot → confirm), token generation, status badges.
- **OPD Registration**: full patient form (UHID/ABHA/Aadhaar/demographics) + visit details + dynamic billing rows with auto-calc, GST, discounts, multiple payment modes, printable invoice view.
- **Waiting Area / Token Queue**: live queue board, doctor-wise lanes, current/next token, status colors.
- **Prescription builder**, **EMR** (SOAP notes, vitals, diagnosis, templates, follow-up), **Certificates**.

### Phase 5 — IPD module
- **Admission** form, **Bed Management** ward grid (Green/Red/Yellow/Blue states, ICU vs General filters, assign patient), **Discharge** workflow, **Nursing** notes.

### Phase 6 — Laboratory & Radiology
- Test booking, sample collection tracking, result entry, report upload + PDF view, status pipeline. Radiology mirrors with X-Ray/MRI/CT tabs.

### Phase 7 — Pharmacy
- Inventory table (batch/expiry alerts), POS-style medicine sales, stock management, purchases, suppliers.

### Phase 8 — Billing, HR, Settings
- OPD/IPD billing tables, expenses, doctor share calc.
- HR: staff, attendance, payroll.
- Settings: users, roles, permissions matrix, hospital setup.

### Phase 9 — Auth & polish
- Split-screen login, forgot password, OTP, reset (mock flow, Zod-validated, glass card).
- Lazy-loaded route chunks, error boundaries on each module, toasts via sonner, page transitions via Framer Motion, keyboard shortcuts overlay.

## Technical details

### Folder structure
```text
src/
├── routes/                      # TanStack file-based routes
│   ├── __root.tsx
│   ├── _authenticated.tsx       # guard layout
│   ├── _authenticated/
│   │   ├── dashboard.tsx
│   │   ├── opd.appointments.tsx
│   │   ├── opd.registration.tsx
│   │   ├── opd.queue.tsx
│   │   ├── opd.emr.tsx
│   │   ├── ipd.admission.tsx
│   │   ├── ipd.beds.tsx
│   │   ├── lab.*.tsx  radiology.*.tsx  pharmacy.*.tsx
│   │   ├── billing.*.tsx  hr.*.tsx  settings.*.tsx
│   ├── login.tsx  forgot-password.tsx  reset-password.tsx
├── components/
│   ├── ui/                      # shadcn (existing)
│   ├── layout/  (AppLayout, Sidebar, TopNavbar, PageHeader)
│   ├── shared/  (DataTable, MetricCard, SearchBox, CommandPalette, PatientDrawer, EmptyState, Skeletons)
│   ├── forms/   (FormInput, SelectField, DatePicker, DynamicBillingRows)
│   └── charts/  (recharts wrappers)
├── modules/{opd,ipd,pharmacy,laboratory,billing,hr,settings}/
├── store/       (uiStore, authStore, searchStore)
├── services/mock/  +  hooks/  +  types/  +  utils/  +  constants/
```

### Routing & guards
- All app routes nested under `_authenticated` layout that checks mock auth in `beforeLoad`.
- Sidebar uses `<Link>` + `useRouterState` for active highlighting; nested groups stay open on active child.

### State & data
- TanStack Query for all reads/mutations against mock services (simulated latency) — easy swap to real API later.
- Zustand for UI/theme/search-history (persist middleware to localStorage).
- RHF + Zod schemas colocated per form in `modules/*/schemas`.

### Performance
- `lazy()` route components, memoized table rows, virtualized long lists (lab/pharmacy inventory) via `@tanstack/react-virtual`, `ResponsiveContainer` charts, image lazy loading.

## Out of scope (this pass)
- Real backend, auth, SMS, payments, PDF generation engine, barcode scanning hardware. UI/structure is built so these plug in cleanly later (Lovable Cloud recommended when ready).

## Deliverable
A navigable, visually polished, type-safe hospital ERP frontend with every listed module reachable, populated with realistic mock data, and ready for backend wiring.
