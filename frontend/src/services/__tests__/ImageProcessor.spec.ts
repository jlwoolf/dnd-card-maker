import { describe, it, expect, vi, afterEach } from "vitest";
import { ImageProcessor } from "../ImageProcessor";

describe("ImageProcessor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("toDataUrl", () => {
    it("returns data: URIs unchanged", async () => {
      const dataUri = "data:image/png;base64,iVBORw0KGgo=";
      const result = await ImageProcessor.toDataUrl(dataUri);
      expect(result).toBe(dataUri);
    });

    it("converts a blob URL to a data URL via FileReader", async () => {
      const fakeDataUrl = "data:image/png;base64,ZmFrZS1pbWFnZS1kYXRh";

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(["fake-image-data"], { type: "image/png" })),
      } as Response);

      vi.stubGlobal("FileReader", function (this: { readAsDataURL: (b: Blob) => void; result: string; onloadend: (() => void) | null }) {
        this.readAsDataURL = () => {};
        this.result = fakeDataUrl;
        setTimeout(() => { if (this.onloadend) this.onloadend(); }, 0);
        return this;
      });

      const result = await ImageProcessor.toDataUrl("blob:http://localhost/fake");
      expect(result).toBe(fakeDataUrl);
    });
  });

  describe("getSafeUrl", () => {
    it("returns data URL for remote URLs via proxy", async () => {
      const fakeDataUrl = "data:image/png;base64,safe";

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(["img"], { type: "image/png" })),
      } as Response);

      vi.stubGlobal("FileReader", function (this: { readAsDataURL: (b: Blob) => void; result: string; onloadend: (() => void) | null }) {
        this.readAsDataURL = () => {};
        this.result = fakeDataUrl;
        setTimeout(() => { if (this.onloadend) this.onloadend(); }, 0);
        return this;
      });

      const result = await ImageProcessor.getSafeUrl("https://example.com/remote.png");
      expect(result).toBe(fakeDataUrl);
    });
  });

  describe("generateThumbnail", () => {
    it("scales a data URL image to a smaller canvas", async () => {
      const canvasMock = {
        getContext: vi.fn().mockReturnValue({ drawImage: vi.fn() }),
        toDataURL: vi.fn().mockReturnValue("data:image/png;base64,thumb"),
        width: 0,
        height: 0,
      };

      vi.stubGlobal("document", {
        createElement: vi.fn().mockReturnValue(canvasMock),
      });

      vi.stubGlobal("Image", function (this: { onload: (() => void) | null; width: number; height: number }) {
        this.onload = null;
        this.width = 200;
        this.height = 200;
        setTimeout(() => { if (this.onload) this.onload(); }, 0);
        return this;
      });

      const result = await ImageProcessor.generateThumbnail("data:image/png;base64,test", 0.25);
      expect(result).toBe("data:image/png;base64,thumb");
    });
  });

  describe("compressToJpeg", () => {
    it("compresses an image into JPEG format", async () => {
      const canvasMock = {
        getContext: vi.fn().mockReturnValue({ drawImage: vi.fn() }),
        toDataURL: vi.fn().mockReturnValue("data:image/jpeg;base64,compressed"),
        width: 0,
        height: 0,
      };

      vi.stubGlobal("document", {
        createElement: vi.fn().mockReturnValue(canvasMock),
      });

      vi.stubGlobal("Image", function (this: { onload: (() => void) | null; width: number; height: number }) {
        this.onload = null;
        this.width = 400;
        this.height = 300;
        setTimeout(() => { if (this.onload) this.onload(); }, 0);
        return this;
      });

      const result = await ImageProcessor.compressToJpeg("data:image/png;base64,test", 0.8, 1280);
      expect(result).toBe("data:image/jpeg;base64,compressed");
    });
  });
});
