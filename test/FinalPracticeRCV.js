const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ProviderWrapper } = require("hardhat/plugins");

describe("FinalPracticeRCV", function () {

    async function deployMiMarketFixture() {

        // Contracts are deployed using the first signer/account by default
        const [owerMarket, ownerNFT, buyer] = await ethers.getSigners();

        const value = ethers.parseEther("100.0"); // 100*10^18
        const nftId = 1;
        const priceEth = ethers.parseEther("1.0");
        const priceMyToken = ethers.parseEther("10.0");
        const url1 = "https://orange-persistent-squid-542.mypinata.cloud/ipfs/QmcYpUZrM7tgehfSZY9XSrPnpRUGcmzsbyzd23jUK2GxgH";

        const MiToken = await ethers.getContractFactory("RCVToken");
        const miToken = await MiToken.deploy(owerMarket.address);
        await miToken.mint(buyer, value);

        const MiSemi = await ethers.getContractFactory("CardGame");
        const miSemi = await MiSemi.deploy(owerMarket.address);
        await miSemi.mint(ownerNFT, nftId, 3, "0x");

        const MiNFT = await ethers.getContractFactory("HungryOppressor");
        const miNFT = await MiNFT.deploy(owerMarket.address);
        await miNFT.safeMint(ownerNFT.address, url1);

        const MiMarket = await ethers.getContractFactory("FinalPracticeRCV");
        const miMarket = await MiMarket.deploy(owerMarket.address);

        return { miToken, miSemi, miNFT, miMarket, owerMarket, ownerNFT, buyer, value, nftId, priceEth, priceMyToken};
    }

    describe("Deployment", function () {
        it("Comprobación de que el despliegue fue exitoso", async function () {
            const { miToken, miSemi, miNFT, miMarket, nftId, owerMarket, ownerNFT, buyer, value } = await loadFixture(deployMiMarketFixture);

            expect(await miToken.owner()).to.equal(owerMarket.address);
            expect(await miToken.balanceOf(buyer.address)).to.equal(value);
            expect(await miSemi.owner()).to.equal(owerMarket.address);
            expect(await miSemi.balanceOf(ownerNFT.address, nftId)).to.equal(3);
            expect(await miNFT.balanceOf(ownerNFT.address)).to.equal(1);
            expect(await miNFT.ownerOf(0)).to.equal(ownerNFT.address);
            expect(await miMarket.owner()).to.equal(owerMarket.address);
        });
    });

    describe("Funciones Propietario NFT", function () {
        it("Poner en venta un NFT (tanto ERC1155 como ERC721)", async function () {
            const { miSemi, miNFT, miMarket, ownerNFT, nftId, priceEth, priceMyToken } = await loadFixture(deployMiMarketFixture);
            // function putSale(address nftContract, bool is721ERC, uint256 nftId, uint256 priceEth, uint256 priceMyToken)
            // No tenemos nada en venta.
            expect(await miMarket.salesCounter()).to.equal(0);
            // ------------- erc 1155
            // Damos permisos al market para que pueda transferir tokens de nuestro contrato ERC1155
            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            // Llamamos a la función de venta de nuestro market (siendo el dueño del NFT) 
            await miMarket.connect(ownerNFT).putSale(miSemi, false,  nftId, priceEth, priceMyToken);
            expect(await miMarket.salesCounter()).to.equal(1);
            console.log(await miMarket.getAvailables());
            // ------------- ERC 721
            await miNFT.connect(ownerNFT).setApprovalForAll(miMarket, true);
            await miMarket.connect(ownerNFT).putSale(miNFT, true,  0, priceEth, priceMyToken);
            expect(await miMarket.salesCounter()).to.equal(2);
            console.log(await miMarket.getAvailables());
        });

        it("Actualizar una venta", async function () {
            const { miSemi, miMarket, ownerNFT, nftId, priceEth, priceMyToken } = await loadFixture(deployMiMarketFixture);
            // function putSale(address nftContract, bool is721ERC, uint256 nftId, uint256 priceEth, uint256 priceMyToken)
            expect(await miMarket.salesCounter()).to.equal(0);
            // erc 1155 repetimos la subida de un nft ()
            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            await miMarket.connect(ownerNFT).putSale(miSemi, false,  nftId, priceEth, priceMyToken);
            expect(await miMarket.salesCounter()).to.equal(1);
            console.log(await miMarket.getAvailables());
            // update sale
            // updateSale(uint256 itemId, uint256 newpriceEth, uint256 newpriceMyToken)
            const newpriceEth = ethers.parseEther("2.0");
            const newpriceMyToken = ethers.parseEther("20.0");
            miMarket.connect(ownerNFT).updateSale(1, newpriceEth, newpriceMyToken);
            expect(await miMarket.salesCounter()).to.equal(1);
            console.log(await miMarket.getAvailables());

        });

        it("Actualizar una venta que no es nuestra", async function () {
            const { miSemi, miMarket, ownerNFT, nftId, priceEth, priceMyToken, buyer } = await loadFixture(deployMiMarketFixture);
            // function putSale(address nftContract, bool is721ERC, uint256 nftId, uint256 priceEth, uint256 priceMyToken)
            expect(await miMarket.salesCounter()).to.equal(0);
            // erc 1155 repetimos la subida de un nft ()
            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            await miMarket.connect(ownerNFT).putSale(miSemi, false,  nftId, priceEth, priceMyToken);
            expect(await miMarket.salesCounter()).to.equal(1);
            console.log(await miMarket.getAvailables());
            // update sale
            // updateSale(uint256 itemId, uint256 newpriceEth, uint256 newpriceMyToken)
            const newpriceEth = ethers.parseEther("2.0");
            const newpriceMyToken = ethers.parseEther("20.0");
            await expect(miMarket.connect(buyer).updateSale(1, newpriceEth, newpriceMyToken))
                        .to.be.revertedWith("No eres el dueno del NFT");
            expect(await miMarket.salesCounter()).to.equal(1);
            console.log(await miMarket.getAvailables());
        });

        it("Actualizar una venta que ya no esta disponible", async function () {
            const { miSemi, miMarket, ownerNFT, nftId, priceEth, priceMyToken, buyer } = await loadFixture(deployMiMarketFixture);
            // function putSale(address nftContract, bool is721ERC, uint256 nftId, uint256 priceEth, uint256 priceMyToken)
            expect(await miMarket.salesCounter()).to.equal(0);
            // erc 1155 repetimos la subida de un nft ()
            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            await miMarket.connect(ownerNFT).putSale(miSemi, false,  nftId, priceEth, priceMyToken);
            expect(await miMarket.salesCounter()).to.equal(1);
            console.log(await miMarket.getAvailables());

            // compramos esa venta para que no este disponible
            const salesId = await miMarket.salesCounter();
            await miMarket.connect(buyer).buySaleEth(salesId, {value: priceEth});

            // update sale
            // updateSale(uint256 itemId, uint256 newpriceEth, uint256 newpriceMyToken)
            const newpriceEth = ethers.parseEther("2.0");
            const newpriceMyToken = ethers.parseEther("20.0");
            await expect(miMarket.connect(ownerNFT).updateSale(1, newpriceEth, newpriceMyToken))
                        .to.be.revertedWith("Ese NFT ya esta vendido, no puede actualizarlo");
            expect(await miMarket.salesCounter()).to.equal(1);
            console.log('Vacio' + await miMarket.getAvailables());
        });

        it("Cancelar una venta", async function () {
            const { miSemi, miMarket, ownerNFT, nftId, priceEth, priceMyToken } = await loadFixture(deployMiMarketFixture);
            // function putSale(address nftContract, bool is721ERC, uint256 nftId, uint256 priceEth, uint256 priceMyToken)
            expect(await miMarket.salesCounter()).to.equal(0);
            // erc 1155
            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            await miMarket.connect(ownerNFT).putSale(miSemi, false,  nftId, priceEth, priceMyToken);
            expect(await miMarket.salesCounter()).to.equal(1);
            console.log(await miMarket.getAvailables());
            expect(await miSemi.balanceOf(ownerNFT.address, nftId)).to.equal(2);
            // cancelamos
            miMarket.connect(ownerNFT).cancelSale(1);
            console.log(await miMarket.getAvailables());
            expect(await miSemi.balanceOf(ownerNFT.address, nftId)).to.equal(3);

        });

        it("Cancelar una venta que no es nuestra", async function () {
            const { miSemi, miMarket, ownerNFT, nftId, priceEth, priceMyToken, buyer } = await loadFixture(deployMiMarketFixture);
            // function putSale(address nftContract, bool is721ERC, uint256 nftId, uint256 priceEth, uint256 priceMyToken)
            expect(await miMarket.salesCounter()).to.equal(0);
            // erc 1155
            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            await miMarket.connect(ownerNFT).putSale(miSemi, false,  nftId, priceEth, priceMyToken);
            expect(await miMarket.salesCounter()).to.equal(1);
            console.log(await miMarket.getAvailables());
            expect(await miSemi.balanceOf(ownerNFT.address, nftId)).to.equal(2);
            // cancelamos
            await expect(miMarket.connect(buyer).cancelSale(1))
                        .to.be.revertedWith("No eres el dueno del NFT");
            console.log(await miMarket.getAvailables());
            expect(await miSemi.balanceOf(ownerNFT.address, nftId)).to.equal(2);
        });

        it("Cancelar una venta que ya esta vendida", async function () {
            const { miSemi, miMarket, ownerNFT, nftId, priceEth, priceMyToken, buyer } = await loadFixture(deployMiMarketFixture);
            // function putSale(address nftContract, bool is721ERC, uint256 nftId, uint256 priceEth, uint256 priceMyToken)
            expect(await miMarket.salesCounter()).to.equal(0);
            // erc 1155
            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            await miMarket.connect(ownerNFT).putSale(miSemi, false,  nftId, priceEth, priceMyToken);
            expect(await miMarket.salesCounter()).to.equal(1);
            console.log(await miMarket.getAvailables());
            expect(await miSemi.balanceOf(ownerNFT.address, nftId)).to.equal(2);

            // compramos esa venta para que no este disponible
            const salesId = await miMarket.salesCounter();
            await miMarket.connect(buyer).buySaleEth(salesId, {value: priceEth});

            // cancelamos
            await expect(miMarket.connect(ownerNFT).cancelSale(1))
                        .to.be.revertedWith("Ese NFT ya esta vendido, no puede retirarlo de ventas");
            console.log('Nada disponible' + await miMarket.getAvailables());
            expect(await miSemi.balanceOf(ownerNFT.address, nftId)).to.equal(2);
        });
    });


    describe("Funciones Para Comprar", function () {
        it("comprando con ether", async function () {
            const { miSemi, miNFT, miMarket, ownerNFT, nftId, priceEth, priceMyToken, buyer } = await loadFixture(deployMiMarketFixture);
            // function putSale(address nftContract, bool is721ERC, uint256 nftId, uint256 priceEth, uint256 priceMyToken)
            const beforeRenting = ethers.formatEther(await ethers.provider.getBalance(ownerNFT));
            expect(await miMarket.salesCounter()).to.equal(0);
            // erc 1155
            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            await miMarket.connect(ownerNFT).putSale(miSemi, false,  nftId, priceEth, priceMyToken);
            expect(await miMarket.salesCounter()).to.equal(1);
            console.log(await miMarket.getAvailables());
            // comprando con eth

            const salesId = await miMarket.salesCounter();
            await miMarket.connect(buyer).buySaleEth(salesId, {value: priceEth});
            expect(ethers.formatEther(await ethers.provider.getBalance(ownerNFT))).to.not.equal(beforeRenting);

            //console.log(await miMarket.rentals(miMarket.salesCounter));
        });

        it("comprando con ether, pero el nft ya esta vendido", async function () {
            const { miSemi, miNFT, miMarket, ownerNFT, nftId, priceEth, priceMyToken, buyer } = await loadFixture(deployMiMarketFixture);
            // function putSale(address nftContract, bool is721ERC, uint256 nftId, uint256 priceEth, uint256 priceMyToken)
            const beforeRenting = ethers.formatEther(await ethers.provider.getBalance(ownerNFT));
            expect(await miMarket.salesCounter()).to.equal(0);
            // erc 1155
            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            await miMarket.connect(ownerNFT).putSale(miSemi, false,  nftId, priceEth, priceMyToken);
            expect(await miMarket.salesCounter()).to.equal(1);
            console.log(await miMarket.getAvailables());
            // comprando con eth para que el nft no este disponible
            const salesId = await miMarket.salesCounter();
            await miMarket.connect(buyer).buySaleEth(salesId, {value: priceEth});
            expect(ethers.formatEther(await ethers.provider.getBalance(ownerNFT))).to.not.equal(beforeRenting);
            // comprando con eth pero el nft no esta disponible
            await expect(miMarket.connect(buyer).buySaleEth(salesId, {value: priceEth}))
                        .to.be.revertedWith("El NFT ya esta vendido");
            console.log('Nada disponible' + await miMarket.getAvailables());
            //console.log(await miMarket.rentals(miMarket.salesCounter));
        });

        it("comprando con ether, pero no tengo suficiente ether :(", async function () {
            const { miSemi, miNFT, miMarket, ownerNFT, nftId, priceEth, priceMyToken, buyer } = await loadFixture(deployMiMarketFixture);
            // function putSale(address nftContract, bool is721ERC, uint256 nftId, uint256 priceEth, uint256 priceMyToken)
            const beforeRenting = ethers.formatEther(await ethers.provider.getBalance(ownerNFT));
            expect(await miMarket.salesCounter()).to.equal(0);
            // erc 1155
            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            await miMarket.connect(ownerNFT).putSale(miSemi, false,  nftId, priceEth, priceMyToken);
            expect(await miMarket.salesCounter()).to.equal(1);
            console.log(await miMarket.getAvailables());
            // comprando con eth pero no tengo suficiente
            const salesId = await miMarket.salesCounter();
            const money = ethers.parseEther("0.5");
            await expect(miMarket.connect(buyer).buySaleEth(salesId, {value: money}))
                        .to.be.revertedWith("No tienes suficiente Ether para comprar el NFT");
            console.log('Algo disponible:' + await miMarket.getAvailables());
            //console.log(await miMarket.rentals(miMarket.salesCounter));
        });

        it("comprando con token", async function () {
            const { miSemi, miToken, miMarket, ownerNFT, nftId, priceEth, priceMyToken, buyer } = await loadFixture(deployMiMarketFixture);
            expect(await miMarket.salesCounter()).to.equal(0);
            // erc 1155
            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            await miMarket.connect(ownerNFT).putSale(miSemi, false,  nftId, priceEth, priceMyToken);
            expect(await miMarket.salesCounter()).to.equal(1);
            console.log(await miMarket.getAvailables());

            // comprando con token
            expect(await miSemi.balanceOf(buyer.address, nftId)).to.equal(0);
            await miToken.connect(buyer).approve(miMarket, priceMyToken);
            await miMarket.connect(buyer).buySaleMyToken(1, miToken);
            expect(await miSemi.balanceOf(buyer.address, nftId)).to.equal(1);
            // No debe haber nada disponible
            console.log('Nada Disponible:' + await miMarket.getAvailables());
            //expect(await miToken.balanceOf(ownerNFT)).to.equal((priceMyToken));
            //console.log(await miMarket.rentals(miMarket.salesCounter));
            //rpmaya@gmail.com
        });

        it("comprando con token, pero no he permitido suficiente token", async function () {
            const { miSemi, miToken, miMarket, ownerNFT, nftId, priceEth, priceMyToken, buyer } = await loadFixture(deployMiMarketFixture);
            expect(await miMarket.salesCounter()).to.equal(0);
            // erc 1155
            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            await miMarket.connect(ownerNFT).putSale(miSemi, false,  nftId, priceEth, priceMyToken);
            expect(await miMarket.salesCounter()).to.equal(1);
            console.log(await miMarket.getAvailables());

            // comprando con token
            expect(await miSemi.balanceOf(buyer.address, nftId)).to.equal(0);
            const money = ethers.parseEther("0.5");
            await miToken.connect(buyer).approve(miMarket, money);
            await expect(miMarket.connect(buyer).buySaleMyToken(1, miToken))
                        .to.be.revertedWith("No has permitido intercambiar suficiente token");
            expect(await miSemi.balanceOf(buyer.address, nftId)).to.equal(0);
            // No debe haber nada disponible
            console.log('Algo Disponible:' + await miMarket.getAvailables());
            //expect(await miToken.balanceOf(ownerNFT)).to.equal((priceMyToken));
            //console.log(await miMarket.rentals(miMarket.salesCounter));
            //rpmaya@gmail.com
        });
    });


    describe("Manipulando el Fee", function () {
        it("probando getter y setter", async function () {
            const { miMarket, owerMarket } = await loadFixture(deployMiMarketFixture);
            // Valor inicial de fee
            const initialFee = await miMarket.connect(owerMarket).getFee();
            expect(initialFee).to.equal(10);
            console.log("El valor inicial de Fee es: "+ initialFee);
            // Cambiamos el valor
            const newfee = 50;
            await miMarket.connect(owerMarket).setFee(newfee);
            // nuevo valor
            const newFee = await miMarket.connect(owerMarket).getFee();
            expect(newFee).to.equal(newfee);
            console.log("El nuevo valor de Fee es: "+ newFee);
        });

    });

    describe("Eventos", function () {
        it("Debemos emitir un evento cuando se pone a vender un nuevo item", async function () {
            const { miMarket, miSemi, ownerNFT, nftId, priceEth, priceMyToken, buyer} = await loadFixture(deployMiMarketFixture);
            // No tenemos nada en venta.
            expect(await miMarket.salesCounter()).to.equal(0);
            // ------------- erc 1155
            // Damos permisos al market para que pueda transferir tokens de nuestro contrato ERC1155
            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            // Llamamos a la función de venta de nuestro market (siendo el dueño del NFT) y
            // comprobamos que se emitio el evento
            await expect(miMarket.connect(ownerNFT).putSale(miSemi, false,  nftId, priceEth, priceMyToken))
                .to.emit(miMarket, "forSale")
                .withArgs(1, ownerNFT.address);
        });
        it("Debemos emitir un evento cuando se produce una compra", async function () {
            const { miMarket, miSemi, ownerNFT, nftId, priceEth, priceMyToken, buyer} = await loadFixture(deployMiMarketFixture);
            // No tenemos nada en venta.
            expect(await miMarket.salesCounter()).to.equal(0);
            // ------------- erc 1155
            // Damos permisos al market para que pueda transferir tokens de nuestro contrato ERC1155
            await miSemi.connect(ownerNFT).setApprovalForAll(miMarket, true);
            // ponemos en venta el item
            await miMarket.connect(ownerNFT).putSale(miSemi, false,  nftId, priceEth, priceMyToken);
            // comprobamos que se emitio el evento
            const salesId = await miMarket.salesCounter();
            await expect(miMarket.connect(buyer).buySaleEth(salesId, {value: priceEth}))
                .to.emit(miMarket, "Sold")
                .withArgs(1, buyer.address);
        });
    });


});