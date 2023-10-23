const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("MiNFT", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployMiNFTFixture() {

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const MiNFT = await ethers.getContractFactory("MiNFT");
        const miNFT = await MiNFT.deploy(owner.address);

        return { miNFT, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Should set the right value", async function () {
            const { miNFT, owner } = await loadFixture(deployMiNFTFixture);

            expect(await miNFT.balanceOf(owner.address)).to.equal(0);
        });

    });

    describe("Validations", function () {
        it("Should mint tokens", async function () {
            const { miNFT, owner, otherAccount } = await loadFixture(deployMiNFTFixture);
            const url0 = "https://tomato-specified-emu-164.mypinata.cloud/ipfs/QmVNtkZJoZa6CSE5BAjVBiadbmF8gwmCQspwnkBfZEVeBP"
            const url1 = "https://localhost/nfts/1";
            const url2 = "https://localhost/nfts/2";

            await miNFT.safeMint(owner.address, url1);
            await miNFT.safeMint(otherAccount.address, url2);

            expect(await miNFT.balanceOf(owner.address)).to.equal(1);
            expect(await miNFT.balanceOf(otherAccount.address)).to.equal(1); 
            
            expect(await miNFT.ownerOf(0)).to.equal(owner.address);
            expect(await miNFT.ownerOf(1)).to.equal(otherAccount.address);
       
        });

        it("Should revert with the right error if called from another account", async function () {
            const { miNFT, otherAccount } = await loadFixture(deployMiNFTFixture);
            const url3 = "https://localhost/nfts/3";
            await expect(miNFT.connect(otherAccount).safeMint(otherAccount.address, url3)).to.be.reverted;
        });
    });
});