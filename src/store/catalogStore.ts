import { create } from "zustand";
import { catalogApi } from "@/api/catalog";

export type CatalogKind = "lab" | "radiology" | "service" | "medicine" | "department";

export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  category?: string;
  price?: number;
  unit?: string;
  hsn?: string;
  gstPercent?: number;
  status: "Active" | "Inactive";
  createdAt: string;

  // Lab
  sampleType?: string;
  reportTime?: string;
  method?: string;
  referenceRange?: string;

  // Radiology
  modality?: string;
  body_part?: string;

  // Medicine
  manufacturer?: string;
  strength?: string;
  form?: string;
  batchNo?: string;
  expiry?: string;
  stock?: number;
  purchasePrice?: number;
  packSize?: string;
  unitPrice?: number;
  mrp?: number;
  dosageType?: string;

  // Department
  head?: string;
  location?: string;
  phone?: string;
}

interface CatalogState {
  items: Record<CatalogKind, CatalogItem[]>;
  loading: boolean;
  loadCatalog: (kind: CatalogKind) => Promise<void>;
  add: (kind: CatalogKind, item: Omit<CatalogItem, "id" | "createdAt">) => Promise<CatalogItem>;
  update: (kind: CatalogKind, id: string, patch: Partial<CatalogItem>) => Promise<CatalogItem>;
  remove: (kind: CatalogKind, id: string) => Promise<void>;
  importCatalog: (kind: CatalogKind, file: File) => Promise<any>;
  exportCatalog: (kind: Exclude<CatalogKind, "department">) => Promise<Blob>;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  items: {
    lab: [],
    radiology: [],
    service: [],
    medicine: [],
    department: [],
  },
  loading: false,
  loadCatalog: async (kind) => {
    set({ loading: true });
    try {
      const items = await catalogApi.list(kind);
      set((state) => ({
        items: {
          ...state.items,
          [kind]: items,
        },
      }));
    } finally {
      set({ loading: false });
    }
  },
  add: async (kind, item) => {
    const created = await catalogApi.create(kind, item);
    set((state) => ({
      items: {
        ...state.items,
        [kind]: [created, ...state.items[kind]],
      },
    }));
    return created;
  },
  update: async (kind, id, patch) => {
    const updated = await catalogApi.update(kind, id, patch);
    set((state) => ({
      items: {
        ...state.items,
        [kind]: state.items[kind].map((x) => (x.id === id ? updated : x)),
      },
    }));
    return updated;
  },
  remove: async (kind, id) => {
    await catalogApi.remove(kind, id);
    set((state) => ({
      items: {
        ...state.items,
        [kind]: state.items[kind].filter((x) => x.id !== id),
      },
    }));
  },
  // importCatalog: async (kind, file) => {
  //   const response = await catalogApi.importCatalog(kind, file);
  //   await get().loadCatalog(kind);
  //   return {
  //   message: response?.message ?? "Imported successfully",
  //   count: response?.count ?? 0,
  // };
  //   // set((state) => ({
  //   //   items: {
  //   //     ...state.items,
  //   //     [kind]: [...items, ...state.items[kind]],
  //   //   },
  //   // }));
  //   // return items;
  // },
    importCatalog: async (kind, file) => {
    const response =
      kind === "department"
        ? await catalogApi.importCatalog(kind, file)
        : await catalogApi.importHospitalCatalog(kind, file);

    await get().loadCatalog(kind);

    return {
      message: response?.message ?? "Imported successfully",
      count: response?.count ?? 0,
    };
  },

  exportCatalog: (kind) => catalogApi.exportHospitalCatalog(kind),
}));
