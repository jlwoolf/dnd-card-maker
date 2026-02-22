import { useState } from "react";
import { createExportStore, ExportContext } from "./ExportContext";

/**
 * ExportContextProvider initializes and provides the singleton store for 
 * the Export Modal's visibility state.
 * 
 * @param props - Children and initial visibility state.
 */
const ExportContextProvider = ({
  children,
  initialValue = false,
}: {
  children: React.ReactNode;
  initialValue?: boolean;
}) => {
  // Use lazy initialization to ensure the store is created only once
  const [store] = useState(() => createExportStore(initialValue));

  return (
    <ExportContext.Provider value={store}>{children}</ExportContext.Provider>
  );
};

export default ExportContextProvider;
