import { ethers } from "hardhat";

async function main() {
  // Get the deployer's address (first signer)
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Get the Contract Factory
  const MyNFTFactory = await ethers.getContractFactory("MyNFT");

  // Deploy the contract, passing the owner address
  const myNFT = await MyNFTFactory.deploy(deployer.address);

  // Wait for deployment to be confirmed
  await myNFT.waitForDeployment();

  const contractAddress = await myNFT.getAddress();

  console.log("MyNFT deployed to:", contractAddress);

  // In a real scenario, save this address to a JSON file for frontend use
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
