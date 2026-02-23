import { v4 as uuid } from "uuid";
import { create } from "zustand";
import {
  DEFAULT_THEME,
  ElementSchema,
  ImageElementSchema,
  TextElementSchema,
  type Card,
  type Element,
  type ElementValue,
  type PreviewTheme,
} from "@src/schemas";

interface ActiveCardState {
  /** List of elements currently on the card */
  elements: Element[];
  /** Visual theme configuration for the current card */
  theme: PreviewTheme;
  /** Optional ID if editing an existing card from the deck */
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
  registerElement: <T extends Element["type"]>(
    type: T,
    initialValue?: Partial<ElementValue<T>>,
  ) => void;
  /** Unregisters an element by its unique ID */
  unregisterElement: (id: string) => void;
  /** Moves an element from one index to another (used for reordering) */
  moveElement: (fromIndex: number, toIndex: number) => void;
  /**
   * Updates the type-specific value of an element.
   *
   * @param id - Target element ID.
   * @param value - Partial update for the element's value object.
   */
  updateElement: <T extends Element["type"]>(
    id: string,
    value: Partial<ElementValue<T>>,
  ) => void;
  /**
   * Updates the generic layout style of an element.
   *
   * @param id - Target element ID.
   * @param value - Partial update for the style object.
   */
  updateStyle: (id: string, value: Partial<Element["style"]>) => void;
  /** Retrieves a single element by its ID */
  getElement: (id: string) => Element | undefined;
  /** Updates the current theme with partial data */
  setTheme: (theme: Partial<PreviewTheme>) => void;
  /** Loads an entire card into the active draft state */
  loadCard: (card: Pick<Card, "elements" | "theme"> & { id?: string }) => void;
  /**
   * Resets the active card state.
   *
   * @param withDefault - If true, populates the store with a sample card and default theme.
   */
  reset: (withDefault?: boolean) => void;
}

/**
 * Default sample card content shown when the application first loads.
 */
const DEFAULT_CARD_ELEMENTS: Element[] = [
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
 * useActiveCardStore is the unified Zustand store managing the entire active
 * card draft, including elements, visual theme, and editor state.
 */
export const useActiveCardStore = create<ActiveCardState>((set, get) => ({
  elements: DEFAULT_CARD_ELEMENTS,
  theme: DEFAULT_THEME,
  cardId: undefined,
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

  setTheme: (theme) =>
    set((state) => ({ ...state, theme: { ...state.theme, ...theme } })),

  loadCard: (card) =>
    set(() => ({
      elements: card.elements,
      theme: card.theme,
      cardId: card.id,
    })),

  reset(withDefault = false) {
    set(() => ({
      elements: withDefault ? DEFAULT_CARD_ELEMENTS : [],
      theme: DEFAULT_THEME,
      cardId: undefined,
      activeSettingsId: undefined,
    }));
  },
}));
