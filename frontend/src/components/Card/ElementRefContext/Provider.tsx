import { type ReactNode, useCallback, useState } from "react";
import { ElementRefContext } from "./Context";

interface ElementRefProviderProps {
  children: ReactNode;
}

/**
 * ElementRefProvider manages the state of shared DOM references across the 
 * card component tree. It provides access to the preview container (for image 
 * capture) and the toolbar anchor (for portal-based menu positioning).
 */
export const ElementRefProvider = ({ children }: ElementRefProviderProps) => {
  const [element, setElementState] = useState<HTMLElement | null>(null);
  const [settingsAnchor, setSettingsAnchorState] = useState<HTMLElement | null>(
    null,
  );

  /**
   * Updates the preview container reference.
   */
  const setElement = useCallback((node: HTMLElement | null) => {
    setElementState(node);
  }, []);

  /**
   * Updates the settings toolbar anchor reference.
   */
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
