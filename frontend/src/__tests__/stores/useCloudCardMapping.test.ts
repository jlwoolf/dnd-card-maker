import { describe, it, expect, beforeEach } from "vitest";
import { useCloudCardMapping } from "../../stores/useCloudCardMapping";

describe("useCloudCardMapping", () => {
  beforeEach(() => {
    useCloudCardMapping.getState().reset();
  });

  it("starts with empty mapping", () => {
    expect(useCloudCardMapping.getState().mapping).toEqual({});
  });

  it("setMapping stores a local-to-cloud id pair", () => {
    useCloudCardMapping.getState().setMapping("local-1", "cloud-a");
    expect(useCloudCardMapping.getState().mapping).toEqual({ "local-1": "cloud-a" });
  });

  it("getCloudId returns the cloud id for a known local id", () => {
    useCloudCardMapping.getState().setMapping("local-1", "cloud-a");
    expect(useCloudCardMapping.getState().getCloudId("local-1")).toBe("cloud-a");
  });

  it("getCloudId returns undefined for an unknown local id", () => {
    expect(useCloudCardMapping.getState().getCloudId("unknown")).toBeUndefined();
  });

  it("removeMapping deletes a specific mapping", () => {
    useCloudCardMapping.getState().setMapping("local-1", "cloud-a");
    useCloudCardMapping.getState().setMapping("local-2", "cloud-b");
    useCloudCardMapping.getState().removeMapping("local-1");
    expect(useCloudCardMapping.getState().mapping).toEqual({ "local-2": "cloud-b" });
  });

  it("setMapping overwrites an existing mapping", () => {
    useCloudCardMapping.getState().setMapping("local-1", "cloud-a");
    useCloudCardMapping.getState().setMapping("local-1", "cloud-c");
    expect(useCloudCardMapping.getState().getCloudId("local-1")).toBe("cloud-c");
  });

  it("reset clears all mappings", () => {
    useCloudCardMapping.getState().setMapping("local-1", "cloud-a");
    useCloudCardMapping.getState().setMapping("local-2", "cloud-b");
    useCloudCardMapping.getState().reset();
    expect(useCloudCardMapping.getState().mapping).toEqual({});
  });
});
