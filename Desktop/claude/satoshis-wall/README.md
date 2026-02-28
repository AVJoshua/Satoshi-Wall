# Satoshi's Wall

> **Leave your mark on Bitcoin history — permanently.**

Satoshi's Wall is the world's first permanent message board built directly on Bitcoin Layer 1 using [OPNet](https://opnet.org) smart contracts. Every message is stored on-chain forever. One message per wallet. No tokens. No gas wars. Just Bitcoin.

---

## Features

- **Permanent on Bitcoin L1** — Messages are stored in an AssemblyScript smart contract on OPNet testnet (Signet fork), making them as permanent as Bitcoin itself
- **One message per wallet** — Each wallet address can carve exactly one 64-character message into history
- **1,000 sat fee** — A small 1,000 satoshi fee goes directly to the treasury wallet via Bitcoin UTXO
- **No token required** — Pay only in BTC (sats). No ERC-20, no wrapped tokens
- **Real-time wall** — Live feed polls every 5 seconds, updating as new messages are confirmed
- **Hall of Fame leaderboard** — Earliest inscribers ranked by Bitcoin block number
- **Glass morphism UI** — Premium dark UI with ambient gradients, backdrop blur, and smooth animations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | AssemblyScript → WASM, compiled for OPNet |
| Bitcoin L1 Runtime | [`@btc-vision/btc-runtime`](https://github.com/btc-vision/btc-runtime) |
| Frontend Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + custom CSS (glass morphism) |
| Wallet | OPWallet browser extension |
| RPC | OPNet JSON-RPC (`btc_call`) |
| Network | OPNet Testnet (Bitcoin Signet fork, `opt` bech32 prefix) |

---

## Contract

| Property | Value |
|---|---|
| Network | OPNet Testnet |
| Contract Address | `opt1sqzpm3gky8pxfa0ulnndeg500lv239s07vvxv8eu0` |
| Treasury Address | `opt1per7xtma7v53nllqwf7chl3lf3h2mvxcsqgdwsf56mt92ptfe56gsaeftqf` |
| Min Post Fee | 1,000 satoshis |
| Wall Capacity | 10,000 messages |
| RPC Endpoint | `https://testnet.opnet.org/api/v1/json-rpc` |

### Contract Methods

| Method | Selector | Description |
|---|---|---|
| `postMessage(uint256, uint256)` | `635734b9` | Post a 64-char message (requires 1,000 sat payment) |
| `getMessageCount()` | `91d46a36` | Returns total confirmed messages |
| `getMessage(uint256)` | `6a8bafa2` | Get single message by index |
| `getMessages(uint256, uint256)` | `77983818` | Batch fetch messages (offset, limit ≤ 50) |
| `getTotalRaised()` | `99e14bc8` | Total satoshis paid to treasury |
| `hasPosted(address)` | `8cc849be` | Check if address has already posted |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [OPWallet](https://opnet.org/wallet) browser extension
- OPNet testnet BTC (get from faucet at `https://testnet.opnet.org`)

### Install & Run

```bash
# Clone the repository
git clone <repo-url>
cd satoshis-wall

# Install dependencies
npm install

# Patch the opnet library for browser compatibility
# (fixes "signer is not allowed in interaction parameters" from OPWallet)
node patch-opnet.js   # if patch script exists, otherwise see DEVELOPMENT.md

# Start dev server
npm run dev
```

Open `http://localhost:5173`, connect your OPWallet, and leave your mark.

### Build for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
satoshis-wall/
├── src/
│   ├── abi/
│   │   └── SatoshisWall.ts        # Contract ABI + TypeScript interface
│   ├── components/
│   │   ├── common/
│   │   │   └── LoadingSkeleton.tsx
│   │   ├── wall/
│   │   │   ├── Hero.tsx            # Landing hero with live counter
│   │   │   ├── PostForm.tsx        # Message submission form
│   │   │   ├── StatsBar.tsx        # Live stats (count, raised, capacity)
│   │   │   ├── WallGrid.tsx        # Paginated message tile grid
│   │   │   ├── MessageTile.tsx     # Individual message card
│   │   │   ├── Leaderboard.tsx     # Hall of Fame (earliest inscribers)
│   │   │   └── LiveFeed.tsx        # Scrolling activity ticker
│   │   └── wallet/
│   │       └── Header.tsx          # Navigation + wallet connect
│   ├── config/
│   │   └── networks.ts             # Contract address, RPC, network config
│   ├── hooks/
│   │   ├── useWall.ts              # Wall data + polling (batch RPC)
│   │   └── useWallet.ts            # OPWallet connection state
│   ├── types/
│   │   └── index.ts                # Shared TypeScript types
│   ├── utils/
│   │   └── encoding.ts             # Message encode/decode (UTF-8 ↔ u256)
│   ├── styles/
│   │   └── index.css               # Global styles + glass morphism system
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── btc.svg                     # Brick-wall favicon
├── deploy.mjs                       # Contract deployment script
├── docs/
│   ├── PRD.md
│   └── WHITEPAPER.md
└── README.md

satoshis-wall-contract/             # Separate contract workspace
├── src/wall/
│   ├── index.ts                    # Contract entry point
│   └── SatoshisWall.ts             # Main AssemblyScript contract
└── build/
    └── SatoshisWall.wasm           # Compiled contract
```

---

## How It Works

### Posting a Message

1. User connects OPWallet and types a message (≤ 64 characters)
2. Frontend calls `contract.setTransactionDetails()` with a simulated 1,000 sat treasury output
3. Contract is simulated via `btc_call` — verifies the payment output and checks `hasPosted`
4. If simulation succeeds, `sendTransaction()` builds a Bitcoin transaction containing:
   - **1,000 sat UTXO** → treasury address (verified by contract)
   - **Calldata** (message encoded as two `uint256` chunks in Tapscript)
   - **Network fee** → Bitcoin miners
5. OPWallet signs and broadcasts the two-phase transaction (commit + reveal)
6. When the reveal tx mines, the message appears on the wall

### Reading Messages

The frontend bypasses the `opnet` library's `JSONRpcProvider` entirely for reads (it uses `undici`/Node.js HTTP which fails in browsers). Instead, it uses native `fetch()` directly against the `btc_call` JSON-RPC endpoint:

- **Initial load**: `getMessages(0, 50)` — one batch call for up to 50 messages
- **Polling**: `getMessageCount()` every 5 seconds — only refetches messages if count changed
- **Total raised**: `getTotalRaised()` fetched in parallel with messages

### Message Encoding

Messages are encoded as two `uint256` (32-byte) chunks in big-endian UTF-8:

```
"Hello World" → padded to 64 bytes → split into chunk1 (bytes 0-31) + chunk2 (bytes 32-63)
chunk1 = 0x48656c6c6f20576f726c640000...0000
chunk2 = 0x0000...0000
```

---

## OPNet Payment Model

OPNet uses Bitcoin's UTXO model — contracts **cannot hold or send BTC**. Instead, they act as witnesses:

1. The user's wallet includes a UTXO output paying 1,000 sats to the treasury address in the same transaction as the contract call
2. The contract iterates `Blockchain.tx.outputs` and verifies a qualifying output exists
3. If verified, state is updated. BTC lands directly in the treasury wallet at the Bitcoin level
4. No custodial risk — the contract never holds funds

---

## License

MIT
