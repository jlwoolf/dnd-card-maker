import { createContext, useContext } from "react";
import { createStore, useStore } from "zustand";

type ExportStore = [boolean, (value: boolean) => void];

export const createExportStore = (initialValue: boolean) => {
  return createStore<ExportStore>((set) => [
    initialValue,
    (value: boolean) => set((state) => [value, state[1]], true),
  ]);
};

export const ExportContext = createContext<ReturnType<
  typeof createExportStore
> | null>(null);

export const useExportModal = () => {
  const store = useContext(ExportContext);
  if (!store) {
    throw new Error("useExportModal must be used within an ExportProvider");
  }

  // useStore subscribes to the vanilla store
  return useStore(store);
};
