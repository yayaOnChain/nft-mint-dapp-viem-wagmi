import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  uploadFileToIPFS,
  uploadMetadataToIPFS,
  uploadNFTToIPFS,
  ipfsToHttpUrl,
  type PinataUploadResult,
  type NFTMetadata,
} from "@/services/ipfsService";

describe("ipfsService", () => {
  const mockPinataJwt = "mock-jwt-token-123456";
  const mockIpfsHash = "QmTestHash123456789";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("uploadFileToIPFS", () => {
    it("should upload file successfully", async () => {
      const mockFile = new File(["test content"], "test.png", {
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

      const result = await uploadFileToIPFS(mockFile, mockPinataJwt);

      expect(result).toEqual(mockResult);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: `Bearer ${mockPinataJwt}`,
          },
        })
      );
    });

    it("should include file metadata in FormData", async () => {
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

      await uploadFileToIPFS(mockFile, mockPinataJwt);

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const formData = fetchCall?.[1]?.body;

      expect(formData).toBeInstanceOf(FormData);
    });

    it("should throw error when upload fails", async () => {
      const mockFile = new File(["test content"], "test.png", {
        type: "image/png",
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        text: async () => "Upload failed",
      });

      await expect(uploadFileToIPFS(mockFile, mockPinataJwt)).rejects.toThrow(
        "Failed to upload to IPFS: Upload failed"
      );
    });

    it("should handle network errors", async () => {
      const mockFile = new File(["test content"], "test.png", {
        type: "image/png",
      });

      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await expect(uploadFileToIPFS(mockFile, mockPinataJwt)).rejects.toThrow(
        "Network error"
      );
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

    it("should upload metadata successfully", async () => {
      const mockResult: PinataUploadResult = {
        IpfsHash: mockIpfsHash,
        PinSize: 512,
        Timestamp: "2024-01-01T00:00:00.000Z",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      });

      const result = await uploadMetadataToIPFS(mockMetadata, mockPinataJwt);

      expect(result).toEqual(mockResult);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mockPinataJwt}`,
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

      await uploadMetadataToIPFS(mockMetadata, mockPinataJwt);

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(fetchCall?.[1]?.body as string);

      expect(body.pinataContent).toEqual(mockMetadata);
      expect(body.pinataMetadata.name).toBe("Test NFT.json");
    });

    it("should throw error when metadata upload fails", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        text: async () => "Metadata upload failed",
      });

      await expect(
        uploadMetadataToIPFS(mockMetadata, mockPinataJwt)
      ).rejects.toThrow("Failed to upload metadata to IPFS: Metadata upload failed");
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
    };

    const mockMetadataResult: PinataUploadResult = {
      IpfsHash: "QmMetadataHash456",
      PinSize: 512,
      Timestamp: "2024-01-01T00:00:00.000Z",
    };

    it("should upload image and metadata in sequence", async () => {
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

      const result = await uploadNFTToIPFS(
        mockImageFile,
        mockMetadata,
        mockPinataJwt
      );

      expect(result.imageHash).toBe("QmImageHash123");
      expect(result.metadataHash).toBe("QmMetadataHash456");
      expect(result.imageUrl).toBe("ipfs://QmImageHash123");
      expect(result.metadataUrl).toBe("ipfs://QmMetadataHash456");
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

      await uploadNFTToIPFS(mockImageFile, mockMetadata, mockPinataJwt);

      const secondCall = vi.mocked(global.fetch).mock.calls[1];
      const body = JSON.parse(secondCall?.[1]?.body as string);

      expect(body.pinataContent.image).toBe("ipfs://QmImageHash123");
    });

    it("should fail if image upload fails", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        text: async () => "Image upload failed",
      });

      await expect(
        uploadNFTToIPFS(mockImageFile, mockMetadata, mockPinataJwt)
      ).rejects.toThrow("Failed to upload to IPFS: Image upload failed");

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
          text: async () => "Metadata upload failed",
        });

      await expect(
        uploadNFTToIPFS(mockImageFile, mockMetadata, mockPinataJwt)
      ).rejects.toThrow(
        "Failed to upload metadata to IPFS: Metadata upload failed"
      );

      expect(global.fetch).toHaveBeenCalledTimes(2);
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

    it("should return first gateway for invalid index", () => {
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

      expect(result).toContain("bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi");
    });
  });
});
