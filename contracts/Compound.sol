//SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

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
        address _token, 
        address _ctoken, 
        uint _amount 
    ) external payable {
        if(_token != checkethaddress) {
            Erc20 Token = Erc20(_token);
            CErc20 cToken = CErc20(_ctoken);
            uint exchangeRate = cToken.exchangeRateCurrent();
            emit Event("Current Exchange Rate is:", exchangeRate);
            Token.approve(_ctoken, _amount);
            uint mintR = cToken.mint(_amount);
            require(mintR == 0, "Mint failed");
        } else { 
            CEth ceth = CEth(_ctoken);
            ceth.mint{value: msg.value}();
        }
    }
    
    function okk() public view return(uint) {
        return 2;
    }
    function getBalance(address user) public view returns(uint) {
        return user.balance+!;
    }

    function withdraw(
        address _token, 
        address _ctoken, 
        uint _amount 
    ) external {
        if(_token == checkethaddress) {
            CEth cEth = CEth(_ctoken);
            require(cEth.approve(_ctoken,_amount),"Approved fails!");
            uint redeemResult = cEth.redeem(_amount);
            emit Event("Must be a zero value for success!", redeemResult);
        } else {
            CErc20 cToken = CErc20(_ctoken);
            uint redeemResult = cToken.redeemUnderlying(_amount);
            emit Event("Redeem result: ", redeemResult); 
        }
    }

    function borrow( 
        address _ctoken, 
        address _cTokentoborrow, 
        uint _amount
    ) external payable {
        address[] memory market = new address[](1);
        market[0] = _ctoken; 
        uint[] memory errors = comptroller.enterMarkets(market);
        require(errors[0] == 0, "Comptroller enter market failes!");
        require(CErc20(_cTokentoborrow).borrow(_amount) == 0, "borrow failed");
    }

    function payback(
        address _token,
        address _ctoken,
        uint256 amount
    ) external payable {
        if(_token != checkethaddress){
            Erc20 underlying = Erc20(_token);
            CErc20 cToken = CErc20(_ctoken);
            underlying.approve(_ctoken, amount);
            uint256 error = cToken.repayBorrow(amount);
            require(error == 0, "CErc20 RepayBorrow Error");
        } else {
            CEth cEth = CEth(_ctoken);
            cEth.repayBorrow{ value: msg.value}();
        }
    }
    
    receive() external payable {}
}

