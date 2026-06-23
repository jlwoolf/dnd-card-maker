import { describe, it, expect, beforeEach, vi } from "vitest";
import { getCardImageUrl, getCardPreviewSrc } from "../cardImageUrl";

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv("BASE_URL", "/");
});

describe("getCardImageUrl", () => {
  it("constructs a URL with scale parameter and auth token", () => {
    localStorage.setItem("access_token", "test-token-123");

    const url = getCardImageUrl("card-abc", 0.25);
    expect(url).toContain("/api/images/card-abc");
    expect(url).toContain("scale=0.25");
    expect(url).toContain("token=test-token-123");
  });

  it("uses default scale of 0.25 when not provided", () => {
    localStorage.setItem("access_token", "tkn");

    const url = getCardImageUrl("card-xyz");
    expect(url).toContain("scale=0.25");
  });

  it("omits token parameter when no access token is stored", () => {
    const url = getCardImageUrl("card-no-token");
    expect(url).toContain("scale=0.25");
    expect(url).not.toContain("token=");
  });

  it("uses custom scale when provided", () => {
    localStorage.setItem("access_token", "tkn");

    const url = getCardImageUrl("card-custom", 0.5);
    expect(url).toContain("scale=0.5");
  });
});

describe("getCardPreviewSrc", () => {
  it("returns thumbnailUrl when available", () => {
    const result = getCardPreviewSrc({
      thumbnailUrl: "data:image/thumb;base64,abc",
      imgUrl: "data:image/full;base64,def",
    });

    expect(result).toBe("data:image/thumb;base64,abc");
  });

  it("returns imgUrl when thumbnailUrl is not available", () => {
    const result = getCardPreviewSrc({
      imgUrl: "data:image/full;base64,def",
    });

    expect(result).toBe("data:image/full;base64,def");
  });

  it("falls back to backend image endpoint when only cloudCardId is available", () => {
    localStorage.setItem("access_token", "tkn");
    const result = getCardPreviewSrc({
      imgUrl: "",
      cloudCardId: "cloud-789",
    });

    expect(result).toContain("/api/images/cloud-789");
  });

  it("returns empty string when no image source is available", () => {
    const result = getCardPreviewSrc({
      imgUrl: "",
    });

    expect(result).toBe("");
  });

  it("prefers thumbnailUrl over imgUrl even when both are present", () => {
    const result = getCardPreviewSrc({
      thumbnailUrl: "thumb-url",
      imgUrl: "full-url",
    });

    expect(result).toBe("thumb-url");
  });
});
