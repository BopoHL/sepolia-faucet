// Builds the whitelist Merkle tree and prints the root + a proof per address.
// Leaf and pair hashing match FaucetMerkle.sol (keccak256(abi.encodePacked(addr)),
// sorted pairs). Uses ethers only — no extra libraries.

const { ethers } = require("ethers");

const ADDRESSES = [
  "0x828d049ac51233EF245eCE7b00a89cC05aC99A7C",
  "0x969E0A74E5C2210da077E31B79Ba98bfa82c1E79",
  "0x0C29a7407d2BD26FAede87F3A9DF3386fFb2464f",
];

const leafOf = (addr) => ethers.solidityPackedKeccak256(["address"], [addr]);

const hashPair = (a, b) => {
  const [x, y] = a.toLowerCase() <= b.toLowerCase() ? [a, b] : [b, a];
  return ethers.keccak256(ethers.concat([x, y]));
};

function buildLayers(leaves) {
  const layers = [leaves];
  while (layers[layers.length - 1].length > 1) {
    const cur = layers[layers.length - 1];
    const next = [];
    for (let i = 0; i < cur.length; i += 2) {
      next.push(i + 1 === cur.length ? cur[i] : hashPair(cur[i], cur[i + 1]));
    }
    layers.push(next);
  }
  return layers;
}

function proofFor(layers, index) {
  const proof = [];
  for (let i = 0; i < layers.length - 1; i++) {
    const layer = layers[i];
    const sibling = index ^ 1; // pair partner: index-1 if odd, index+1 if even
    if (sibling < layer.length) proof.push(layer[sibling]);
    index >>= 1;
  }
  return proof;
}

function verify(proof, root, leaf) {
  let h = leaf;
  for (const p of proof) h = hashPair(h, p);
  return h === root;
}

const leaves = ADDRESSES.map(leafOf);
const layers = buildLayers(leaves);
const root = layers[layers.length - 1][0];

console.log("merkleRoot:", root, "\n");
ADDRESSES.forEach((addr, i) => {
  const proof = proofFor(layers, i);
  const ok = verify(proof, root, leaves[i]);
  console.log(`${addr}  ${ok ? "OK" : "FAILED"}`);
  console.log(`  proof: [${proof.join(",")}]\n`);
});
