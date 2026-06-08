// Normalizes solcjs output filenames (e.g. contracts_Faucet_sol_Faucet.bin)
// into clean out/Faucet.bin / out/FaucetMerkle.bin etc.
const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "out");
const files = fs.readdirSync(outDir);

// FaucetMerkle first so "_Faucet" matching never grabs the wrong file.
const CONTRACTS = ["FaucetMerkle", "Faucet"];

for (const name of CONTRACTS) {
  for (const ext of ["bin", "abi"]) {
    const match = files.find((f) => f.endsWith(`_${name}.${ext}`));
    if (match) {
      fs.copyFileSync(path.join(outDir, match), path.join(outDir, `${name}.${ext}`));
      console.log(`out/${match} -> out/${name}.${ext}`);
    }
  }
}
