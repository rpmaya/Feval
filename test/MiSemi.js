const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("MiSemi", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployMiSemiFixture() {

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const MiSemi = await ethers.getContractFactory("MiSemi");
        const miSemi = await MiSemi.deploy(owner.address);

        return { miSemi, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Should set the right value", async function () {
            const { miSemi, owner } = await loadFixture(deployMiSemiFixture);

            expect(await miSemi.balanceOf(owner.address, 1)).to.equal(0);
        });

    });

    describe("Validations", function () {
        it("Should mint tokens", async function () {
            const { miSemi, owner, otherAccount } = await loadFixture(deployMiSemiFixture);
            const account1 = owner.address;
            const account2 = otherAccount;
            const id = 1;
            const amount = 1;
            const data = "0x";

            await miSemi.mint(account1, id, amount, data);
            await miSemi.mint(account2, id, amount, data);

            expect(await miSemi.balanceOf(owner.address, 1)).to.equal(1);
            expect(await miSemi.balanceOf(otherAccount.address, 1)).to.equal(1); 
       
        });

        it("Should revert with the right error if called from another account", async function () {
            const { miSemi, otherAccount } = await loadFixture(deployMiSemiFixture);
            const account2 = otherAccount;
            const id = 1;
            const amount = 1;
            const data = "0x";
            await expect(miSemi.connect(otherAccount).mint(account2, id, amount, data)).to.be.reverted;
        });
    });
});