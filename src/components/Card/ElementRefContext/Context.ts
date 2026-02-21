import { createContext, useContext } from "react";

interface ElementRefContextType {
  /** Ref for the preview card container, used for image generation */
  element: HTMLElement | null;
  /** Sets the preview card container ref */
  setElement: (node: HTMLElement | null) => void;
  /** Ref for the editor's top toolbar, used for portaling settings tooltips */
  settingsAnchor: HTMLElement | null;
  /** Sets the settings toolbar ref */
  setSettingsAnchor: (node: HTMLElement | null) => void;
}

/**
 * ElementRefContext shares DOM references between different parts of the card component
 * to facilitate image generation and portal-based menus.
 */
export const ElementRefContext = createContext<
  ElementRefContextType | undefined
>(undefined);

/**
 * Hook to access the ElementRefContext.
 */
export const useSharedElement = () => {
  const context = useContext(ElementRefContext);
  if (!context) {
    throw new Error(
      "useSharedElement must be used within an ElementRefProvider",
    );
  }
  return context;
};
