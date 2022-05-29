//SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CrytpoDevs is ERC721Enumerable, Ownable{
    string _baseTokenURI;

    uint256 public _price = 0.01 ether;

    bool public _paused;

    uint256 public maxTokenIds = 20;

    uint256 public tokenIds;

    IWhitelist whitelist;

    bool public presaleStarted;

    uint256 public presaleEnded;

    modifier onlyWhenNotPaused{
        require(!_paused, "Contract currently paused");
        _;
    }
    constructor (string memory baseURI, address whitelistContract) ERC721("Crytpo Devs", "CD" ){
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);

    }

    function startPresale() public onlyOwner{
        presaleStarted = true;

        presaleEnded = block.timestamp + 5 minutes;
    }

    function presaleMint() public payable onlyWhenNotPaused{
        require(presaleStarted && block.timestamp < presaleEnded, "Presale is not running");
        require(whitelist.whitelistAddresses(msg.sender), "You are not whitelisted");
        require(tokenIds <= maxTokenIds, "Maximum tokens Ids reached");
        require(msg.value == _price, "the price is 0.01 ethers");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    function mint() public payable onlyWhenNotPaused{
        require(presaleStarted && block.timestamp >= presaleEnded, "Presale has not ended yet");
        require(tokenIds< maxTokenIds, "Maximum tokens Ids reached");
        require(msg.value >= _price, "minimum price is 0.01 ethers");
        tokenIds +=1;
        _safeMint(msg.sender, tokenIds);

    }

    function _baseURI() view internal virtual override returns(string memory){
        return _baseTokenURI;
    }

    function setPaused(bool val) public onlyOwner{
        _paused = val;
    }

    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send the Ether");
    }

    receive() external payable{}

    fallback() external payable{}
}