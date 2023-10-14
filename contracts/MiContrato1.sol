// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // Declaración de versión

// Bibliotecas importadas
import "@openzeppelin/contracts/access/Ownable.sol";

// Contrato
contract MiContrato1 is Ownable {
    // Variable de estado
    uint256 public miVariable;

    // Evento
    event ValorModificado(uint256 nuevoValor, address modificadoPor);

    // Constructor
    constructor(uint256 _valorInicial, address initialOwner) Ownable(initialOwner) {
        miVariable = _valorInicial;
    }

    // Función para establecer miVariable
    function setMiVariable(uint256 _nuevoValor) public onlyOwner {
        require(_nuevoValor % 2 == 1, "Solo numeros impares son permitidos");
        miVariable = _nuevoValor;
        emit ValorModificado(_nuevoValor, msg.sender);
    }

    // Función para obtener miVariable
    function getMiVariable() public view returns (uint256) {
        return miVariable;
    }
}
