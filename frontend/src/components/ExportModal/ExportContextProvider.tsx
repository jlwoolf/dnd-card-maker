import { useState } from "react";
import { createExportStore, ExportContext } from "./ExportContext";

const ExportContextProvider = ({
  children,
  initialValue = false,
}: {
  children: React.ReactNode;
  initialValue?: boolean;
}) => {
  const [store] = useState(() => createExportStore(initialValue));

  return (
    <ExportContext.Provider value={store}>{children}</ExportContext.Provider>
  );
};

export default ExportContextProvider;
