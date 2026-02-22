import React from "react";
import { ImageElement } from "./Image";
import ImagePreview from "./Image/Preview";
import { TextElement } from "./Text";
import TextPreview from "./Text/Preview";
import { type Element, type ElementValue } from "./useElementRegistry";

/**
 * Metadata for a card element type, including its editor and preview components.
 */
export interface ElementDefinition<T extends Element["type"]> {
  /** Component used to edit the element's properties */
  editor: React.ComponentType<{ id: string }>;
  /** Component used to render the element's visual representation */
  preview: React.ComponentType<ElementValue<T> & { id: string }>;
}

/**
 * ELEMENT_REGISTRY maps each element type to its corresponding editor and preview components.
 * This factory pattern allows for easy extension when adding new element types.
 */
export const ELEMENT_REGISTRY: {
  [K in Element["type"]]: ElementDefinition<K>;
} = {
  text: {
    editor: TextElement,
    preview: TextPreview,
  },
  image: {
    editor: ImageElement,
    preview: ImagePreview,
  },
};
