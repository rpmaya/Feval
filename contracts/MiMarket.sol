// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MiMarket is Ownable, ERC1155Holder {

    struct RentalInfo {
        address owner; 
        address nftContract;
        uint256 nftId;
        uint256 priceEth;
        uint256 priceMyToken;
        uint initial; //timestamp when rent
        uint period; //seconds
        address renter;
        bool rented;  
    }

    uint256 public rentalsCounter; // rentalId
    mapping(uint256 => RentalInfo) public rentals; 
    //mapping(address => uint256[]) public renters;

    event Rental(uint256 id, address owner);
    event Rented(uint256 id, address renter);

    constructor(address initialOwner) Ownable(initialOwner) {
        rentalsCounter = 0;
    }

     // From NFT owner
    function putRent(address nftContract, uint256 nftId, uint256 priceEth, uint256 priceMyToken, uint period) public {
        require(period > 0, "Period must be greater than zero");
        require(IERC1155(nftContract).isApprovedForAll(msg.sender, address(this)), "It needs grants");
        IERC1155(nftContract).safeTransferFrom(msg.sender, address(this), nftId, 1, "");
        rentalsCounter++;
        
        rentals[rentalsCounter] = RentalInfo(msg.sender, nftContract, nftId, priceEth, priceMyToken, 0, period, msg.sender, false);
        emit Rental(rentalsCounter, msg.sender);
     }

     function updateRent(uint256 rentalId, uint256 priceEth, uint256 priceMyToken, uint period) public {
        require(msg.sender == rentals[rentalId].owner, "You are not the owner");
        require(!rentals[rentalId].rented, "It is still rented");
        rentals[rentalId] = RentalInfo(msg.sender, rentals[rentalId].nftContract, rentals[rentalId].nftId, priceEth, priceMyToken, 0, period, msg.sender, false);
     }

     function cancelRent(uint256 rentalId) public {
        require(msg.sender == rentals[rentalId].owner, "You are not the owner");
        require(!rentals[rentalId].rented, "It is still rented");
        IERC1155(rentals[rentalId].nftContract).safeTransferFrom(address(this), msg.sender, rentals[rentalId].nftId, 1, "");
        delete(rentals[rentalId]);
     }

    // From client
    function _getRent(uint256 rentalId) private {
        rentals[rentalId].initial = block.timestamp;
        rentals[rentalId].renter = msg.sender;
        rentals[rentalId].rented = true;
        emit Rented(rentalId, msg.sender);
    }

    function getRentEth(uint256 rentalId) public payable {
        require(!rentals[rentalId].rented, "It is already rented");
        require(msg.value == rentals[rentalId].priceEth, "Please submit the asking price in order to complete the purchase");
        payable(rentals[rentalId].owner).transfer(msg.value);
        _getRent(rentalId);
     }

    function getRentMyToken(uint256 rentalId, address tokenAddress) public {
        require(!rentals[rentalId].rented, "It is already rented");
        require(IERC20(tokenAddress).balanceOf(msg.sender) >= rentals[rentalId].priceMyToken, "Balance not enough");
        require(IERC20(tokenAddress).allowance(msg.sender, address(this)) >= rentals[rentalId].priceMyToken, "Allowance not enough"); 
        IERC20(tokenAddress).transferFrom(msg.sender, rentals[rentalId].owner, rentals[rentalId].priceMyToken);
        _getRent(rentalId);
     }


    // From contract owner (admin)
    function endRent(uint256 rentalId) public onlyOwner() {
        require(rentals[rentalId].rented, "It is not rented");
        require(block.timestamp >= rentals[rentalId].initial + rentals[rentalId].period, "You can't end it yet");
        rentals[rentalId].renter = rentals[rentalId].owner;
        rentals[rentalId].initial = 0;
        rentals[rentalId].rented = false;
     }

     function _getSize() private view returns (uint256) {
        uint size = 0;
        for (uint256 i=1; i<=rentalsCounter; i++) {
            if (!rentals[i].rented && rentals[i].period > 0) {
                size++;
            }
        }
        return size;
     }

     // To read the available NFTs
     function getAvailables() public view returns (RentalInfo[] memory) {
        uint size = _getSize();
        RentalInfo[] memory availables = new RentalInfo[](size);

        uint cont = 0;
        for (uint256 i=1; i<=rentalsCounter; i++) {
            if (!rentals[i].rented && rentals[i].period > 0) {
                availables[cont++] = rentals[i];
            }
        }
        return availables;
     }
}