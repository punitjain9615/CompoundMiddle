//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "./Interface.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Compound is Initializable {
    event Event(string, uint);
    address public checkethaddress = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    Comptroller public comptroller;
    PriceFeed public pricefeed;

    function Initpriceandcompaddress(
        address _comptrolleraddress,
        address _pricefeedaddress
    ) public initializer {
        comptroller = Comptroller(_comptrolleraddress);
        pricefeed = PriceFeed(_pricefeedaddress);
    }

    function deposit(
        address _token, // if supply eth _token must be (0xeeeeee..ee) //
        address _ctoken, // must set the value for both type of transactions //
        uint _amount // must be set for supply eth //
    ) external payable returns(uint) {
        if(_token != checkethaddress) { // for supply _token //
            Erc20 Token = Erc20(_token);
            CErc20 cToken = CErc20(_ctoken);
            uint exchangeRate = cToken.exchangeRateCurrent();
            emit Event("Current Exchange Rate is:", exchangeRate);
            Token.approve(_ctoken, _amount);
            uint mintR = cToken.mint(_amount);
            require(mintR == 0, "Mint failed");
            return mintR;
        } else { // for supply eth //
            CEth ceth = CEth(_ctoken);
            ceth.mint{value: msg.value}();
            emit Event("Deposit of ether done of value:", msg.value);
            return 0;
        }
    }

    function getBalance() public view returns(uint) {
        return address(this).balance;
    }

    function withdraw(
        address _token, // must be (0xeeeeeeeeeee..ee) for with cethers //
        address _ctoken, 
        uint _amount 
    ) external returns(uint) {
        if(_token == checkethaddress) {
            CEth cEth = CEth(_ctoken);
            require(cEth.approve(_ctoken,_amount),"Approved fails!");
            uint redeemResult = cEth.redeem(_amount);
            emit Event("Must be a zero value for success!", redeemResult);
            return 0;
        } else {
            CErc20 cErc20 = CErc20(_ctoken);
            uint redeemResult = cErc20.redeem(_amount);
            emit Event("Redeem result: ", redeemResult);
            return 0;
        }
    }

    function borrow(
        address _token,
        address _cTokenAddress, 
        uint _amount 
    ) external payable returns(uint) {
        if(_token == checkethaddress) { // for borrow eth //
            CEth cEth = CEth(_cTokenAddress);
            CErc20 cToken = CErc20(_cTokenAddress);
            cEth.mint{value: msg.value, gas: 240000 }();

            // Enter the ETH market 
            address[] memory cTokens = new address[](1);
            cTokens[0] = _token;
            uint256[] memory errors = comptroller.enterMarkets(cTokens);
            require(errors[0] == 0, "Comptroller EnterMarkets failed.");

            uint256 borrows = cToken.borrowBalanceCurrent(address(this));
            emit Event("Current underlying borrow amount", borrows);

            return borrows;
        } else { // for borrow erc20 token //
            Erc20  erc20 = Erc20(_token);
            CErc20 cToken = CErc20(_cTokenAddress);

            erc20.approve(_cTokenAddress, _amount);

            uint256 error = cToken.mint(_amount);
            require(error == 0, "CErc20 mint Error");

            address[] memory cTokens = new address[](1);
            cTokens[0] = _cTokenAddress;
            uint256[] memory errors = comptroller.enterMarkets(cTokens);
            require(errors[0] == 0,"Comptroller EnterMarkets failed.");
            require(cToken.borrow(_amount) == 0, "borrow failed!");

            uint256 borrows = cToken.borrowBalanceCurrent(address(this));
            emit Event("Current ETH borrow amount", borrows);

            return borrows;
        }
    }

    function payback(
        address _token, // borrow erc20 //
        address _ctoken,
        uint256 amount
    ) external returns(uint) {
        if(_token != checkethaddress){
            Erc20 underlying = Erc20(_token);
            CErc20 cToken = CErc20(_ctoken);

            underlying.approve(_ctoken, amount);
            uint256 error = cToken.repayBorrow(amount);

            require(error == 0, "CErc20 RepayBorrow Error");
            return 0;
        } else {
            CEth cEth = CEth(_ctoken);
            cEth.repayBorrow{ value: amount }();
            return 0;
        }
    }

    receive() external payable {}
}

