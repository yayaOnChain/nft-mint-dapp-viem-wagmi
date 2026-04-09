/// <reference types="@nomicfoundation/hardhat-ethers" />
import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Get the deployer's address (first signer)
  const signers = await hre.ethers.getSigners();

  if (signers.length === 0) {
    throw new Error(
      `No accounts found for network "${hre.network.name}".\n` +
      `Please set PRIVATE_KEY in your .env file for live networks.\n` +
      `For local testing, run: npx hardhat node`
    );
  }

  const [deployer] = signers;

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Get the Contract Factory
  const MyNFTFactory = await hre.ethers.getContractFactory("MyNFT");

  // Default base URI - can be set via environment variable or use placeholder
  // For production, set to your Pinata gateway URL
  // Example: "https://ipfs.io/ipfs/QmYourBaseHash/"
  const initialBaseURI = process.env.INITIAL_BASE_URI || "";

  console.log("Initial Base URI:", initialBaseURI || "(empty - can be set later via setBaseURI)");

  // Deploy the contract with owner address and initial base URI
  const myNFT = await MyNFTFactory.deploy(deployer.address, initialBaseURI);

  // Wait for deployment to be confirmed
  await myNFT.waitForDeployment();

  const contractAddress = await myNFT.getAddress();

  console.log("MyNFT deployed to:", contractAddress);

  // Determine network and save to appropriate file
  const network = hre.network.name;
  const filename = network === "localhost"
    ? "contract-address-local.json"
    : network === "sepolia"
      ? "contract-address-sepolia.json"
      : `contract-address-${network}.json`;

  const contractAddressPath = path.join(__dirname, `../../${filename}`);
  fs.writeFileSync(
    contractAddressPath,
    JSON.stringify({
      myNFT: contractAddress,
      network,
      deployer: deployer.address,
      initialBaseURI: initialBaseURI || "",
    }, null, 2)
  );
  console.log(`Contract address saved to ${filename}`);

  // Log helpful information for the user
  console.log("\n" + "=".repeat(60));
  console.log("Deployment Summary:");
  console.log("=".repeat(60));
  console.log("Contract Address:", contractAddress);
  console.log("Network:", network);
  console.log("Owner:", deployer.address);
  console.log("Base URI:", initialBaseURI || "(not set)");
  console.log("\nNext steps:");
  if (!initialBaseURI) {
    console.log("  1. Upload your metadata to IPFS (e.g., Pinata)");
    console.log("  2. Update the base URI using setBaseURI() function");
    console.log("     Example: setBaseURI('https://ipfs.io/ipfs/QmYourHash/')");
  }
  console.log("  3. Update VITE_CONTRACT_ADDRESS in your .env file");
  console.log("  4. Start minting NFTs!");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
