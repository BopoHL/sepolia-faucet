const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
require("dotenv").config();

const WHITELIST = [
  "0x828d049ac51233EF245eCE7b00a89cC05aC99A7C",
  "0x969E0A74E5C2210da077E31B79Ba98bfa82c1E79",
  "0x0C29a7407d2BD26FAede87F3A9DF3386fFb2464f",
];

async function main() {
  const { SEPOLIA_RPC_URL, PRIVATE_KEY, FAUCET_ADDRESS } = process.env;
  if (!SEPOLIA_RPC_URL || !PRIVATE_KEY) throw new Error("Set SEPOLIA_RPC_URL and PRIVATE_KEY in .env");
  if (!FAUCET_ADDRESS) throw new Error("Set FAUCET_ADDRESS env var");

  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const abi = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "out", "Faucet.abi"), "utf8"));
  const faucet = new ethers.Contract(FAUCET_ADDRESS, abi, wallet);

  for (const addr of WHITELIST) {
    const tx = await faucet.setWhitelisted(addr, true);
    await tx.wait();
    console.log("whitelisted", addr);
  }

  const tx = await faucet.withdraw();
  await tx.wait();
  console.log("withdraw ok, tx:", tx.hash);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
