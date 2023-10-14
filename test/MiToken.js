const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("MiToken", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployMiTokenFixture() {

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const MiToken = await ethers.getContractFactory("MiToken");
        const miToken = await MiToken.deploy(owner.address);

        return { miToken, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Should set the right value", async function () {
            const { miToken } = await loadFixture(deployMiTokenFixture);

            expect(await miToken.totalSupply()).to.equal(0);
        });

        it("Should set the right owner", async function () {
            const { miToken, owner } = await loadFixture(deployMiTokenFixture);

            expect(await miToken.owner()).to.equal(owner.address);
        });

    });

    describe("Validations", function () {
        it("Should mint tokens", async function () {
            const { miToken, owner, otherAccount } = await loadFixture(deployMiTokenFixture);
            const cantidadParaMi = 5000;
            const cantidadParaOtro = 1000;

            await miToken.mint(owner.address, cantidadParaMi);
            await miToken.mint(otherAccount.address, cantidadParaOtro);

            expect(await miToken.balanceOf(owner.address)).to.equal(cantidadParaMi);
            expect(await miToken.balanceOf(otherAccount.address)).to.equal(cantidadParaOtro);  
            
        });

        it("Should revert with the right error if called from another account", async function () {
            const { miToken, otherAccount } = await loadFixture(deployMiTokenFixture);
            const otraCantidad = 3000;
            await expect(miToken.connect(otherAccount).mint(otherAccount.address, otraCantidad)).to.be.reverted;
        });
    });
});