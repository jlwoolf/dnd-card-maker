import { type ReactNode, useState, useCallback } from "react";
import { ElementRefContext } from "./Context";

export const ElementRefProvider = ({ children }: { children: ReactNode }) => {
  const [element, setElementState] = useState<HTMLElement | null>(null);

  // We use useCallback for the ref setter to maintain reference equality
  const setElement = useCallback((node: HTMLElement | null) => {
    setElementState(node);
  }, []);

  return (
    <ElementRefContext.Provider value={{ element, setElement }}>
      {children}
    </ElementRefContext.Provider>
  );
};
