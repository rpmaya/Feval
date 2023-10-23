const hre = require("hardhat");

async function main() {

  const [deployer] = await hre.ethers.getSigners();

  const miNFT = await hre.ethers.deployContract("MiNFT", [deployer]);

  await miNFT.waitForDeployment();

  console.log(
    `MiNFT deployed to ${miNFT.target}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});