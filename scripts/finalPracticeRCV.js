const hre = require("hardhat");

async function main() {

  const [deployer] = await hre.ethers.getSigners();

  const mimercado= await hre.ethers.deployContract("FinalPracticeRCV", [deployer]);

  await mimercado.waitForDeployment();

  console.log(
    `Mimercado deployed to ${mimercado.target}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});