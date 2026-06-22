import { describe, it, expect, beforeEach } from "vitest";
import { useActiveCardStore } from "../../stores/useActiveCardStore";

describe("useActiveCardStore", () => {
  beforeEach(() => {
    useActiveCardStore.getState().reset(true);
  });

  it("initializes with default card elements", () => {
    const { elements, theme } = useActiveCardStore.getState();
    expect(elements.length).toBeGreaterThan(0);
    expect(elements.some((e) => e.type === "text")).toBe(true);
    expect(elements.some((e) => e.type === "image")).toBe(true);
    expect(theme.fill).toBe("#48534b");
  });

  it("resets to empty state when withDefault is false", () => {
    useActiveCardStore.getState().reset(false);
    expect(useActiveCardStore.getState().elements).toEqual([]);
  });

  it("registerElement adds a text element", () => {
    useActiveCardStore.getState().reset(false);
    useActiveCardStore.getState().registerElement("text", {
      variant: "box",
      value: [{ type: "paragraph", children: [{ text: "Hello" }] }],
    });
    const { elements } = useActiveCardStore.getState();
    expect(elements).toHaveLength(1);
    expect(elements[0].type).toBe("text");
    expect(elements[0].value).toHaveProperty("variant", "box");
  });

  it("registerElement adds an image element", () => {
    useActiveCardStore.getState().reset(false);
    useActiveCardStore.getState().registerElement("image", {
      src: "data:image/png;base64,abc",
      radius: 8,
    });
    const { elements } = useActiveCardStore.getState();
    expect(elements).toHaveLength(1);
    expect(elements[0].type).toBe("image");
    expect(elements[0].value).toHaveProperty("radius", 8);
  });

  it("registerElement throws for unsupported type", () => {
    useActiveCardStore.getState().reset(false);
    expect(() =>
      useActiveCardStore.getState().registerElement("unknown" as never),
    ).toThrow("Unsupported element type: unknown");
  });

  it("unregisterElement removes an element by id", () => {
    const initial = useActiveCardStore.getState().elements;
    const idToRemove = initial[0].id;
    useActiveCardStore.getState().unregisterElement(idToRemove);
    const { elements } = useActiveCardStore.getState();
    expect(elements.find((e) => e.id === idToRemove)).toBeUndefined();
    expect(elements).toHaveLength(initial.length - 1);
  });

  it("moveElement reorders elements", () => {
    useActiveCardStore.getState().reset(false);
    const store = useActiveCardStore.getState();
    store.registerElement("text", {
      value: [{ type: "paragraph", children: [{ text: "A" }] }],
    });
    store.registerElement("text", {
      value: [{ type: "paragraph", children: [{ text: "B" }] }],
    });
    store.registerElement("text", {
      value: [{ type: "paragraph", children: [{ text: "C" }] }],
    });

    const idsBefore = useActiveCardStore.getState().elements.map((e) => e.id);
    useActiveCardStore.getState().moveElement(0, 2);

    const idsAfter = useActiveCardStore.getState().elements.map((e) => e.id);
    // Element at index 0 should now be the former index 1 (original second element)
    expect(idsAfter[0]).toBe(idsBefore[1]);
    expect(idsAfter[2]).toBe(idsBefore[0]);
  });

  it("moveElement ignores out-of-bounds indices", () => {
    const before = useActiveCardStore.getState().elements;
    useActiveCardStore.getState().moveElement(-1, 0);
    expect(useActiveCardStore.getState().elements).toEqual(before);
    useActiveCardStore.getState().moveElement(0, 999);
    expect(useActiveCardStore.getState().elements).toEqual(before);
  });

  it("updateElement modifies element value", () => {
    const { elements } = useActiveCardStore.getState();
    const target = elements[0];
    useActiveCardStore.getState().updateElement(target.id, {
      variant: "box",
    });
    const updated = useActiveCardStore.getState().getElement(target.id);
    expect(updated?.value).toHaveProperty("variant", "box");
  });

  it("updateElement ignores nonexistent id", () => {
    const before = useActiveCardStore.getState().elements;
    useActiveCardStore.getState().updateElement("nonexistent", { variant: "box" } as never);
    expect(useActiveCardStore.getState().elements).toEqual(before);
  });

  it("updateStyle modifies element style", () => {
    const { elements } = useActiveCardStore.getState();
    const target = elements[0];
    useActiveCardStore.getState().updateStyle(target.id, { grow: true });
    const updated = useActiveCardStore.getState().getElement(target.id);
    expect(updated?.style.grow).toBe(true);
  });

  it("getElement returns undefined for nonexistent id", () => {
    expect(useActiveCardStore.getState().getElement("nonexistent")).toBeUndefined();
  });

  it("setTheme merges partial theme updates", () => {
    useActiveCardStore.getState().setTheme({ fill: "#ffffff" });
    const { theme } = useActiveCardStore.getState();
    expect(theme.fill).toBe("#ffffff");
    expect(theme.stroke).toBe("#3b3939");
  });

  it("loadCard replaces elements, theme, and identifiers", () => {
    const card = {
      elements: [
        {
          id: "imported-1",
          type: "text" as const,
          value: {
            variant: "banner" as const,
            value: [{ type: "paragraph" as const, children: [{ text: "Imported" }] }],
          },
          style: { grow: false, align: "center" as const },
        },
      ],
      theme: {
        fill: "#000",
        bannerFill: "#111",
        boxFill: "#222",
        stroke: "#333",
        bannerText: "#444",
        boxText: "#555",
      },
      id: "deck-id-123",
      cloudCardId: "cloud-id-456",
    };
    useActiveCardStore.getState().loadCard(card);
    const state = useActiveCardStore.getState();
    expect(state.elements).toHaveLength(1);
    expect(state.elements[0].id).toBe("imported-1");
    expect(state.cardId).toBe("deck-id-123");
    expect(state.cloudCardId).toBe("cloud-id-456");
    expect(state.theme.fill).toBe("#000");
  });

  it("setCloudCardId stores the cloud card id", () => {
    useActiveCardStore.getState().setCloudCardId("cloud-789");
    expect(useActiveCardStore.getState().cloudCardId).toBe("cloud-789");
  });

  it("setActiveSettingsId tracks active element", () => {
    useActiveCardStore.getState().setActiveSettingsId("el-1");
    expect(useActiveCardStore.getState().activeSettingsId).toBe("el-1");
    useActiveCardStore.getState().setActiveSettingsId(undefined);
    expect(useActiveCardStore.getState().activeSettingsId).toBeUndefined();
  });
});
