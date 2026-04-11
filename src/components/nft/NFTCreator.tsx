import { useState, useCallback } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import { formatEther } from "viem";
import { myNftAbi } from "@/abi/myNft";
import { useToast } from "@/hooks";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui";
import { contractAddress } from "@/config/env";
import { uploadNFTToIPFS } from "@/services/ipfsService";
import {
  createNFTMetadata,
  validateImageFile,
  compressImage,
  createImagePreview,
  revokeImagePreview,
} from "@/utils/nftMetadata";
import { pinataJwt } from "@/config/env";

interface NFTCreatorProps {
  onMintSuccess?: () => void;
}

interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

/**
 * NFT Creator Component
 * Allows users to upload images and metadata to IPFS, then mint NFTs with on-chain metadata
 */
export const NFTCreator = ({ onMintSuccess }: NFTCreatorProps) => {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"create" | "mint">("create");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [attributes, setAttributes] = useState<NFTAttribute[]>([]);
  const [newTraitName, setNewTraitName] = useState("");
  const [newTraitValue, setNewTraitValue] = useState("");

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [metadataIpfsUrl, setMetadataIpfsUrl] = useState<string>("");

  // Mint state
  const [quantity, setQuantity] = useState(1);

  const toast = useToast();

  // Contract reads
  const {
    data: totalMinted,
    refetch: refetchTotalMinted,
  } = useReadContract({
    address: contractAddress,
    abi: myNftAbi,
    functionName: "totalMinted",
  });

  const { data: maxSupply } = useReadContract({
    address: contractAddress,
    abi: myNftAbi,
    functionName: "MAX_SUPPLY",
  });

  const { data: mintPrice } = useReadContract({
    address: contractAddress,
    abi: myNftAbi,
    functionName: "MINT_PRICE",
  });

  const { refetch: refetchUserBalance } = useReadContract({
    address: contractAddress,
    abi: myNftAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address: address,
  });

  // Prepare write function for minting
  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
    reset: resetWriteContract,
  } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Handle image file selection
  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file
      const validation = validateImageFile(file, 10);
      if (!validation.valid) {
        toast.error(validation.error || "Invalid file");
        return;
      }

      // Clean up previous preview
      if (imagePreview) {
        revokeImagePreview(imagePreview);
      }

      setImageFile(file);
      setImagePreview(createImagePreview(file));
    },
    [imagePreview, toast]
  );

  // Add attribute
  const handleAddAttribute = () => {
    if (!newTraitName.trim() || !newTraitValue) {
      toast.error("Trait name and value are required");
      return;
    }

    if (attributes.length >= 10) {
      toast.error("Maximum 10 attributes allowed");
      return;
    }

    setAttributes([
      ...attributes,
      {
        trait_type: newTraitName.trim(),
        value: newTraitValue,
      },
    ]);

    setNewTraitName("");
    setNewTraitValue("");
  };

  // Remove attribute
  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  // Upload to IPFS
  const handleUploadToIPFS = async () => {
    if (!imageFile) {
      toast.error("Please upload an image first");
      return;
    }

    if (!name || !description) {
      toast.error("Name and description are required");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress("Uploading image to IPFS...");

      // Optionally compress image
      let imageToUpload = imageFile;
      if (imageFile.size > 2 * 1024 * 1024) {
        // Compress if larger than 2MB
        setUploadProgress("Compressing image for optimization...");
        imageToUpload = await compressImage(imageFile, 1920, 0.85);
      }

      // Create metadata
      const metadata = createNFTMetadata({
        name,
        description,
        attributes: attributes.length > 0 ? attributes : undefined,
      });

      // Upload to IPFS
      const result = await uploadNFTToIPFS(imageToUpload, metadata, pinataJwt);

      setMetadataIpfsUrl(result.metadataUrl);
      setUploadProgress("Upload complete!");

      toast.success(
        "Successfully uploaded to IPFS!",
        `Metadata URI: ${result.metadataUrl}`
      );

      // Switch to mint tab
      setActiveTab("mint");
    } catch (error) {
      console.error("IPFS upload error:", error);
      toast.error(
        "Failed to upload to IPFS",
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  // Handle mint
  const handleMint = () => {
    if (!metadataIpfsUrl) {
      toast.error("Please upload metadata to IPFS first");
      return;
    }

    if (!writeContract || !mintPrice) return;

    const totalCost = mintPrice * BigInt(quantity);

    toast.info("Confirm Transaction", `Minting ${quantity} NFT(s)`);

    writeContract({
      address: contractAddress,
      abi: myNftAbi,
      functionName: "mint",
      args: [BigInt(quantity)],
      value: totalCost,
    });
  };

  // Reset write contract state on error
  if (writeError) {
    console.error("Mint error:", writeError);
  }

  // Handle successful mint
  if (isConfirmed && hash) {
    toast.success(
      "NFT Minted Successfully!",
      `Transaction: ${hash}`
    );

    refetchTotalMinted();
    refetchUserBalance();
    refetchEthBalance();

    // Reset form
    setName("");
    setDescription("");
    setImageFile(null);
    if (imagePreview) {
      revokeImagePreview(imagePreview);
      setImagePreview("");
    }
    setAttributes([]);
    setMetadataIpfsUrl("");
    setQuantity(1);
    resetWriteContract();

    onMintSuccess?.();
  }

  // Calculations
  const totalCost = mintPrice ? mintPrice * BigInt(quantity) : 0n;

  const progressPercent =
    maxSupply && totalMinted
      ? Math.round((Number(totalMinted) / Number(maxSupply)) * 100)
      : 0;

  const canMint =
    isConnected &&
    metadataIpfsUrl &&
    mintPrice &&
    maxSupply &&
    totalMinted &&
    quantity >= 1 &&
    quantity <= 10 &&
    totalMinted + BigInt(quantity) <= maxSupply;

  if (!isConnected) {
    return (
      <Card>
        <p className="text-center text-gray-400">
          Connect your wallet to create and mint NFTs
        </p>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">NFT Creator</CardTitle>
        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={activeTab === "create" ? "primary" : "secondary"}
            onClick={() => setActiveTab("create")}
            className="flex-1"
          >
            1. Create & Upload
          </Button>
          <Button
            variant={activeTab === "mint" ? "primary" : "secondary"}
            onClick={() => setActiveTab("mint")}
            disabled={!metadataIpfsUrl}
            className="flex-1"
          >
            2. Mint NFT
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* CREATE TAB */}
        {activeTab === "create" && (
          <div className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                NFT Image *
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                {imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="NFT Preview"
                      className="max-w-full max-h-64 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-gray-400">
                      {imageFile?.name} ({(imageFile?.size || 0) / 1024} KB)
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (imagePreview) revokeImagePreview(imagePreview);
                        setImageFile(null);
                        setImagePreview("");
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      PNG, JPG, GIF, WebP, SVG (max 10MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload">
                      <Button variant="secondary">Select Image</Button>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                NFT Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome NFT"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your NFT..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Attributes */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Attributes (Optional)
              </label>

              {attributes.length > 0 && (
                <div className="space-y-2 mb-3">
                  {attributes.map((attr, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-gray-700 rounded"
                    >
                      <span className="text-sm text-purple-400 flex-1">
                        {attr.trait_type}
                      </span>
                      <span className="text-sm text-gray-300 flex-1">
                        {attr.value}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRemoveAttribute(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTraitName}
                  onChange={(e) => setNewTraitName(e.target.value)}
                  placeholder="Trait name (e.g., Background)"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={newTraitValue}
                  onChange={(e) => setNewTraitValue(e.target.value)}
                  placeholder="Value (e.g., Blue)"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddAttribute}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUploadToIPFS}
              disabled={
                !imageFile || !name || !description || isUploading
              }
              isLoading={isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading ? uploadProgress : "Upload to IPFS & Continue"}
            </Button>

            {/* Upload Status */}
            {metadataIpfsUrl && (
              <div className="p-3 bg-green-900/30 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-300">✓ Upload Complete!</p>
                <p className="text-xs text-gray-400 mt-1 break-all">
                  Metadata URI: {metadataIpfsUrl}
                </p>
              </div>
            )}
          </div>
        )}

        {/* MINT TAB */}
        {activeTab === "mint" && (
          <div className="space-y-6">
            {/* NFT Preview */}
            {imagePreview && (
              <div className="rounded-lg overflow-hidden border border-gray-700">
                <img
                  src={imagePreview}
                  alt={name || "NFT"}
                  className="w-full h-auto"
                />
                <div className="p-4 bg-gray-800">
                  <h3 className="text-xl font-bold">{name}</h3>
                  <p className="text-sm text-gray-400 mt-2">{description}</p>
                  {attributes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {attributes.map((attr, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-900/50 text-purple-300 text-xs rounded"
                        >
                          {attr.trait_type}: {attr.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>
                  Minted: {totalMinted?.toString() || "0"} /{" "}
                  {maxSupply?.toString() || "1000"}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-linear-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Price Info */}
            <div className="p-3 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-400">Price per NFT</p>
              <p className="text-xl font-mono font-bold">
                {mintPrice ? formatEther(mintPrice) : "0.01"} ETH
              </p>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isPending || isConfirming}
                >
                  -
                </Button>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.min(10, Math.max(1, parseInt(e.target.value) || 1))
                    )
                  }
                  disabled={isPending || isConfirming}
                  className="w-16 text-center bg-gray-700 border border-gray-600 rounded py-1"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  disabled={quantity >= 10 || isPending || isConfirming}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Total Cost */}
            <div className="p-3 bg-purple-900/30 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-purple-300">Total Cost</p>
              <p className="text-2xl font-mono font-bold text-purple-400">
                {mintPrice ? formatEther(totalCost) : "0.01"} ETH
              </p>
            </div>

            {/* User Balance Info */}
            <div className="text-sm text-gray-400">
              Your Balance:{" "}
              {ethBalance?.formatted
                ? `${ethBalance.formatted} ${ethBalance.symbol}`
                : "Loading..."}
            </div>

            {/* Mint Button */}
            <Button
              onClick={handleMint}
              disabled={!canMint || isPending || isConfirming}
              isLoading={isPending || isConfirming}
              className="w-full"
              size="lg"
            >
              {isPending
                ? "Confirm in Wallet..."
                : isConfirming
                ? "Confirming..."
                : `Mint ${quantity > 1 ? `${quantity} NFTs` : "NFT"}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
