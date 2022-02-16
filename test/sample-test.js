const { expect } = require("chai");
const { ethers } = require("hardhat");
const ether1 = require("ethers");
const { messagePrefix } = require("@ethersproject/hash");
const provider1 = ether1.getDefaultProvider();

const { CETH, CWBTC } = require("./config");

describe("Compound Protocol :", () => {
    let MyCompound, mycompoundproxy, owner;
    let tokenArtifact, token, tokenWithSigner;
    let cTokenArtifact, cToken, cTokenWithSigner;
    let dai, signer, val;
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
        await mycompoundproxy.Initpriceandcompaddress(comptrollerAddress, priceFeedAddress);
        cTokenArtifact = await artifacts.readArtifact("CErc20");
        cToken = new ethers.Contract(CDAI, cTokenArtifact.abi, ethers.provider);
        cTokenWithSigner = cToken.connect(owner);
        signer = await ethers.getSigner(ACC);
        val = ethers.utils.parseUnits("0.000000001", 18);
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

         /*await hre.network.provider.request({
             method: "hardhat_impersonateAccount",
             params: [newCDAI],
         });*/
         
         await tokenWithSigner.approve(mycompoundproxy.address, dai);
         await token.connect(signer).transfer(mycompoundproxy.address, dai);
         let checkR = await token.balanceOf(mycompoundproxy.address);
         expect(checkR).to.equal(1000000000000);

         console.log("Initial DAI in account: ", await token.balanceOf(mycompoundproxy.address));
         console.log("Initial CDAI in account: ", await cToken.balanceOf(mycompoundproxy.address));

         await mycompoundproxy.deposit(DAI, CDAI, val);
         console.log("After deposit  DAI tokens to compound, the remaining balance is: ",await token.balanceOf(mycompoundproxy.address));
         console.log("After Deposit CDAI in account: ", await cToken.balanceOf(mycompoundproxy.address));

         console.log("Deposited Erc20!");
         console.log("Before withdraw DAI in account :",await token.balanceOf(mycompoundproxy.address));
         console.log("Before withdraw CDAI in account :",await cToken.balanceOf(mycompoundproxy.address));
         
         await mycompoundproxy.withdraw(DAI,CDAI,val);
         console.log("With draw done ERC20!");
         console.log("After withdraw dai balance is", await token.balanceOf(mycompoundproxy.address));
         console.log("After withdraw cdai balance is", await cToken.balanceOf(mycompoundproxy.address));
     }).timeout(40000000);

     describe("", function () {
       it("Should Deposit and withDraw the ether", async() => {
           await network.provider.send("hardhat_setBalance", [
               owner.address,
               ethers.utils.parseEther('10.0').toHexString(),
           ]);

           console.log("Initial eth in account is: ",await mycompoundproxy.getBalance(owner.address));
           await mycompoundproxy.deposit(CheckEth, CETH,100,{value: ethers.utils.parseEther('1').toHexString()});
           console.log("Afer deposit eth account balance is(Must be 10*10**18 - 10**18 - gasfees): ",await mycompoundproxy.getBalance(owner.address));
           console.log("Deposited Eth!");

           console.log("Initial eth before withdraw in account is: ",await mycompoundproxy.getBalance(owner.address));
           
           const val = ethers.utils.parseEther('0.1');
           await mycompoundproxy.withdraw(CheckEth,CETH,val);

           console.log("withdrawn eth!");
       }).timeout(40000000);

    it("Should Borrow & Payback ERC20", async () => {
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

        const signer = await ethers.getSigner(ACC);
        const val = ethers.utils.parseUnits("0.000000001", 18);
        await tokenWithSigner.approve(mycompoundproxy.address, dai);
        await token.connect(signer).transfer(mycompoundproxy.address, dai);
        let checkR = await token.balanceOf(mycompoundproxy.address);
        expect(checkR).to.equal(1000000000000);
        console.log("Initial DAI in account: ", await token.balanceOf(mycompoundproxy.address));
        console.log("Initial CDAI in account: ", await cToken.balanceOf(mycompoundproxy.address));
        const check = await mycompoundproxy.deposit(DAI, CDAI, val);
        console.log("After depost  DAI tokens to compound, the remaining balance is: ", await token.balanceOf(mycompoundproxy.address));
        console.log("After Deposit CDAI in account: ", await cToken.balanceOf(mycompoundproxy.address));
        expect(check.value).to.equal(0);
        console.log("Deposited Erc20!");

        console.log("Before borrow DAI, the balance is: ", await token.balanceOf(mycompoundproxy.address));
        await mycompoundproxy.borrow(CDAI, CDAI, 10000);
        console.log("After borrow DAI, the balance is: ", await token.balanceOf(mycompoundproxy.address));
        console.log("Borrow done!");

        await mycompoundproxy.payback(DAI, CDAI, 10000);
        console.log("After Payback DAI tokens are: ", await token.balanceOf(mycompoundproxy.address));
        console.log("Payback done!");
    }).timeout(40000000);
    describe("", function () {
        it("Should borrow and payback the ether", async() => {
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
            await tokenWithSigner.approve(mycompoundproxy.address, dai);
            await token.connect(signer).transfer(mycompoundproxy.address, dai);

            console.log("Initial DAI tokens: ",await token.balanceOf(owner.address));
            console.log("Initial eth in account is: ",await mycompoundproxy.getBalance(owner.address));
            await mycompoundproxy.deposit(CheckEth, CETH,100,{value: ethers.utils.parseEther('1').toHexString()});
            console.log("Afer deposit eth account balance is(Must be 10*10**18 - 10**18 - gasfees): ",await mycompoundproxy.getBalance(owner.address));
            console.log("Deposited Eth!");

            console.log("before borrow eth balance is: ",await mycompoundproxy.getBalance(owner.address));
            console.log(await token.balanceOf(owner.address));
            console.log(await cToken.balanceOf(owner.address));
            await mycompoundproxy.borrow(CETH,CDAI,1000);  
            console.log("Borrow done!");
            console.log("After borrow eth before withdraw in account is: ",await mycompoundproxy.getBalance(owner.address));

        }).timeout(40000000);
    });
   });
});
});