const hre = require("hardhat");

async function main() {
  
  const [deployer] = await hre.ethers.getSigners();

  const miMarket = await hre.ethers.deployContract("MiMarket", [deployer]);

  await miMarket.waitForDeployment();

  console.log(
    `MiMarket deployed to ${miMarket.target}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});