import { describe, it, expect, beforeEach } from "vitest";
import { useSnackbar } from "../useSnackbar";

describe("useSnackbar", () => {
  beforeEach(() => {
    useSnackbar.getState().closeSnackbar();
  });

  it("starts with snackbar closed", () => {
    const { open, message, severity } = useSnackbar.getState();
    expect(open).toBe(false);
    expect(message).toBe("");
    expect(severity).toBe("info");
  });

  it("showSnackbar sets message, severity, and opens", () => {
    useSnackbar.getState().showSnackbar("Card saved!", "success");

    const { open, message, severity } = useSnackbar.getState();
    expect(open).toBe(true);
    expect(message).toBe("Card saved!");
    expect(severity).toBe("success");
  });

  it("showSnackbar defaults severity to info", () => {
    useSnackbar.getState().showSnackbar("Something happened");

    const { open, severity } = useSnackbar.getState();
    expect(open).toBe(true);
    expect(severity).toBe("info");
  });

  it("closeSnackbar closes the snackbar", () => {
    useSnackbar.getState().showSnackbar("Error!", "error");
    useSnackbar.getState().closeSnackbar();

    expect(useSnackbar.getState().open).toBe(false);
  });

  it("severity persists across multiple calls", () => {
    useSnackbar.getState().showSnackbar("First", "warning");
    expect(useSnackbar.getState().severity).toBe("warning");

    useSnackbar.getState().showSnackbar("Second", "error");
    expect(useSnackbar.getState().severity).toBe("error");
  });
});
