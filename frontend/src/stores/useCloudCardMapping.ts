import { create } from "zustand";

interface CloudCardMappingState {
  /** Maps local card IDs to cloud card IDs */
  mapping: Record<string, string>;
  setMapping: (localId: string, cloudId: string) => void;
  getCloudId: (localId: string) => string | undefined;
  removeMapping: (localId: string) => void;
  /** Clear all mappings (e.g., on logout / user switch) */
  reset: () => void;
}

export const useCloudCardMapping = create<CloudCardMappingState>((set, get) => ({
  mapping: {},
  setMapping: (localId, cloudId) =>
    set((state) => ({
      mapping: { ...state.mapping, [localId]: cloudId },
    })),
  getCloudId: (localId) => get().mapping[localId],
  removeMapping: (localId) =>
    set((state) => {
      const next = { ...state.mapping };
      delete next[localId];
      return { mapping: next };
    }),
  reset: () => set({ mapping: {} }),
}));
