#!/usr/bin/env bash
# Deploy Faucet to Sepolia with cast.
#   export SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
#   export PRIVATE_KEY="0x..."
#   ./scripts/deploy-cast.sh
set -euo pipefail

SEPOLIA_RPC_URL="${SEPOLIA_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
: "${PRIVATE_KEY:?Set PRIVATE_KEY env var}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -f "$ROOT/out/Faucet.bin" ]; then
  solc --bin --abi --optimize -o "$ROOT/out" --overwrite "$ROOT/contracts/Faucet.sol"
fi

cast send \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --create "0x$(cat "$ROOT/out/Faucet.bin")"
