require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

const privateKey1 = process.env.privateKey1;

/** @type import('hardhat/config').HardhatUserConfig */
/*
module.exports = {
  solidity: "0.8.19",
};
*/

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/ok__EFkMZ3PUYd430g4ZqvDXwEjXX-zy",
      accounts: [privateKey1]
    },
    ethereum: {
      url: "https://eth-mainnet.g.alchemy.com/v2/cctT2t_p86WvdRAMls954F3GZU9NLxjy",
      accounts: [privateKey1]
    }
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
}


