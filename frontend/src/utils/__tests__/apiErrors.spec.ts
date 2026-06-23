import { describe, it, expect } from "vitest";
import { extractApiError } from "../apiErrors";

describe("extractApiError", () => {
  it("returns detail string from an Axios-like error", () => {
    const error = {
      response: {
        data: {
          detail: "Invalid email or password",
        },
      },
    };

    const result = extractApiError(error, "Something went wrong");
    expect(result).toBe("Invalid email or password");
  });

  it("returns fallback when response.data.detail is missing", () => {
    const error = {
      response: {
        data: {},
      },
    };

    const result = extractApiError(error, "An error occurred");
    expect(result).toBe("An error occurred");
  });

  it("returns fallback when response is missing", () => {
    const error = new Error("Network error");

    const result = extractApiError(error, "Connection failed");
    expect(result).toBe("Connection failed");
  });

  it("returns fallback when detail is not a string", () => {
    const error = {
      response: {
        data: {
          detail: 12345,
        },
      },
    };

    const result = extractApiError(error, "Unexpected error");
    expect(result).toBe("Unexpected error");
  });

  it("handles null error gracefully", () => {
    const result = extractApiError(null, "Default fallback");
    expect(result).toBe("Default fallback");
  });

  it("handles undefined error gracefully", () => {
    const result = extractApiError(undefined, "Default fallback");
    expect(result).toBe("Default fallback");
  });
});
