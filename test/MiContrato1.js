const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("MiContrato1", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployMiContrato1Fixture() {

        const valor = 1001;

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const MiContrato1 = await ethers.getContractFactory("MiContrato1");
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
            const nuevoValor = 2001;

            await miContrato1.setMiVariable(nuevoValor);

            expect(await miContrato1.getMiVariable()).to.equal(nuevoValor);
        });

        it("Should not change the value because the value is even", async function () {
            const { miContrato1 } = await loadFixture(deployMiContrato1Fixture);
            const nuevoValor = 2000;

            await expect(miContrato1.setMiVariable(nuevoValor)).to.be.revertedWith(
                'Solo numeros impares son permitidos'
            );

        });

        it("Should revert with the right error if called from another account", async function () {
            const { miContrato1, otherAccount } = await loadFixture(deployMiContrato1Fixture);
            const otroValor = 3001;
            // We use miContrato1.connect() to send a transaction from another account
            await expect(miContrato1.connect(otherAccount).setMiVariable(otroValor)).to.be.reverted;
        });
    });

    describe("Events", function () {
        it("Should emit an event on withdrawals", async function () {
            const { miContrato1, owner } = await loadFixture(deployMiContrato1Fixture);
            const nuevoValor = 4001;

            await expect(miContrato1.setMiVariable(nuevoValor))
                .to.emit(miContrato1, "ValorModificado")
                .withArgs(nuevoValor, owner.address);

            expect(await miContrato1.getMiVariable()).to.equal(nuevoValor);
        });
    });
});