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

  // Deploy the contract, passing the owner address
  const myNFT = await MyNFTFactory.deploy(deployer.address);

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
    JSON.stringify({ myNFT: contractAddress, network, deployer: deployer.address }, null, 2)
  );
  console.log(`Contract address saved to ${filename}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
