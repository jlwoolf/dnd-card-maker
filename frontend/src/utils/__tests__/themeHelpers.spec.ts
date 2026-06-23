import { describe, it, expect } from "vitest";
import { themeFromSnake, themeToSnake } from "../themeHelpers";
import type { SnakeTheme } from "@src/services/api";
import type { PreviewTheme } from "@src/schemas";

describe("themeFromSnake", () => {
  it("converts snake_case API theme to camelCase PreviewTheme", () => {
    const snake: SnakeTheme = {
      fill: "#111111",
      banner_fill: "#222222",
      box_fill: "#333333",
      stroke: "#444444",
      banner_text: "#555555",
      box_text: "#666666",
    };

    const result = themeFromSnake(snake);

    expect(result).toEqual({
      fill: "#111111",
      bannerFill: "#222222",
      boxFill: "#333333",
      stroke: "#444444",
      bannerText: "#555555",
      boxText: "#666666",
    });
  });
});

describe("themeToSnake", () => {
  it("converts camelCase PreviewTheme to snake_case for API", () => {
    const camel: PreviewTheme = {
      fill: "#aaaaaa",
      bannerFill: "#bbbbbb",
      boxFill: "#cccccc",
      stroke: "#dddddd",
      bannerText: "#eeeeee",
      boxText: "#ffffff",
    };

    const result = themeToSnake(camel);

    expect(result).toEqual({
      fill: "#aaaaaa",
      banner_fill: "#bbbbbb",
      box_fill: "#cccccc",
      stroke: "#dddddd",
      banner_text: "#eeeeee",
      box_text: "#ffffff",
    });
  });

  it("round-trips back to original after snake→camel→snake", () => {
    const original: SnakeTheme = {
      fill: "#111",
      banner_fill: "#222",
      box_fill: "#333",
      stroke: "#444",
      banner_text: "#555",
      box_text: "#666",
    };

    const result = themeToSnake(themeFromSnake(original));
    expect(result).toEqual(original);
  });
});
