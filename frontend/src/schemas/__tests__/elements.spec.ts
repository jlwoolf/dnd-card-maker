import { describe, it, expect } from "vitest";
import { ElementSchema, TextElementSchema, ImageElementSchema } from "../elements";

describe("TextElementSchema", () => {
  it("parses a valid text element value with defaults", () => {
    const result = TextElementSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variant).toBe("banner");
      expect(result.data.width).toBe(100);
      expect(result.data.expand).toBe(false);
    }
  });

  it("parses custom variant and width", () => {
    const result = TextElementSchema.safeParse({ variant: "box", width: 75 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variant).toBe("box");
      expect(result.data.width).toBe(75);
    }
  });

  it("rejects width below 50", () => {
    const result = TextElementSchema.safeParse({ width: 30 });
    expect(result.success).toBe(false);
  });

  it("rejects width above 100", () => {
    const result = TextElementSchema.safeParse({ width: 150 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid variant", () => {
    const result = TextElementSchema.safeParse({ variant: "sidebar" });
    expect(result.success).toBe(false);
  });
});

describe("ImageElementSchema", () => {
  it("parses a valid image element with defaults", () => {
    const result = ImageElementSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.radius).toBe(4);
      expect(result.data.src).toBe("");
      expect(result.data.width).toBe(100);
    }
  });

  it("parses custom radius and src", () => {
    const result = ImageElementSchema.safeParse({ radius: 8, src: "https://example.com/img.jpg" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.radius).toBe(8);
      expect(result.data.src).toBe("https://example.com/img.jpg");
    }
  });

  it("rejects radius below 0", () => {
    const result = ImageElementSchema.safeParse({ radius: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects radius above 10", () => {
    const result = ImageElementSchema.safeParse({ radius: 20 });
    expect(result.success).toBe(false);
  });
});

describe("ElementSchema", () => {
  it("parses a valid text element", () => {
    const result = ElementSchema.safeParse({
      id: "el-1",
      type: "text",
      value: {
        variant: "banner",
        value: [{ type: "paragraph", children: [{ text: "Hello" }] }],
      },
    });
    expect(result.success).toBe(true);
  });

  it("parses a valid image element", () => {
    const result = ElementSchema.safeParse({
      id: "img-1",
      type: "image",
      value: { src: "data:image/png;base64,abc" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an element without id", () => {
    const result = ElementSchema.safeParse({
      type: "text",
      value: { variant: "banner" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an element with invalid type", () => {
    const result = ElementSchema.safeParse({
      id: "el-1",
      type: "video",
      value: { src: "test" },
    });
    expect(result.success).toBe(false);
  });

  it("applies default style when omitted", () => {
    const result = ElementSchema.safeParse({
      id: "el-2",
      type: "text",
      value: {
        variant: "box",
        value: [{ type: "paragraph", children: [{ text: "T" }] }],
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.style.grow).toBe(false);
      expect(result.data.style.align).toBe("center");
    }
  });
});
