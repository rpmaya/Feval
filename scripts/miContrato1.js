const hre = require("hardhat");

async function main() {
  
  const valor = 1000;
  
  const [deployer] = await hre.ethers.getSigners();

  const miContrato1 = await hre.ethers.deployContract("MiContrato1", [valor, deployer]);

  await miContrato1.waitForDeployment();

  console.log(
    `MiContrato1 deployed to ${miContrato1.target}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
