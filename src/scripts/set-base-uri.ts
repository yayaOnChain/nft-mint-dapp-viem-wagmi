import hre from "hardhat";

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const newBaseURI = process.env.NEW_BASE_URI;

  if (!contractAddress) {
    throw new Error("Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env.local");
  }

  if (!newBaseURI) {
    throw new Error("Please set NEW_BASE_URI in your .env.local");
  }

  const [signer] = await hre.ethers.getSigners();

  const MyNFT = await hre.ethers.getContractFactory("MyNFT");
  const contract = MyNFT.attach(contractAddress);

  console.log(`Updating base URI for contract: ${contractAddress}`);
  console.log(`New base URI: ${newBaseURI}`);
  console.log(`Signer: ${signer.address}`);

  const tx = await contract.setBaseURI(newBaseURI);
  console.log("Transaction sent:", tx.hash);

  await tx.wait();

  const currentBaseURI = await contract.baseTokenURI();
  console.log(`\nBase URI updated successfully!`);
  console.log(`Current base URI: ${currentBaseURI}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});