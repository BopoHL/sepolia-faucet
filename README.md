# Sepolia Faucet

A small ETH faucet on Sepolia built with plain Solidity (no framework).
Implements the `Owned` and `Pausable` access-control patterns, plus per-address
rate limiting and a whitelist. Compiled with `solc`, deployed with `cast` and
`ethers.js`.

**Deployed (Sepolia):** [`0xDD4eF652Bb6Fe92Ac5960034663b2C7963983206`](https://sepolia.etherscan.io/address/0xDD4eF652Bb6Fe92Ac5960034663b2C7963983206)

## Contracts

- **Owned** — `owner` set in the constructor, `onlyOwner` modifier.
- **Pausable** — `paused` flag, owner-only `pause()` / `unpause()`, `whenNotPaused` modifier.
- **Faucet** — `receive()` to fund it; `withdraw()` sends a fixed `WITHDRAW_AMOUNT`
  (0.01 ETH) via `.transfer`. Each address may withdraw once per `COOLDOWN_BLOCKS`
  (20). Whitelisted addresses may withdraw twice per window.

| caller      | withdrawals per 20-block window |
|-------------|----------------------------------|
| normal      | 1                                |
| whitelisted | 2                                |

## Layout

```
contracts/Faucet.sol        Owned, Pausable, Faucet
scripts/deploy-cast.sh      deploy with cast
scripts/deploy-ethers.js    deploy with ethers.js
scripts/whitelist-and-test.js   whitelist + withdraw helper
scripts/rename-artifacts.js     tidy solcjs output names
```

## Setup

```bash
npm install
cp .env.example .env          # fill in SEPOLIA_RPC_URL and PRIVATE_KEY
npm run compile               # -> out/Faucet.abi, out/Faucet.bin
```

Load the env vars into your shell before using `cast`:

```bash
set -a; source .env; set +a
```

## Deploy

With cast:

```bash
cast send --rpc-url "$SEPOLIA_RPC_URL" --private-key "$PRIVATE_KEY" \
  --create "0x$(cat out/Faucet.bin)"
```

With ethers.js:

```bash
npm run deploy                # prints address + deployment tx hash
```

The deployer address needs Sepolia ETH for gas (and for funding the faucet).

## Fund, whitelist, withdraw

```bash
# fund the faucet (triggers receive())
cast send <FAUCET> --value 0.05ether --rpc-url "$SEPOLIA_RPC_URL" --private-key "$PRIVATE_KEY"

# whitelist addresses (owner only)
cast send <FAUCET> "setWhitelisted(address,bool)" <ADDRESS> true --rpc-url "$SEPOLIA_RPC_URL" --private-key "$PRIVATE_KEY"

# withdraw
cast send <FAUCET> "withdraw()" --rpc-url "$SEPOLIA_RPC_URL" --private-key "$PRIVATE_KEY"
```

Read-only checks:

```bash
cast call <FAUCET> "owner()(address)" --rpc-url "$SEPOLIA_RPC_URL"
cast call <FAUCET> "whitelisted(address)(bool)" <ADDRESS> --rpc-url "$SEPOLIA_RPC_URL"
cast balance <FAUCET> --rpc-url "$SEPOLIA_RPC_URL" --ether
```

A normal address that calls `withdraw()` twice within 20 blocks gets
`cooldown active` on the second call; a whitelisted address gets two successes.

## Security

Never commit `.env` or your private key. Use a throwaway test account — a private
key controls its address on every network, mainnet included.
