import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SearchState {
  recent: string[];
  addRecent: (q: string) => void;
  clear: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      recent: [],
      addRecent: (q) => {
        if (!q.trim()) return;
        const next = [q, ...get().recent.filter((x) => x !== q)].slice(0, 8);
        set({ recent: next });
      },
      clear: () => set({ recent: [] }),
    }),
    { name: "medos-search" },
  ),
);
