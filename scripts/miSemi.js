const hre = require("hardhat");

async function main() {

  const [deployer] = await hre.ethers.getSigners();

  const miSemi = await hre.ethers.deployContract("MiSemi", [deployer]);

  await miSemi.waitForDeployment();

  console.log(
    `MiSemi deployed to ${miSemi.target}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});