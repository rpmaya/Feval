const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("MiContrato1", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployMiContrato1Fixture() {

        const valor = 1000;

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const MiContrato1 = await ethers.getContractFactory("MiCotrato1");
        const miContrato1 = await MiContrato1.deploy(valor, owner.address);

        return { miContrato1, valor, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Should set the right value", async function () {
            const { miContrato1, valor } = await loadFixture(deployMiContrato1Fixture);

            expect(await miContrato1.getMiVariable()).to.equal(valor);
        });

        it("Should set the right owner", async function () {
            const { miContrato1, owner } = await loadFixture(deployMiContrato1Fixture);

            expect(await miContrato1.owner()).to.equal(owner.address);
        });

    });

    describe("Validations", function () {
        it("Should change the value", async function () {
            const { miContrato1 } = await loadFixture(deployMiContrato1Fixture);
            const nuevoValor = 2000;

            await miContrato1.setMiVariable(nuevoValor);
            
            expect(await miContrato1.getMiVariable()).to.equal(nuevoValor);
        });

        it("Should revert with the right error if called from another account", async function () {
            const { miContrato1, otherAccount } = await loadFixture(deployMiContrato1Fixture);
            const ultimoValor = 2000;
            const otroValor = 3000;
            // We use miContrato1.connect() to send a transaction from another account
            await expect(miContrato1.connect(otherAccount).setMiVariable(otroValor)).to.be.revertedWith(
                "You aren't the owner"
            );

            expect(await miContrato1.getMiVariable()).to.equal(ultimoValor);
        });
    });

    describe("Events", function () {
        it("Should emit an event on withdrawals", async function () {
            const { miContrato1, owner } = await loadFixture(deployMiContrato1Fixture);
            const nuevoValor = 4000;

            await expect(miContrato1.setMiVariable(nuevoValor))
                .to.emit(miContrato1, "ValorModificado")
                .withArgs(nuevoValor, owner);

            expect(await miContrato1.getMiVariable()).to.equal(nuevoValor);
        });
    });
});