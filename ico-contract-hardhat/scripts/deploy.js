const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { MAVERICKS_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main() {
  const mavericksNFTContract = MAVERICKS_NFT_CONTRACT_ADDRESS;

  const mavericksTokenContract = await ethers.getContractFactory(
    "MavericksToken"
  );

  const deployedMavericksTokenContract = await mavericksTokenContract.deploy(
    mavericksNFTContract
  );

  console.log(
    "Mavericks Token Contract Address:",
    deployedMavericksTokenContract.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
