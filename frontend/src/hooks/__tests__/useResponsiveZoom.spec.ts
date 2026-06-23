import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useResponsiveZoom } from "../useResponsiveZoom";

describe("useResponsiveZoom", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 1080,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a zoom value based on available viewport height", () => {
    const { result } = renderHook(() => useResponsiveZoom());
    expect(result.current.zoom).toBeGreaterThan(0);
    expect(result.current.zoom).toBeLessThanOrEqual(1);
    expect(result.current.isColumn).toBe(false);
  });

  it("returns isColumn true when viewport height is too small", () => {
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 400,
    });

    // With 400px viewport, required 640px for card, ratio = 400/640 = 0.625 < 0.65
    const { result } = renderHook(() => useResponsiveZoom());
    expect(result.current.isColumn).toBe(true);
  });

  it("returns isColumn false when viewport is large enough", () => {
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 1200,
    });

    const { result } = renderHook(() => useResponsiveZoom());
    expect(result.current.isColumn).toBe(false);
    expect(result.current.zoom).toBe(1);
  });

  it("reacts to window resize events", () => {
    const { result } = renderHook(() => useResponsiveZoom());

    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 300,
    });

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    // The hook debounces for 200ms, so advance timers
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.isColumn).toBe(true);
  });

  it("zoom is never greater than 1", () => {
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 2000,
    });

    const { result } = renderHook(() => useResponsiveZoom());
    expect(result.current.zoom).toBe(1);
  });
});
