import {
  createContext,
  useContext,
} from "react";

interface ElementRefContextType {
  element: HTMLElement | null;
  setElement: (node: HTMLElement | null) => void;
}

export const ElementRefContext = createContext<
  ElementRefContextType | undefined
>(undefined);

export const useSharedElement = () => {
  const context = useContext(ElementRefContext);
  if (!context) {
    throw new Error(
      "useSharedElement must be used within an ElementRefProvider",
    );
  }
  return context;
};
