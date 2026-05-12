/**
 * IPFS Client Module (Server Proxy)
 * Handles uploading images and metadata to IPFS via Pinata proxy
 */

export interface PinataUploadResult {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  gatewayUrl?: string;
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

const API_BASE = "/api/pinata";

export async function uploadFileToIPFS(file: File): Promise<PinataUploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const pinataMetadata = JSON.stringify({
    name: file.name,
  });
  formData.append("pinataMetadata", pinataMetadata);

  const response = await fetch(API_BASE, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('IPFS upload failed:', response.status, data);
    throw new Error(data.error || data.message || `Failed to upload to IPFS: ${response.status}`);
  }

  return data;
}

export async function uploadMetadataToIPFS(
  metadata: NFTMetadata
): Promise<PinataUploadResult> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: `${metadata.name}.json`,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('IPFS metadata upload failed:', response.status, data);
    throw new Error(data.error || data.message || `Failed to upload metadata to IPFS: ${response.status}`);
  }

  return data;
}

export async function uploadNFTToIPFS(
  imageFile: File,
  metadata: Omit<NFTMetadata, "image">
): Promise<{
  imageHash: string;
  metadataHash: string;
  imageUrl: string;
  metadataUrl: string;
}> {
  const imageResult = await uploadFileToIPFS(imageFile);
  const imageIpfsUrl = `ipfs://${imageResult.IpfsHash}`;

  const fullMetadata: NFTMetadata = {
    ...metadata,
    image: imageIpfsUrl,
  };

  const metadataResult = await uploadMetadataToIPFS(fullMetadata);
  const metadataIpfsUrl = `ipfs://${metadataResult.IpfsHash}`;

  return {
    imageHash: imageResult.IpfsHash,
    metadataHash: metadataResult.IpfsHash,
    imageUrl: imageResult.gatewayUrl || imageIpfsUrl,
    metadataUrl: metadataResult.gatewayUrl || metadataIpfsUrl,
  };
}

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