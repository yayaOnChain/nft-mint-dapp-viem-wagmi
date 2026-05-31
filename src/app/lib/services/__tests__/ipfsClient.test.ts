import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  uploadFileToIPFS,
  uploadMetadataToIPFS,
  uploadNFTToIPFS,
  ipfsToHttpUrl,
  type PinataUploadResult,
  type NFTMetadata,
} from "@/services/ipfsClient";

describe("ipfsClient", () => {
  const mockIpfsHash = "QmTestHash123456789";
  const API_BASE = "/api/pinata";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("uploadFileToIPFS", () => {
    it("should upload file successfully via API proxy", async () => {
      const mockFile = new File(["test content"], "test.png", {
        type: "image/png",
      });

      const mockResult: PinataUploadResult = {
        IpfsHash: mockIpfsHash,
        PinSize: 1024,
        Timestamp: "2024-01-01T00:00:00.000Z",
        gatewayUrl: "https://ipfs.io/ipfs/QmTestHash123456789",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      });

      const result = await uploadFileToIPFS(mockFile);

      expect(result).toEqual(mockResult);
      expect(global.fetch).toHaveBeenCalledWith(
        API_BASE,
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("should include file and metadata in FormData", async () => {
      const mockFile = new File(["test content"], "my-nft.png", {
        type: "image/png",
      });

      const mockResult: PinataUploadResult = {
        IpfsHash: mockIpfsHash,
        PinSize: 1024,
        Timestamp: "2024-01-01T00:00:00.000Z",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      });

      await uploadFileToIPFS(mockFile);

      expect(global.fetch).toHaveBeenCalled();
      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      expect(fetchCall?.[1]?.body).toBeInstanceOf(FormData);
    });

    it("should throw error when upload fails", async () => {
      const mockFile = new File(["test content"], "test.png", {
        type: "image/png",
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Upload failed" }),
      });

      await expect(uploadFileToIPFS(mockFile)).rejects.toThrow("Upload failed");
    });

    it("should handle network errors", async () => {
      const mockFile = new File(["test content"], "test.png", {
        type: "image/png",
      });

      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await expect(uploadFileToIPFS(mockFile)).rejects.toThrow("Network error");
    });

    it("should throw with error message from server", async () => {
      const mockFile = new File(["test content"], "test.png", {
        type: "image/png",
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid JWT token" }),
      });

      await expect(uploadFileToIPFS(mockFile)).rejects.toThrow("Invalid JWT token");
    });

    it("should use data.message as fallback error message", async () => {
      const mockFile = new File(["test"], "test.png", { type: "image/png" });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: "Server error occurred" }),
      });

      await expect(uploadFileToIPFS(mockFile)).rejects.toThrow("Server error occurred");
    });

    it("should use default error message when no error details provided", async () => {
      const mockFile = new File(["test"], "test.png", { type: "image/png" });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(uploadFileToIPFS(mockFile)).rejects.toThrow("Failed to upload to IPFS: 500");
    });

    it("should log error on upload failure", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockFile = new File(["test"], "test.png", { type: "image/png" });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      });

      await expect(uploadFileToIPFS(mockFile)).rejects.toThrow("Unauthorized");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("uploadMetadataToIPFS", () => {
    const mockMetadata: NFTMetadata = {
      name: "Test NFT",
      description: "A test NFT for testing",
      image: "ipfs://QmImageHash",
      attributes: [
        { trait_type: "Background", value: "Blue" },
        { trait_type: "Rarity", value: "Common" },
      ],
    };

    it("should upload metadata successfully via API proxy", async () => {
      const mockResult: PinataUploadResult = {
        IpfsHash: mockIpfsHash,
        PinSize: 512,
        Timestamp: "2024-01-01T00:00:00.000Z",
        gatewayUrl: "https://ipfs.io/ipfs/QmTestHash123456789",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      });

      const result = await uploadMetadataToIPFS(mockMetadata);

      expect(result).toEqual(mockResult);
      expect(global.fetch).toHaveBeenCalledWith(
        API_BASE,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
    });

    it("should send correct metadata structure", async () => {
      const mockResult: PinataUploadResult = {
        IpfsHash: mockIpfsHash,
        PinSize: 512,
        Timestamp: "2024-01-01T00:00:00.000Z",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      });

      await uploadMetadataToIPFS(mockMetadata);

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(fetchCall?.[1]?.body as string);

      expect(body.pinataContent).toEqual(mockMetadata);
      expect(body.pinataMetadata.name).toBe("Test NFT.json");
    });

    it("should throw error when metadata upload fails", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: "Invalid metadata format" }),
      });

      await expect(uploadMetadataToIPFS(mockMetadata)).rejects.toThrow(
        "Invalid metadata format"
      );
    });

    it("should use data.message as fallback error message for metadata", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ message: "Validation failed" }),
      });

      await expect(uploadMetadataToIPFS(mockMetadata)).rejects.toThrow("Validation failed");
    });

    it("should use default error message for metadata when no details provided", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "" }),
      });

      await expect(uploadMetadataToIPFS(mockMetadata)).rejects.toThrow("Failed to upload metadata to IPFS: 500");
    });

    it("should log error on metadata upload failure", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: "Bad request" }),
      });

      await expect(uploadMetadataToIPFS(mockMetadata)).rejects.toThrow("Bad request");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("uploadNFTToIPFS", () => {
    const mockImageFile = new File(["image data"], "nft-image.png", {
      type: "image/png",
    });

    const mockMetadata = {
      name: "Complete NFT",
      description: "A complete NFT with image and metadata",
      attributes: [{ trait_type: "Type", value: "Test" }],
    };

    const mockImageResult: PinataUploadResult = {
      IpfsHash: "QmImageHash123",
      PinSize: 2048,
      Timestamp: "2024-01-01T00:00:00.000Z",
      gatewayUrl: "https://ipfs.io/ipfs/QmImageHash123",
    };

    const mockMetadataResult: PinataUploadResult = {
      IpfsHash: "QmMetadataHash456",
      PinSize: 512,
      Timestamp: "2024-01-01T00:00:00.000Z",
      gatewayUrl: "https://ipfs.io/ipfs/QmMetadataHash456",
    };

    it("should upload image and metadata in sequence via API proxy", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockImageResult,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMetadataResult,
        });

      const result = await uploadNFTToIPFS(mockImageFile, mockMetadata);

      expect(result.imageHash).toBe("QmImageHash123");
      expect(result.metadataHash).toBe("QmMetadataHash456");
      expect(result.imageUrl).toBe("https://ipfs.io/ipfs/QmImageHash123");
      expect(result.metadataUrl).toBe("https://ipfs.io/ipfs/QmMetadataHash456");
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should include image IPFS URL in metadata", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockImageResult,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMetadataResult,
        });

      await uploadNFTToIPFS(mockImageFile, mockMetadata);

      const secondCall = vi.mocked(global.fetch).mock.calls[1];
      const body = JSON.parse(secondCall?.[1]?.body as string);

      expect(body.pinataContent.image).toBe("ipfs://QmImageHash123");
    });

    it("should fail if image upload fails", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Image upload failed" }),
      });

      await expect(
        uploadNFTToIPFS(mockImageFile, mockMetadata)
      ).rejects.toThrow("Image upload failed");

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should fail if metadata upload fails", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockImageResult,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: "Metadata upload failed" }),
        });

      await expect(
        uploadNFTToIPFS(mockImageFile, mockMetadata)
      ).rejects.toThrow("Metadata upload failed");

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should use gatewayUrl when available", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockImageResult,
            gatewayUrl: "https://custom.gateway/ipfs/QmImageHash123",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockMetadataResult,
            gatewayUrl: "https://custom.gateway/ipfs/QmMetadataHash456",
          }),
        });

      const result = await uploadNFTToIPFS(mockImageFile, mockMetadata);

      expect(result.imageUrl).toBe("https://custom.gateway/ipfs/QmImageHash123");
      expect(result.metadataUrl).toBe(
        "https://custom.gateway/ipfs/QmMetadataHash456"
      );
    });

    it("should use ipfs:// URL when gatewayUrl is not provided", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            IpfsHash: "QmImageHash123",
            PinSize: 2048,
            Timestamp: "2024-01-01T00:00:00.000Z",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            IpfsHash: "QmMetadataHash456",
            PinSize: 512,
            Timestamp: "2024-01-01T00:00:00.000Z",
          }),
        });

      const result = await uploadNFTToIPFS(mockImageFile, mockMetadata);

      expect(result.imageUrl).toBe("ipfs://QmImageHash123");
      expect(result.metadataUrl).toBe("ipfs://QmMetadataHash456");
    });
  });

  describe("ipfsToHttpUrl", () => {
    it("should convert ipfs:// URL to HTTPS gateway URL", () => {
      const ipfsUrl = "ipfs://QmTestHash123";
      const result = ipfsToHttpUrl(ipfsUrl);

      expect(result).toBe("https://ipfs.io/ipfs/QmTestHash123");
    });

    it("should return HTTPS URL unchanged", () => {
      const httpsUrl = "https://example.com/image.png";
      const result = ipfsToHttpUrl(httpsUrl);

      expect(result).toBe(httpsUrl);
    });

    it("should use different gateway when specified", () => {
      const ipfsUrl = "ipfs://QmTestHash123";

      const gateway0 = ipfsToHttpUrl(ipfsUrl, 0);
      const gateway1 = ipfsToHttpUrl(ipfsUrl, 1);
      const gateway2 = ipfsToHttpUrl(ipfsUrl, 2);

      expect(gateway0).toBe("https://ipfs.io/ipfs/QmTestHash123");
      expect(gateway1).toBe("https://gateway.pinata.cloud/ipfs/QmTestHash123");
      expect(gateway2).toBe("https://cloudflare-ipfs.com/ipfs/QmTestHash123");
    });

    it("should use first gateway for invalid index", () => {
      const ipfsUrl = "ipfs://QmTestHash123";
      const result = ipfsToHttpUrl(ipfsUrl, 99);

      expect(result).toBe("https://ipfs.io/ipfs/QmTestHash123");
    });

    it("should return empty string for empty input", () => {
      const result = ipfsToHttpUrl("");
      expect(result).toBe("");
    });

    it("should handle complex IPFS URLs", () => {
      const ipfsUrl =
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
      const result = ipfsToHttpUrl(ipfsUrl);

      expect(result).toContain(
        "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
      );
    });
  });
});
