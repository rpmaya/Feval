const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ProviderWrapper } = require("hardhat/plugins");

describe("MiMarket", function () {

    async function deployMiMarketFixture() {

        // Contracts are deployed using the first signer/account by default
        const [owner, ownerNFT, client] = await ethers.getSigners();

        const value = ethers.parseEther("100.0");
        const nftId = 1;
        const priceEth = ethers.parseEther("1.0");
        const priceMyToken = ethers.parseEther("10.0");
        const period = 7 * 24 * 60 * 60; // ONE_WEEK_IN_SECS

        const MiToken = await ethers.getContractFactory("MiToken");
        const miToken = await MiToken.deploy(owner.address);
        await miToken.mint(client, value);

        const MiSemi = await ethers.getContractFactory("MiSemi");
        const miSemi = await MiSemi.deploy(owner.address);
        await miSemi.mint(ownerNFT, 1, 1, "0x");
     
        const MiMarket = await ethers.getContractFactory("MiMarket");
        const miMarket = await MiMarket.deploy(owner.address);

        return { miToken, miSemi, miMarket, owner, ownerNFT, client, value, nftId, priceEth, priceMyToken, period};
    }

    describe("Deployment", function () {
        it("Should set the right owner and mint", async function () {
            const { miToken, miSemi, miMarket, nftId, owner, ownerNFT, client, value } = await loadFixture(deployMiMarketFixture); 

            expect(await miToken.owner()).to.equal(owner.address);
            expect(await miToken.balanceOf(client.address)).to.equal(value);

            expect(await miSemi.owner()).to.equal(owner.address);
            expect(await miSemi.balanceOf(ownerNFT.address, nftId)).to.equal(1);

            expect(await miMarket.owner()).to.equal(owner.address);
        });
    });

    describe("Rental", function () {
        it("Should put a rent", async function () {
            const { miSemi, miMarket, ownerNFT, nftId, priceEth, priceMyToken, period } = await loadFixture(deployMiMarketFixture);

            expect(await miMarket.rentalsCounter()).to.equal(0);

            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            await miMarket.connect(ownerNFT).putRent(miSemi, nftId, priceEth, priceMyToken, period);
            
            expect(await miMarket.rentalsCounter()).to.equal(1);
            //console.log(await miMarket.rentals(miMarket.rentalsCounter));
        });

        it("Should get a rent with ETH", async function () {
            const { miToken, miSemi, miMarket, ownerNFT, client, nftId, priceEth, priceMyToken, period } = await loadFixture(deployMiMarketFixture);
            
            const beforeRenting = ethers.formatEther(await ethers.provider.getBalance(ownerNFT));

            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            await miMarket.connect(ownerNFT).putRent(miSemi, nftId, priceEth, priceMyToken, period);

            const rentalId = await miMarket.rentalsCounter();
            await miMarket.connect(client).getRentEth(rentalId, {value: priceEth});

            expect(ethers.formatEther(await ethers.provider.getBalance(ownerNFT))).to.not.equal(beforeRenting);

        });

        it("Should get a rent with MyToken", async function () {
            const { miToken, miSemi, miMarket, ownerNFT, client, nftId, priceEth, priceMyToken, period } = await loadFixture(deployMiMarketFixture);

            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            await miMarket.connect(ownerNFT).putRent(miSemi, nftId, priceEth, priceMyToken, period);

            const rentalId = await miMarket.rentalsCounter();

            await miToken.connect(client).approve(miMarket, priceMyToken);
            await miMarket.connect(client).getRentMyToken(rentalId, miToken);

            expect(await miToken.balanceOf(ownerNFT)).to.equal(priceMyToken);
            //console.log("Final:", ethers.formatEther(await miToken.balanceOf(ownerNFT)));
        });

        it("Should revert with the right error", async function () {
            const { miToken, miSemi, miMarket, ownerNFT, client, nftId, priceEth, priceMyToken, period } = await loadFixture(deployMiMarketFixture);
            
            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            await miMarket.connect(ownerNFT).putRent(miSemi, nftId, priceEth, priceMyToken, period);
            const rentalId = await miMarket.rentalsCounter();
            await miToken.connect(client).approve(miMarket, priceMyToken);
            await miMarket.connect(client).getRentMyToken(rentalId, miToken);

            await expect(miMarket.endRent(rentalId)).to.be.revertedWith("You can't end it yet");
        });
    });


    describe("Events", function () {
        it("Should emit an event on put rental", async function () {
            const { miMarket, miSemi, ownerNFT, nftId, priceEth, priceMyToken, period } = await loadFixture(deployMiMarketFixture);
            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            await expect(miMarket.connect(ownerNFT).putRent(miSemi, nftId, priceEth, priceMyToken, period))
                .to.emit(miMarket, "Rental")
                .withArgs(1, ownerNFT.address);
        });
    });
});