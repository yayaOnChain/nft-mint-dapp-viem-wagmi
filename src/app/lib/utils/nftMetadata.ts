/**
 * NFT Metadata Utilities
 * Helpers for creating and validating ERC721 metadata
 */

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface NFTMetadataInput {
  name: string;
  description: string;
  external_url?: string;
  attributes?: NFTAttribute[];
}

/**
 * Create NFT metadata with validation
 * @param input Metadata input object
 * @returns Validated metadata object
 */
export function createNFTMetadata(
  input: NFTMetadataInput
): NFTMetadataInput {
  // Validate required fields
  if (!input.name || input.name.trim() === "") {
    throw new Error("NFT name is required");
  }

  if (!input.description || input.description.trim() === "") {
    throw new Error("NFT description is required");
  }

  // Sanitize inputs
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    external_url: input.external_url?.trim(),
    attributes: input.attributes?.map((attr) => ({
      trait_type: attr.trait_type.trim(),
      value:
        typeof attr.value === "string" ? attr.value.trim() : attr.value,
    })),
  };
}

/**
 * Validate image file before upload
 * @param file File to validate
 * @param maxSizeMB Maximum file size in MB (default: 10)
 * @returns Validation result
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Please upload PNG, JPG, GIF, WebP, or SVG.`,
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${maxSizeMB}MB.`,
    };
  }

  return { valid: true };
}

/**
 * Compress image file before upload (optional optimization)
 * @param file Image file to compress
 * @param maxWidth Maximum width in pixels
 * @param quality Quality (0-1)
 * @returns Compressed image as File
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Failed to compress image"));
            }
          },
          "image/jpeg",
          quality
        );
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate preview URL for uploaded image
 * @param file Image file
 * @returns Object URL for preview
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke preview URL to free memory
 * @param url Object URL to revoke
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}
