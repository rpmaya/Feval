// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";         // NECESARIO PARA ACEPTAR TOKENS DE ESE TIPO
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";     // NECESARIO PARA ACEPTAR TOKENS DE ESE TIPO
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";       // NECESARIO PARA ACEPTAR TOKENS DE ESE TIPO
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

/**
 *  Contracto inteligente que despliega un mercado de NFTs donde se
 *  pueden comprar por ETH (ether) y por un token personal. 
 *  El mercado soporta tanto el estandar ERC721 Y ERC1155 como NFTs. 
 */
contract FinalPracticeRCV is Ownable, ERC1155Holder, ERC721Holder {

    // Estructura que almacena la información de las compras
    struct ItemInfo {
        address owner;                  // dirección del dueño del NFT.
        address nftContractaddress;     // dirección del contrato que minteo el NFT
        uint256 nftId;                  // id del NFT
        uint256 priceEth;               // precio en Eth
        uint256 priceMyToken;           // precio en miToken
        uint timestamp;                 // timestamp que se registra cuando se realiza la compra.
        address newowner;               // dirección del comprador del NFT
        bool available;                 // Si esta disponible o no (True disponible)
        bool nfttype;                   // Si true es ERC721, SI NO ERC1155. (En caso de tener más tipo usar enum)  
    }

    // porcentaje de fee que almacena el contrato por cada compra
    // el feecost va de 1 a 100 representando el porcentaje.
    // Ejemplo: si queremos quedarnos con el 0.5% de cada transacción, feeCost será igual a 50
    uint8 private feeCost; 

    // Contador de ventas
    uint256 public salesCounter;

    mapping(uint256 => ItemInfo) public sales;   // diccionario donde se van a guardar las ventas.

    /*
        Evento emitido cuando se pone en venta un NFT con los argumentos
        id del item y dirección de wallet del dueño del NFT.
    */
    event forSale(uint256 id, address owner);

    /*
        Evento emitido cuando se produce la venta de un NFT con los argumentos
        id del item y dirección de wallet del comprador.
    */
    event Sold(uint256 id, address newowner);

    /**
     * Constructor por defecto del smartcontract.
     * Inicializa el contador de ventas y el % de fee.
     * @param initialOwner dirección del dueño inicial del contrato (wallet que realiza el despliegue del contrato)
     */
    constructor(address initialOwner) Ownable(initialOwner) {
        salesCounter = 0;
        feeCost = 10;
    }

    // Operaciones puesta en venta de NFTs

    /**
     * Método que permite a un usuario poner en venta sus NFTs.
     * 
     * @param nftContract dirección del contrato que minteo el NFT
     * @param is721ERC flag que indica el tipo de NFT que vamos a poner en venta
     * @param nftId identificador del nft
     * @param priceEth precio en ether del nft
     * @param priceMyToken precio en mi token personal del nft.
     */
    function putSale(address nftContract, bool is721ERC, uint256 nftId, uint256 priceEth, uint256 priceMyToken) public {
        // Almacenamos el nft en el smartcontract
        if(!is721ERC) IERC1155(nftContract).safeTransferFrom(msg.sender, address(this), nftId, 1, "");
        else IERC721(nftContract).safeTransferFrom(msg.sender, address(this), nftId, "");
        salesCounter++;
        sales[salesCounter] = ItemInfo( msg.sender, nftContract, nftId, priceEth, priceMyToken, 0, msg.sender, true, is721ERC);
        emit forSale(salesCounter, msg.sender);
    }

    /**
     * Método que permite actualizar los precios de un item puesto en venta.
     * ---------------------- Requisitos previos
     * 1. Tienes que ser el dueño del item que quieres actualizar.
     * 2. Que el item este disponible (es decir que no este vendido).
     * 
     * @param itemId identificador del item en venta a actualizar
     * @param newpriceEth nuevo valor en ETH del nft
     * @param newpriceMyToken nuevo valor en mi token personal del nft
     */
    function updateSale(uint256 itemId, uint256 newpriceEth, uint256 newpriceMyToken) public {
        require(msg.sender == sales[itemId].owner, "No eres el dueno del NFT");
        require(sales[itemId].available, "Ese NFT ya esta vendido, no puede actualizarlo");
        sales[itemId].priceEth = newpriceEth;
        sales[itemId].priceMyToken = newpriceMyToken;
    }

    /**
     * Método que permite quitar un elemento de la venta. 
     * ---------------------- Requisitos previos
     * 1. Tienes que ser el dueño del item que quieres cancelar.
     * 2. Que el item este disponible (es decir que no este vendido).
     * 
     * @param itemId identificador del item en venta a cancelar
     */
    function cancelSale(uint256 itemId) public {
        require(msg.sender == sales[itemId].owner, "No eres el dueno del NFT");
        require(sales[itemId].available, "Ese NFT ya esta vendido, no puede retirarlo de ventas");
        if(!(sales[itemId].nfttype)) IERC1155(sales[itemId].nftContractaddress).safeTransferFrom(address(this), msg.sender , sales[itemId].nftId, 1, "");
        else IERC721(sales[itemId].nftContractaddress).safeTransferFrom(address(this), msg.sender , sales[itemId].nftId, "");
        delete(sales[itemId]); // ponemos a null todos los atributos de esa posición.
    }

    /**
     * Método privado que actualiza los valores del item vendido.
     * 
     * @param itemId identificador del item que se puso en venta.
     */
    function _getSale(uint256 itemId) private {  // si pones guion bajo, se entiende que es privada.
        sales[itemId].timestamp = block.timestamp;
        sales[itemId].newowner = msg.sender;
        sales[itemId].available = false;
        // Le enviamos el NFT al comprador
        if(!(sales[itemId].nfttype)) IERC1155(sales[itemId].nftContractaddress).safeTransferFrom(address(this), msg.sender , sales[itemId].nftId, 1, "");
        else IERC721(sales[itemId].nftContractaddress).safeTransferFrom(address(this), msg.sender , sales[itemId].nftId, "");
        emit Sold(itemId, msg.sender);
    }

    /**
     * Método que permite comprar un NFT puesto en venta al precio de 
     * ETH establecido en el mismo.
     * ---------------------- Requisitos previos
     * 1. Que el NFT no este vendido.
     * 2. Que tenga suficiente ETH para comprar el NFT.
     * 
     * @param itemId identificador del item a comprar
     */
    function buySaleEth(uint256 itemId) public payable { // payable significa que va a recibir ether
        require(sales[itemId].available, "El NFT ya esta vendido");
        // msg.value dinero que esta enviando el ususario (ether)
        require(msg.value == sales[itemId].priceEth, "No tienes suficiente Ether para comprar el NFT");
        uint256 rest = _calcFeeCost(msg.value);
        payable(sales[itemId].owner).transfer(msg.value - rest); // se puede cobrar un porcentaje.
        _getSale(itemId);
     }

    /**
     * Método que permite comprar un NFT puesto en venta al precio de 
     * MyToken personal establecido en el mismo.
     * ---------------------- Requisitos previos
     * 1. Que el NFT no este vendido (este disponible).
     * 2. Que tenga suficiente Token personal para comprar el NFT.
     * 3. Que haya permitido a nuestro contrato cobrarse de la cuenta del cliente la cantidad de tokens suficientes.
     * 
     * @param itemId identificador del item a comprar
     */
    function buySaleMyToken(uint256 itemId, address tokenAddress) public {
        require(sales[itemId].available, "El NFT ya esta vendido");
        require(IERC20(tokenAddress).balanceOf(msg.sender) >= sales[itemId].priceMyToken, "No tienes suficiente token personal");
        require(IERC20(tokenAddress).allowance(msg.sender, address(this)) >= sales[itemId].priceMyToken, "No has permitido intercambiar suficiente token");
        uint256 rest = _calcFeeCost(sales[itemId].priceMyToken);
        IERC20(tokenAddress).transferFrom(msg.sender, sales[itemId].owner, sales[itemId].priceMyToken - rest);
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), rest); // se almacena en el contrato, luego tenemos que retirarlo.
        _getSale(itemId);
    }

    /**
     * Método que devuelve la cantidad de token que va a quedarse el contrato como
     * holder de la operción de compra-venta.
     * 
     * Puede ser útil definirla así por si en un futuro queremos cambiar la función y no tengamos
     * que ir cambiandola en todos los métidos que se cobre el fee.
     * 
     * @param amout cantidad de token que va a utilizarse en la compra
     */
    function _calcFeeCost(uint256 amout) internal view returns(uint256) {
        return (amout * feeCost) / 100;
    }

    /**
     * Método que nos permite actualizar el valor de la Fee.
     * 
     * @param newFee nuevo valor de la fee (1-99)
     */
    function setFee(uint8 newFee) public onlyOwner() {
        feeCost = newFee;
    }

    /**
     *  Método que devuelve el valor actual de la Fee.
     */
    function getFee() public onlyOwner view returns (uint8) {
        return feeCost;
    }

    /**
     *  Método que devuelve el número de items que están disponibles en
     *  nuestro mercado. 
     */
    function _getSize() internal view returns (uint256) {
        uint size = 0;
        for (uint256 i=1; i<=salesCounter; i++) {
            if (sales[i].available) {   // añadir nueva condición
                size++;
            }
        }
        return size;
     }

     /**
      *  Método que devuelve un listado de los NFTs que están disponible en
      *  nuestro mercado.
      */
     function getAvailables() public view returns (ItemInfo[] memory) {
        uint size = _getSize();
        ItemInfo[] memory availablesSales = new ItemInfo[](size);
        uint cont = 0;
        for (uint256 i=1; i<=salesCounter; i++) {
            if (sales[i].available) {
                availablesSales[cont++] = sales[i];
            }
        }
        return availablesSales;
     }

}