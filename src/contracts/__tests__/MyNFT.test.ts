/// <reference types="@nomicfoundation/hardhat-ethers" />
/// <reference types="@nomicfoundation/hardhat-chai-matchers" />
import { expect } from "chai";
import { ethers } from "hardhat";
import type { MyNFT } from "typechain-types"; // Auto-generated types
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MyNFT Contract", function () {
  let myNFT: MyNFT;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async function () {
    // Get signers from the hardhat environment
    const signers = await ethers.getSigners();
    [owner, addr1] = signers;

    // Deploy the contract before each test
    const MyNFTFactory = await ethers.getContractFactory("MyNFT");
    myNFT = (await MyNFTFactory.deploy(owner.address, "")) as MyNFT;
    await myNFT.waitForDeployment();
  });

  it("Should deploy correctly", async function () {
    expect(await myNFT.totalMinted()).to.equal(0);
  });

  it("Should allow a user to mint one NFT with correct price", async function () {
    const mintPrice = await myNFT.MINT_PRICE();

    // Call mint function with correct value
    await myNFT.connect(addr1).mint(1, { value: mintPrice });

    expect(await myNFT.totalMinted()).to.equal(1);
    expect(await myNFT.ownerOf(1)).to.equal(addr1.address);
  });

  it("Should fail if insufficient ETH is sent", async function () {
    const insufficientPrice = ethers.parseEther("0.005"); // Less than 0.01

    await expect(
      myNFT.connect(addr1).mint(1, { value: insufficientPrice }),
    ).to.be.revertedWith("Insufficient ETH sent");
  });

  it("Should allow owner to withdraw funds", async function () {
    const mintPrice = await myNFT.MINT_PRICE();
    await myNFT.connect(addr1).mint(1, { value: mintPrice });

    const initialBalance = await ethers.provider.getBalance(owner.address);

    // Withdraw funds
    await myNFT.withdraw();

    const finalBalance = await ethers.provider.getBalance(owner.address);

    // Balance should increase (minus gas fees roughly)
    expect(finalBalance).to.be.greaterThan(initialBalance);
  });

  describe("Metadata Management", function () {
    it("Should set base URI during deployment", async function () {
      const MyNFTFactory = await ethers.getContractFactory("MyNFT");
      const testBaseURI = "https://ipfs.io/ipfs/QmTest123/";
      const nftWithURI = await MyNFTFactory.deploy(owner.address, testBaseURI);
      await nftWithURI.waitForDeployment();

      expect(await nftWithURI.baseTokenURI()).to.equal(testBaseURI);
    });

    it("Should allow owner to update base URI", async function () {
      const newBaseURI = "https://gateway.pinata.cloud/ipfs/QmNewBase/";

      await myNFT.setBaseURI(newBaseURI);

      expect(await myNFT.baseTokenURI()).to.equal(newBaseURI);
    });

    it("Should emit BaseURIUpdated event when base URI is updated", async function () {
      const newBaseURI = "https://ipfs.io/ipfs/QmUpdated/";

      await expect(myNFT.setBaseURI(newBaseURI))
        .to.emit(myNFT, "BaseURIUpdated")
        .withArgs(newBaseURI);
    });

    it("Should prevent non-owner from updating base URI", async function () {
      const newBaseURI = "https://ipfs.io/ipfs/QmHacker/";

      await expect(
        myNFT.connect(addr1).setBaseURI(newBaseURI)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should return correct tokenURI after minting with base URI", async function () {
      const MyNFTFactory = await ethers.getContractFactory("MyNFT");
      const baseURI = "https://ipfs.io/ipfs/QmTest/";
      const nftWithURI = await MyNFTFactory.deploy(owner.address, baseURI);
      await nftWithURI.waitForDeployment();

      const mintPrice = await nftWithURI.MINT_PRICE();
      await nftWithURI.connect(addr1).mint(1, { value: mintPrice });

      const tokenURI = await nftWithURI.tokenURI(1);
      expect(tokenURI).to.equal(`${baseURI}1`);
    });

    it("Should allow owner to set individual token URI", async function () {
      const mintPrice = await myNFT.MINT_PRICE();
      await myNFT.connect(addr1).mint(1, { value: mintPrice });

      const customTokenURI = "ipfs://QmCustomTokenURI";
      await myNFT.setTokenURI(1, customTokenURI);

      expect(await myNFT.tokenURI(1)).to.equal(customTokenURI);
    });

    it("Should prevent setting token URI for non-existent token", async function () {
      const customTokenURI = "ipfs://QmFakeURI";

      await expect(
        myNFT.setTokenURI(999, customTokenURI)
      ).to.be.revertedWith("Token does not exist");
    });

    it("Should prevent non-owner from setting token URI", async function () {
      const mintPrice = await myNFT.MINT_PRICE();
      await myNFT.connect(addr1).mint(1, { value: mintPrice });

      const customTokenURI = "ipfs://QmUnauthorizedURI";

      await expect(
        myNFT.connect(addr1).setTokenURI(1, customTokenURI)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should emit NFTMinted event with tokenURI", async function () {
      const mintPrice = await myNFT.MINT_PRICE();

      await expect(myNFT.connect(addr1).mint(1, { value: mintPrice }))
        .to.emit(myNFT, "NFTMinted")
        .withArgs(addr1.address, 1, "");
    });
  });
});
