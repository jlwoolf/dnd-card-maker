import { describe, it, expect } from "vitest";
import { PreviewThemeSchema, DEFAULT_THEME } from "../../schemas/theme";

describe("PreviewThemeSchema", () => {
  it("accepts a valid theme object", () => {
    const result = PreviewThemeSchema.safeParse(DEFAULT_THEME);
    expect(result.success).toBe(true);
  });

  it("accepts arbitrary color strings", () => {
    const result = PreviewThemeSchema.safeParse({
      fill: "red",
      bannerFill: "#fff",
      boxFill: "rgb(0,0,0)",
      stroke: "hsla(0,0%,0%,1)",
      bannerText: "transparent",
      boxText: "inherit",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a theme missing required fields", () => {
    const result = PreviewThemeSchema.safeParse({ fill: "#111" });
    expect(result.success).toBe(false);
  });

  it("DEFAULT_THEME has all required fields", () => {
    expect(DEFAULT_THEME).toHaveProperty("fill");
    expect(DEFAULT_THEME).toHaveProperty("bannerFill");
    expect(DEFAULT_THEME).toHaveProperty("boxFill");
    expect(DEFAULT_THEME).toHaveProperty("stroke");
    expect(DEFAULT_THEME).toHaveProperty("bannerText");
    expect(DEFAULT_THEME).toHaveProperty("boxText");
  });
});
