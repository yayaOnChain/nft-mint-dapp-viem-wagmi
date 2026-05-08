/**
 * IPFS Service Module
 * Handles uploading images and metadata to IPFS via Pinata
 */

export interface PinataUploadResult {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
}

/**
 * Upload a file to IPFS via Pinata API
 * @param file File object to upload
 * @returns IPFS hash and metadata
 */
export async function uploadFileToIPFS(
  file: File,
  pinataJwt: string
): Promise<PinataUploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  // Optional: Add metadata for Pinata
  const pinataMetadata = JSON.stringify({
    name: file.name,
  });
  formData.append("pinataMetadata", pinataMetadata);

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload to IPFS: ${error}`);
  }

  return response.json();
}

/**
 * Upload JSON metadata to IPFS via Pinata API
 * @param metadata NFT metadata object
 * @returns IPFS hash and metadata
 */
export async function uploadMetadataToIPFS(
  metadata: NFTMetadata,
  pinataJwt: string
): Promise<PinataUploadResult> {
  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${metadata.name}.json`,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload metadata to IPFS: ${error}`);
  }

  return response.json();
}

/**
 * Upload image and metadata to IPFS in sequence
 * @param imageFile Image file to upload
 * @param metadata NFT metadata (without image field)
 * @param pinataJwt Pinata JWT token
 * @returns Object with image IPFS hash and metadata IPFS hash
 */
export async function uploadNFTToIPFS(
  imageFile: File,
  metadata: Omit<NFTMetadata, "image">,
  pinataJwt: string
): Promise<{
  imageHash: string;
  metadataHash: string;
  imageUrl: string;
  metadataUrl: string;
}> {
  // Step 1: Upload image to IPFS
  const imageResult = await uploadFileToIPFS(imageFile, pinataJwt);
  const imageIpfsUrl = `ipfs://${imageResult.IpfsHash}`;

  // Step 2: Create metadata with image IPFS URL
  const fullMetadata: NFTMetadata = {
    ...metadata,
    image: imageIpfsUrl,
  };

  // Step 3: Upload metadata to IPFS
  const metadataResult = await uploadMetadataToIPFS(fullMetadata, pinataJwt);
  const metadataIpfsUrl = `ipfs://${metadataResult.IpfsHash}`;

  return {
    imageHash: imageResult.IpfsHash,
    metadataHash: metadataResult.IpfsHash,
    imageUrl: imageIpfsUrl,
    metadataUrl: metadataIpfsUrl,
  };
}

/**
 * Convert IPFS URL to HTTPS gateway URL
 * @param ipfsUrl IPFS URL (ipfs://CID) or HTTPS URL
 * @param gatewayIndex Index of gateway to use (default: 0)
 * @returns HTTPS URL
 */
export function ipfsToHttpUrl(
  ipfsUrl: string,
  gatewayIndex: number = 0
): string {
  if (!ipfsUrl) return "";

  const gateways = [
    "https://ipfs.io/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://dweb.link/ipfs/",
  ];

  if (ipfsUrl.startsWith("ipfs://")) {
    const cid = ipfsUrl.replace("ipfs://", "");
    const gateway = gateways[gatewayIndex] || gateways[0];
    return `${gateway}${cid}`;
  }

  return ipfsUrl;
}
