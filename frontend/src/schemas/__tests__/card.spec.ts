import { describe, it, expect } from "vitest";
import { CardSchema } from "../card";
import { DEFAULT_THEME } from "../theme";

describe("CardSchema", () => {
  const validCard = {
    id: "card-1",
    elements: [
      {
        id: "el-1",
        type: "text",
        value: {
          variant: "banner",
          value: [{ type: "paragraph", children: [{ text: "Hello" }] }],
        },
        style: { grow: false, align: "center" },
      },
    ],
    imgUrl: "data:image/png;base64,abc",
    theme: DEFAULT_THEME,
  };

  it("accepts a valid card", () => {
    const result = CardSchema.safeParse(validCard);
    expect(result.success).toBe(true);
  });

  it("accepts a card with optional cloudCardId", () => {
    const result = CardSchema.safeParse({ ...validCard, cloudCardId: "cloud-1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cloudCardId).toBe("cloud-1");
    }
  });

  it("rejects a card missing required fields", () => {
    const result = CardSchema.safeParse({ id: "card-1" });
    expect(result.success).toBe(false);
  });

  it("rejects a card with empty elements array", () => {
    // empty elements array is valid
    const result = CardSchema.safeParse({ ...validCard, elements: [] });
    expect(result.success).toBe(true);
  });

  it("rejects invalid element types in elements array", () => {
    const result = CardSchema.safeParse({
      ...validCard,
      elements: [{ id: "bad", type: "video", value: {}, style: {} }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts an image element in elements", () => {
    const result = CardSchema.safeParse({
      ...validCard,
      elements: [
        {
          id: "img-1",
          type: "image",
          value: { src: "https://example.com/img.jpg" },
          style: { grow: false, align: "center" },
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
