import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createNFTMetadata,
  validateImageFile,
  compressImage,
  createImagePreview,
  revokeImagePreview,
} from "@/utils/nftMetadata";

describe("nftMetadata utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createNFTMetadata", () => {
    it("should create valid metadata with required fields", () => {
      const input = {
        name: "Test NFT",
        description: "A test NFT",
      };

      const result = createNFTMetadata(input);

      expect(result.name).toBe("Test NFT");
      expect(result.description).toBe("A test NFT");
    });

    it("should include optional fields when provided", () => {
      const input = {
        name: "Test NFT",
        description: "A test NFT",
        external_url: "https://example.com/nft/1",
        attributes: [
          { trait_type: "Background", value: "Blue" },
          { trait_type: "Rarity", value: 5 },
        ],
      };

      const result = createNFTMetadata(input);

      expect(result.external_url).toBe("https://example.com/nft/1");
      expect(result.attributes).toHaveLength(2);
      expect(result.attributes?.[0]).toEqual({
        trait_type: "Background",
        value: "Blue",
      });
    });

    it("should trim whitespace from name and description", () => {
      const input = {
        name: "  Test NFT  ",
        description: "  A test NFT  ",
      };

      const result = createNFTMetadata(input);

      expect(result.name).toBe("Test NFT");
      expect(result.description).toBe("A test NFT");
    });

    it("should trim whitespace from attributes", () => {
      const input = {
        name: "Test NFT",
        description: "A test NFT",
        attributes: [
          { trait_type: "  Background  ", value: "  Blue  " },
        ],
      };

      const result = createNFTMetadata(input);

      expect(result.attributes?.[0]).toEqual({
        trait_type: "Background",
        value: "Blue",
      });
    });

    it("should throw error when name is empty", () => {
      const input = {
        name: "",
        description: "A test NFT",
      };

      expect(() => createNFTMetadata(input)).toThrow(
        "NFT name is required"
      );
    });

    it("should throw error when name is only whitespace", () => {
      const input = {
        name: "   ",
        description: "A test NFT",
      };

      expect(() => createNFTMetadata(input)).toThrow(
        "NFT name is required"
      );
    });

    it("should throw error when description is empty", () => {
      const input = {
        name: "Test NFT",
        description: "",
      };

      expect(() => createNFTMetadata(input)).toThrow(
        "NFT description is required"
      );
    });
  });

  describe("validateImageFile", () => {
    it("should accept valid PNG file", () => {
      const file = new File(["content"], "test.png", { type: "image/png" });
      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept valid JPEG file", () => {
      const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
    });

    it("should accept valid GIF file", () => {
      const file = new File(["content"], "test.gif", { type: "image/gif" });
      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
    });

    it("should accept valid WebP file", () => {
      const file = new File(["content"], "test.webp", { type: "image/webp" });
      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
    });

    it("should accept valid SVG file", () => {
      const file = new File(["content"], "test.svg", { type: "image/svg+xml" });
      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
    });

    it("should reject invalid file type", () => {
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid file type");
    });

    it("should reject files larger than max size", () => {
      const content = new ArrayBuffer(11 * 1024 * 1024); // 11MB
      const file = new File([content], "large.png", { type: "image/png" });
      const result = validateImageFile(file, 10);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("File size too large");
      expect(result.error).toContain("10MB");
    });

    it("should accept files at exactly max size", () => {
      const content = new ArrayBuffer(10 * 1024 * 1024); // 10MB
      const file = new File([content], "exact.png", { type: "image/png" });
      const result = validateImageFile(file, 10);

      expect(result.valid).toBe(true);
    });

    it("should use default max size of 10MB when not specified", () => {
      const content = new ArrayBuffer(11 * 1024 * 1024); // 11MB
      const file = new File([content], "large.png", { type: "image/png" });
      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
    });
  });

  describe("compressImage", () => {
    it("should compress image and return File object", async () => {
      const file = new File(["content"], "test.png", { type: "image/png" });

      // Mock canvas operations
      const mockToBlob = vi.fn((callback) => {
        const blob = new Blob(["compressed"], { type: "image/jpeg" });
        callback(blob);
      });

      const mockContext = {
        drawImage: vi.fn(),
      };

      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
        mockContext as any
      );
      vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
        mockToBlob
      );

      // Mock Image
      const MockImage = vi.fn().mockImplementation(function (this: any) {
        this.onload = null;
        this.onerror = null;
        this.width = 2000;
        this.height = 1500;
        this.src = "";

        const self = this;
        setTimeout(() => {
          if (self.onload) self.onload();
        }, 0);
        return this;
      });

      vi.stubGlobal("Image", MockImage);

      const result = await compressImage(file, 1920, 0.8);

      expect(result).toBeInstanceOf(File);
      expect(result.type).toBe("image/jpeg");
      expect(result.name).toBe("test.png");
    });

    it("should resize image to max width", async () => {
      const file = new File(["content"], "test.png", { type: "image/png" });

      const mockContext = {
        drawImage: vi.fn(),
      };

      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
        mockContext as any
      );
      vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
        (callback: (blob: Blob | null) => void) => {
          callback(new Blob(["compressed"], { type: "image/jpeg" }));
        }
      );

      const MockImage = vi.fn().mockImplementation(function (this: any) {
        this.onload = null;
        this.width = 3000;
        this.height = 2000;

        const self = this;
        setTimeout(() => {
          if (self.onload) self.onload();
        }, 0);
        return this;
      });

      vi.stubGlobal("Image", MockImage);

      await compressImage(file, 1920, 0.8);

      expect(mockContext.drawImage).toHaveBeenCalled();
    });

    it("should reject if image loading fails", async () => {
      const file = new File(["content"], "test.png", { type: "image/png" });

      const MockImage = vi.fn().mockImplementation(function (this: any) {
        this.onerror = null;

        const self = this;
        setTimeout(() => {
          if (self.onerror) self.onerror();
        }, 0);
        return this;
      });

      vi.stubGlobal("Image", MockImage);

      await expect(compressImage(file)).rejects.toThrow(
        "Failed to load image"
      );
    });
  });

  describe("createImagePreview", () => {
    it("should create object URL from file", () => {
      const file = new File(["content"], "test.png", { type: "image/png" });

      const mockUrl = "blob:http://localhost/test-url";
      vi.spyOn(URL, "createObjectURL").mockReturnValue(mockUrl);

      const result = createImagePreview(file);

      expect(result).toBe(mockUrl);
      expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    });
  });

  describe("revokeImagePreview", () => {
    it("should revoke object URL", () => {
      const url = "blob:http://localhost/test-url";
      const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

      revokeImagePreview(url);

      expect(revokeSpy).toHaveBeenCalledWith(url);
      
      revokeSpy.mockRestore();
    });
  });
});
