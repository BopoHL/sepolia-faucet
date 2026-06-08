const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const { SEPOLIA_RPC_URL, PRIVATE_KEY } = process.env;
  if (!SEPOLIA_RPC_URL || !PRIVATE_KEY) {
    throw new Error("Set SEPOLIA_RPC_URL and PRIVATE_KEY in .env");
  }

  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const out = path.join(__dirname, "..", "out");
  const abi = JSON.parse(fs.readFileSync(path.join(out, "Faucet.abi"), "utf8"));
  const bytecode = "0x" + fs.readFileSync(path.join(out, "Faucet.bin"), "utf8").trim();

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  const tx = contract.deploymentTransaction();

  console.log("Deployment tx hash:", tx.hash);
  await contract.waitForDeployment();
  console.log("Faucet deployed at:", await contract.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
