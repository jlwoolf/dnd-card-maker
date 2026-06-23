import { describe, it, expect } from "vitest";
import { mergeSx } from "../mergeSx";
import type { SxProps, Theme } from "@mui/material";

const mockTheme = {} as Theme;

describe("mergeSx", () => {
  it("merges multiple plain SxProps objects", () => {
    const a: SxProps<Theme> = { color: "red" };
    const b: SxProps<Theme> = { fontSize: 14 };

    const result = mergeSx(a, b);
    expect(typeof result).toBe("function");
    expect((result as (t: Theme) => object)(mockTheme)).toEqual({
      color: "red",
      fontSize: 14,
    });
  });

  it("higher-indexed styles take precedence", () => {
    const a: SxProps<Theme> = { color: "red", padding: 8 };
    const b: SxProps<Theme> = { color: "blue" };

    const result = mergeSx(a, b);
    expect((result as (t: Theme) => object)(mockTheme)).toEqual({
      color: "blue",
      padding: 8,
    });
  });

  it("skips null and undefined values", () => {
    const a: SxProps<Theme> = { color: "red" };

    const result = mergeSx(a, null, undefined as never, { fontSize: 12 });
    expect((result as (t: Theme) => object)(mockTheme)).toEqual({
      color: "red",
      fontSize: 12,
    });
  });

  it("skips true values (boolean short-circuit)", () => {
    const a: SxProps<Theme> = { color: "red" };

    const result = mergeSx(a, true, { fontSize: 16 });
    expect((result as (t: Theme) => object)(mockTheme)).toEqual({
      color: "red",
      fontSize: 16,
    });
  });

  it("resolves callback-based SxProps", () => {
    const a: SxProps<Theme> = (theme: Theme) => ({ color: "green", themePresent: !!theme });

    const result = mergeSx(a);
    const resolved = (result as (t: Theme) => object)(mockTheme);
    expect(resolved).toEqual({ color: "green", themePresent: true });
  });

  it("merges nested arrays of SxProps", () => {
    const a: SxProps<Theme> = { fontWeight: 700 };
    const b: SxProps<Theme> = [{ color: "blue" }, { fontSize: 20 }];

    const result = mergeSx(a, b);
    expect((result as (t: Theme) => object)(mockTheme)).toEqual({
      fontWeight: 700,
      color: "blue",
      fontSize: 20,
    });
  });

  it("returns empty object when no styles provided", () => {
    const result = mergeSx();
    expect((result as (t: Theme) => object)(mockTheme)).toEqual({});
  });
});
