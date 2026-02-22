import { v4 as uuid } from "uuid";
import { create } from "zustand";
import {
  ElementSchema,
  ImageElementSchema,
  TextElementSchema,
  type Element,
  type ElementValue,
} from "@src/schemas";

type ElementRegistry = {
  /** List of elements currently on the card */
  elements: Element[];
  /** Optional ID of the card being edited */
  cardId?: string;
  /** ID of the element whose settings are currently active in the toolbar */
  activeSettingsId?: string;

  /** Sets the active settings element ID */
  setActiveSettingsId: (id?: string) => void;
  /** 
   * Registers a new element of the specified type at the end of the stack.
   * 
   * @param type - The type of element to create.
   * @param initialValue - Optional partial initial values.
   */
  registerElement<T extends Element["type"]>(
    type: T,
    initialValue?: Partial<ElementValue<T>>,
  ): void;
  /** Unregisters an element by its unique ID */
  unregisterElement(id: string): void;
  /** Moves an element from one index to another (used for reordering) */
  moveElement(fromIndex: number, toIndex: number): void;
  /** 
   * Updates the type-specific value of an element.
   * 
   * @param id - Target element ID.
   * @param value - Partial update for the element's value object.
   */
  updateElement<T extends Element["type"]>(
    id: string,
    value: Partial<ElementValue<T>>,
  ): void;
  /** 
   * Updates the generic layout style of an element.
   * 
   * @param id - Target element ID.
   * @param value - Partial update for the style object.
   */
  updateStyle(id: string, value: Partial<Element["style"]>): void;
  /** Retrieves a single element by its ID */
  getElement(id: string): Element | undefined;
  /** Loads an entire card (elements + ID) into the registry */
  loadCard(elements: Element[], cardId?: string): void;
  /** 
   * Resets the registry.
   * 
   * @param withDefault - If true, populates the registry with a sample card.
   */
  reset(withDefault?: boolean): void;
};

/**
 * Default sample card content shown when the application first loads.
 */
const DEFAULT_CARD: Element[] = [
  {
    id: uuid(),
    type: "text",
    value: {
      value: [
        {
          type: "paragraph",
          align: "left",
          lineHeight: 120,
          children: [{ text: "Nine-Lives Familiar", bold: true, fontSize: 24 }],
        },
      ],
      variant: "banner",
      expand: false,
      width: 100,
    },
    style: {
      grow: false,
      align: "center",
    },
  },
  {
    id: uuid(),
    type: "image",
    value: {
      radius: 0,
      src: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdna.artstation.com%2Fp%2Fassets%2Fimages%2Fimages%2F077%2F858%2F690%2Flarge%2Fbram-sels-wotc-mtg-nine-lives-familiar-bram-sels.jpg%3F1720544283&f=1&nofb=1&ipt=9603a9d37b83c0432dd935b8f872136013e941ecd562c03ab77742fd0dd08550",
      width: 95,
    },
    style: {
      grow: false,
      align: "center",
    },
  },
  {
    id: uuid(),
    type: "text",
    value: {
      value: [
        {
          type: "paragraph",
          align: "left",
          children: [{ text: "Creature - Cat", bold: true, fontSize: 18 }],
        },
      ],
      variant: "banner",
      expand: false,
      width: 100,
    },
    style: {
      grow: false,
      align: "center",
    },
  },
  {
    id: uuid(),
    type: "text",
    value: {
      value: [
        {
          type: "paragraph",
          align: "left",
          lineHeight: 120,
          children: [
            {
              text: "This creature enters with eight revival counters on it if you cast it.",
              italic: true,
              fontSize: 18,
            },
          ],
        },
        {
          type: "paragraph",
          align: "left",
          lineHeight: 120,
          children: [
            {
              text: "When this creature dies, if it had a revival counter on it, return it to the battlefield with one fewer revival counter on it at the beginning of the next end step.",
              italic: true,
              fontSize: 18,
            },
          ],
        },
      ],
      variant: "box",
      expand: true,
      width: 95,
    },
    style: { grow: true, align: "center" },
  },
];

/**
 * useElementRegistry is the core Zustand store managing the state of 
 * the card currently being edited. It handles element creation, deletion, 
 * reordering, and fine-grained property updates.
 */
export const useElementRegistry = create<ElementRegistry>((set, get) => ({
  elements: DEFAULT_CARD,
  activeSettingsId: undefined,

  setActiveSettingsId: (id) => set({ activeSettingsId: id }),

  registerElement: (type, initialValue = {}) => {
    const id = `${type}-${uuid()}`;
    let newElement: Element;

    if (type === "text") {
      newElement = ElementSchema.parse({
        id,
        type: "text",
        value: TextElementSchema.parse(initialValue),
      });
    } else if (type === "image") {
      newElement = ElementSchema.parse({
        id,
        type: "image",
        value: ImageElementSchema.parse(initialValue),
      });
    } else {
      throw new Error(`Unsupported element type: ${type}`);
    }

    set((state) => ({
      elements: [...state.elements, newElement],
    }));
  },

  unregisterElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((element) => element.id !== id),
    }));
  },

  moveElement: (fromIndex, toIndex) => {
    set((state) => {
      if (
        fromIndex < 0 ||
        fromIndex >= state.elements.length ||
        toIndex < 0 ||
        toIndex >= state.elements.length
      ) {
        return state;
      }

      const newElements = [...state.elements];
      const [removed] = newElements.splice(fromIndex, 1);
      newElements.splice(toIndex, 0, removed);

      return { elements: newElements };
    });
  },

  updateElement: (id, value) => {
    set((state) => {
      const index = state.elements.findIndex((e) => e.id === id);
      if (index === -1) return state;

      const currentElement = state.elements[index];
      const updatedElement = {
        ...currentElement,
        value: {
          ...currentElement.value,
          ...value,
        },
      } as Element;

      const newElements = [...state.elements];
      newElements[index] = updatedElement;

      return { elements: newElements };
    });
  },

  updateStyle: (id, style) => {
    set((state) => {
      const index = state.elements.findIndex((e) => e.id === id);
      if (index === -1) return state;

      const currentElement = state.elements[index];
      const updatedElement = {
        ...currentElement,
        style: {
          ...currentElement.style,
          ...style,
        },
      } as Element;

      const newElements = [...state.elements];
      newElements[index] = updatedElement;

      return { elements: newElements };
    });
  },

  getElement: (id) => {
    return get().elements.find((element) => element.id === id);
  },

  loadCard: (elements, cardId) => set(() => ({ elements, cardId })),

  reset(withDefault = false) {
    set(() => ({
      elements: withDefault ? DEFAULT_CARD : [],
      cardId: undefined,
    }));
  },
}));
