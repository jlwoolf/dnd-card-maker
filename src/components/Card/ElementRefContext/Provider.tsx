import { type ReactNode, useState, useCallback } from "react";
import { ElementRefContext } from "./Context";

export const ElementRefProvider = ({ children }: { children: ReactNode }) => {
  const [element, setElementState] = useState<HTMLElement | null>(null);
  const [settingsAnchor, setSettingsAnchorState] = useState<HTMLElement | null>(null);

  // We use useCallback for the ref setter to maintain reference equality
  const setElement = useCallback((node: HTMLElement | null) => {
    setElementState(node);
  }, []);

  const setSettingsAnchor = useCallback((node: HTMLElement | null) => {
    setSettingsAnchorState(node);
  }, []);

  return (
    <ElementRefContext.Provider value={{ element, setElement, settingsAnchor, setSettingsAnchor }}>
      {children}
    </ElementRefContext.Provider>
  );
};
