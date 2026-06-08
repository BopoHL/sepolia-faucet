// Normalizes solcjs output filenames into out/Faucet.abi and out/Faucet.bin.
// solcjs mangles names like "contracts_Faucet_sol_Faucet.bin"; we want clean names.
const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "out");
const files = fs.readdirSync(outDir);

function pick(ext) {
  // Prefer the file for the `Faucet` contract specifically.
  const match =
    files.find((f) => f.endsWith(`_Faucet.${ext}`)) ||
    files.find((f) => f.endsWith(`Faucet.${ext}`));
  if (!match) throw new Error(`Could not find compiled .${ext} for Faucet in ${outDir}`);
  return match;
}

for (const ext of ["bin", "abi"]) {
  const src = pick(ext);
  const dest = path.join(outDir, `Faucet.${ext}`);
  fs.copyFileSync(path.join(outDir, src), dest);
  console.log(`out/${src} -> out/Faucet.${ext}`);
}
