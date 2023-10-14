const hre = require("hardhat");

async function main() {

  const [deployer] = await hre.ethers.getSigners();

  const miToken = await hre.ethers.deployContract("MiToken", [deployer]);

  await miToken.waitForDeployment();

  console.log(
    `MiToken deployed to ${miToken.target}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});