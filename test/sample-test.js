const { expect } = require("chai");
const { ethers } = require("hardhat");
const ether1 = require("ethers");
const { messagePrefix } = require("@ethersproject/hash");
const provider1 = ether1.getDefaultProvider();

const {CETH} = require("./config");

describe("Compound Protocol :", () => {
    let MyCompound, mycompoundproxy, owner;
    let tokenArtifact, token, tokenWithSigner;
    let cTokenArtifact,cToken,cTokenWithSigner;
    let dai;
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const CDAI = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643";
    const CETH = "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5";
    const ACC = "0x9a7A9D980Ed6239b89232C012E21f4c210F4Bef1";
    const Erc20 = "0xc3761EB917CD790B30dAD99f6Cc5b4Ff93C4F9eA";
    const comptrollerAddress = "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B";
    const priceFeedAddress = "0x922018674c12a7F0D394ebEEf9B58F186CdE13c1";
    const CheckEth = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    const newCDAI = "0x10bf1Dcb5ab7860baB1C3320163C6dddf8DCC0e4";
    beforeEach(async function () {
        MyCompound = await ethers.getContractFactory("Compound");
        [owner, _] = await ethers.getSigners();
        mycompoundproxy = await MyCompound.deploy();
        await mycompoundproxy.deployed();
        dai = ethers.utils.parseUnits("0.000001", 18);
        tokenArtifact = await artifacts.readArtifact("IERC20");
        token = new ethers.Contract(DAI, tokenArtifact.abi, ethers.provider);
        tokenWithSigner = token.connect(owner);
        mycompoundproxy.Initpriceandcompaddress(comptrollerAddress,priceFeedAddress);
        cTokenArtifact = await artifacts.readArtifact("CErc20");
        cToken = new ethers.Contract(CDAI, cTokenArtifact.abi, ethers.provider);
        cTokenWithSigner = cToken.connect(owner);
    });

       describe("", function () {
        it("Should Deposit the ERC20 tokens and withdraw ", async() => {
            await network.provider.send("hardhat_setBalance", [
                ACC,
                ethers.utils.parseEther('10.0').toHexString(),
            ]);

            await network.provider.send("hardhat_setBalance", [
                owner.address,
                ethers.utils.parseEther('10.0').toHexString(),
            ]);

            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [ACC],
            });

            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [newCDAI],
            });

            const signer1 = await ethers.getSigner(newCDAI);
            const signer = await ethers.getSigner(ACC);

            await token.connect(signer).transfer(owner.address, dai);
            await tokenWithSigner.approve(mycompoundproxy.address, dai);
            await token.connect(signer).transfer(mycompoundproxy.address, dai);
            let checkR = await token.balanceOf(mycompoundproxy.address);
            expect(checkR).to.equal(1000000000000);
            // Initial balance of tokens(DAI) is 1000000000000.
            console.log("Initial DAI in account: ", await token.balanceOf(mycompoundproxy.address));
            console.log("Initial CDAI in account: ", await cToken.balanceOf(mycompoundproxy.address));
            tokenWithSigner.approve(mycompoundproxy.address,dai);
            const check = await mycompoundproxy.deposit(DAI, CDAI, dai);
            console.log("After depost all DAI tokens to compound, the remaining balance is: ",await token.balanceOf(mycompoundproxy.address));
            console.log("After Deposit CDAI in account: ", await cToken.balanceOf(mycompoundproxy.address));
            expect(check.value).to.equal(0);
            checkR = await token.balanceOf(mycompoundproxy.address);
            // After Deposit the balance of tokens(DAI) are 0.
            expect(checkR).to.equal(0);
            console.log("Deposited Erc20!");
            await mycompoundproxy.withdraw(DAI,CDAI,dai);
            console.log("With draw done ERC20!");
        }).timeout(40000000);

        describe("", function () {
          it("Should Deposit and withDraw the ether", async() => {
              await network.provider.send("hardhat_setBalance", [
                  ACC,
                  ethers.utils.parseEther('10.0').toHexString(),
              ]);
  
              await network.provider.send("hardhat_setBalance", [
                  owner.address,
                  ethers.utils.parseEther('10.0').toHexString(),
              ]);
              await network.provider.send("hardhat_setBalance", [
                mycompoundproxy.address,
                ethers.utils.parseEther('10.0').toHexString(),
              ]);
  
              await hre.network.provider.request({
                  method: "hardhat_impersonateAccount",
                  params: [ACC],
              });

              const signer = await ethers.getSigner(ACC);
              const newCETH = "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5";

              await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [newCETH],
              });

              const check = await mycompoundproxy.deposit(CheckEth, CETH,100,{value: ethers.utils.parseEther('1.0').toHexString()});
              console.log("Deposited Eth!");
              await mycompoundproxy.withdraw(CheckEth,CETH,dai);

              console.log("withdrawn eth!");
          }).timeout(40000000);

        it("Should Borrow & Payback ERC20", async() => {
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [newCDAI],
            });

            await network.provider.send("hardhat_setBalance", [
                ACC,
                ethers.utils.parseEther('10.0').toHexString(),
            ]);
          
            await network.provider.send("hardhat_setBalance", [
                owner.address,
                ethers.utils.parseEther('10.0').toHexString(),
            ]);
      
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [ACC],
            });

            const signer = await ethers.getSigner(ACC);
            const signer1 = await ethers.getSigner(newCDAI);

            // transfer tokens to deployed address//
            await cTokenWithSigner.approve(mycompoundproxy.address, dai);
            await cToken.connect(signer1).transfer(mycompoundproxy.address, dai);
            await tokenWithSigner.approve(mycompoundproxy.address,dai);
            await token.connect(signer).transfer(mycompoundproxy.address, dai);
            console.log("Before borrow the CDAI balance: ",await cToken.balanceOf(mycompoundproxy.address));

            await mycompoundproxy.borrow(DAI, CDAI, dai);
            console.log("Borrowed Erc20!"); 
            console.log("After borrow the CDAI balance: ", await cToken.balanceOf(mycompoundproxy.address));

            const check2 = (await mycompoundproxy.payback(DAI, CDAI, dai));

            expect(check2.value).to.equal(0);
            console.log("Payed Back Erc20!"); 

        }).timeout(40000000);
     });
  });
});