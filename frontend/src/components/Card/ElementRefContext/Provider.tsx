import { type ReactNode, useState, useCallback } from "react";
import { ElementRefContext } from "./Context";

interface ElementRefProviderProps {
  children: ReactNode;
}

/**
 * ElementRefProvider manages the state of shared DOM references for card components.
 */
export const ElementRefProvider = ({ children }: ElementRefProviderProps) => {
  const [element, setElementState] = useState<HTMLElement | null>(null);
  const [settingsAnchor, setSettingsAnchorState] = useState<HTMLElement | null>(
    null,
  );

  const setElement = useCallback((node: HTMLElement | null) => {
    setElementState(node);
  }, []);

  const setSettingsAnchor = useCallback((node: HTMLElement | null) => {
    setSettingsAnchorState(node);
  }, []);

  return (
    <ElementRefContext.Provider
      value={{ element, setElement, settingsAnchor, setSettingsAnchor }}
    >
      {children}
    </ElementRefContext.Provider>
  );
};
