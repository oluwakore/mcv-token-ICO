//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IMavericks.sol";


contract MavericksToken is ERC20, Ownable {

      IMavericks MavericksNFT;


      uint256 public constant tokenPrice = 0.0005 ether;
      uint256 public constant tokensPerNFT = 50 * 10**18;
      uint256 public constant maxTotalSupply = 1000000 * 10**18;

      mapping(uint256 => bool) public tokenIdsClaimed;

      constructor(address _mavericksContract) ERC20("Mavericks", "MAV") {
        MavericksNFT = IMavericks(_mavericksContract);
      }


      function mint(uint256 amount) public payable {
          uint256 _requiredAmount = tokenPrice * amount;
          require(msg.value >= _requiredAmount, "Ether sent is incorrect!");
          uint256 amountWithDecimals = amount * 10**18;
          require(totalSupply() + amountWithDecimals <= maxTotalSupply, "Exceeds the max total supply available");
          _mint(msg.sender, amountWithDecimals);
      }




      function claim() public {
        address sender = msg.sender;
        uint balance = MavericksNFT.balanceOf(sender);
        require(balance > 0, "You do not possess any Mavericks NFT");
        uint256 amount = 0;
        for(uint256 i = 0; i < balance; i++) {
          uint256 tokenId = MavericksNFT.tokenOfOwnerByIndex(sender, i);
          if(!tokenIdsClaimed[tokenId]) {
            amount += 1;
            tokenIdsClaimed[tokenId] = true;
          }
        }

        require(amount > 0, "You have already claimed all your tokens");

        _mint(msg.sender, amount * tokensPerNFT);
      }


    function withdraw() public onlyOwner {
      address _owner = owner();
      uint256 amount = address(this).balance;
      (bool sent,) = _owner.call{value: amount}("");
      require(sent, "Failed to send Ether");
    }

      receive() external payable{}

      fallback() external payable{}

}