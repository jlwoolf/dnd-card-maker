import { describe, it, expect } from "vitest";
import { ELEMENT_REGISTRY } from "../registry";

describe("ELEMENT_REGISTRY", () => {
  it("contains text and image keys", () => {
    expect(ELEMENT_REGISTRY).toHaveProperty("text");
    expect(ELEMENT_REGISTRY).toHaveProperty("image");
  });

  it("text element has editor and preview components", () => {
    const textDef = ELEMENT_REGISTRY.text;
    expect(textDef).toHaveProperty("editor");
    expect(textDef).toHaveProperty("preview");
    expect(typeof textDef.editor).toBe("function");
    expect(typeof textDef.preview).toBe("function");
  });

  it("image element has editor and preview components", () => {
    const imageDef = ELEMENT_REGISTRY.image;
    expect(imageDef).toHaveProperty("editor");
    expect(imageDef).toHaveProperty("preview");
    expect(typeof imageDef.editor).toBe("function");
    expect(typeof imageDef.preview).toBe("function");
  });

  it("has exactly two element types", () => {
    const keys = Object.keys(ELEMENT_REGISTRY);
    expect(keys).toHaveLength(2);
  });
});
