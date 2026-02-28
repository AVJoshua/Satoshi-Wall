/**
 * OPNet contract deployment script for Satoshi's Wall.
 * Uses native Node.js fetch (bypasses undici) for Windows compatibility.
 *
 * Usage:
 *   MNEMONIC="your 24 words here" node deploy.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { Mnemonic, MLDSASecurityLevel, BIPStandard, TransactionFactory, ChallengeSolution } from '@btc-vision/transaction';

// ─── Configuration ────────────────────────────────────────────────────────────
const RPC_URL = 'https://testnet.opnet.org/api/v1/json-rpc';

// OPNet testnet: custom Signet fork with 'opt' bech32 prefix.
// Wallet addresses: opt1p... (P2TR), opt1q... (P2WPKH)
// Not in @btc-vision/bitcoin v6, so defined inline.
const NETWORK = {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'opt',
    bech32Opnet: 'opt',
    bip32: { public: 0x043587cf, private: 0x04358394 },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
};
const FEE_RATE = 5;
const GAS_SAT_FEE = 10_000n;

// ─── Minimal native-fetch RPC client (no undici) ─────────────────────────────
let _rpcId = 1;
async function rpc(method, params = []) {
    const body = JSON.stringify({ jsonrpc: '2.0', id: _rpcId++, method, params });
    const res = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const json = await res.json();
    if (json.error) throw new Error(`RPC ${method}: ${JSON.stringify(json.error)}`);
    return json.result;
}

// ─── Read mnemonic ────────────────────────────────────────────────────────────
const mnemonic = process.env.MNEMONIC?.trim() || process.argv[2]?.trim();
if (!mnemonic) {
    console.error('Usage: MNEMONIC="word1 ... word12or24" node deploy.mjs');
    process.exit(1);
}

// ─── Load WASM ────────────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const wasmPath = join(__dir, '../satoshis-wall-contract/build/SatoshisWall.wasm');
let bytecode;
try {
    bytecode = Buffer.from(readFileSync(wasmPath));
} catch {
    console.error('Could not read WASM at', wasmPath);
    console.error('Run `npm run build` inside satoshis-wall-contract/ first.');
    process.exit(1);
}
console.log(`WASM loaded: ${bytecode.length} bytes`);

// ─── Restore wallet ───────────────────────────────────────────────────────────
const mnemonicObj = new Mnemonic(mnemonic, '', NETWORK, MLDSASecurityLevel.LEVEL2);
// OPWallet uses BIP86 (m/86'/0'/0'/0/0) — must specify explicitly
const wallet = mnemonicObj.derive(0, 0, false, BIPStandard.BIP86);
console.log(`Deploying from P2TR: ${wallet.p2tr}`);

// ─── Fetch UTXOs ──────────────────────────────────────────────────────────────
console.log('Fetching UTXOs...');
const utxoResp = await rpc('btc_getUTXOs', [wallet.p2tr, false]);
const rawTxs = utxoResp?.raw ?? [];
const confirmedRaw = utxoResp?.confirmed ?? [];

if (confirmedRaw.length === 0) {
    console.error('No confirmed UTXOs for', wallet.p2tr);
    console.error('Fund this address with testnet BTC first.');
    process.exit(1);
}

// Build UTXO objects compatible with @btc-vision/transaction's IDeploymentParameters.
// nonWitnessUtxo (raw tx) is required for P2TR signing. The API returns base64 raw txs.
const utxos = confirmedRaw.map((u) => ({
    transactionId: u.transactionId,
    outputIndex: u.outputIndex,
    value: BigInt(u.value),
    scriptPubKey: u.scriptPubKey,
    nonWitnessUtxo: Buffer.from(rawTxs[u.raw], 'base64'),
}));
const totalSats = utxos.reduce((s, u) => s + u.value, 0n);
console.log(`UTXOs: ${utxos.length} (${totalSats} sats)`);

// ─── Get epoch challenge ──────────────────────────────────────────────────────
console.log('Fetching epoch challenge...');
const rawChallenge = await rpc('btc_preimage', []);
if (!rawChallenge?.solution || rawChallenge.solution.replace('0x', '') === '0'.repeat(64)) {
    console.error('No valid challenge from OPNet. Network may not be active.');
    process.exit(1);
}
const challenge = new ChallengeSolution(rawChallenge);
console.log(`Epoch #${challenge.epochNumber} — difficulty ${challenge.difficulty}`);

// ─── Sign deployment ──────────────────────────────────────────────────────────
console.log('Signing deployment...');
const factory = new TransactionFactory();
const deployment = await factory.signDeployment({
    from: wallet.p2tr,
    utxos,
    signer: wallet.keypair,
    mldsaSigner: wallet.mldsaKeypair,
    // NETWORK (bech32:'opt') — ChainData.js patched to return OPNet testnet genesis hash.
    network: NETWORK,
    feeRate: FEE_RATE,
    priorityFee: 0n,
    gasSatFee: GAS_SAT_FEE,
    bytecode,
    challenge,
    // Key already linked on-chain from previous attempt — set false to avoid reassign error.
    linkMLDSAPublicKeyToAddress: false,
    revealMLDSAPublicKey: false,
});
console.log(`Contract address : ${deployment.contractAddress}`);
console.log(`Contract pubkey  : ${deployment.contractPubKey}`);

// ─── Broadcast ────────────────────────────────────────────────────────────────
console.log('Broadcasting funding transaction...');
const fundRes = await rpc('btc_sendRawTransaction', [deployment.transaction[0], false]);
if (!fundRes?.success) {
    console.error('Funding TX failed:', fundRes?.error ?? fundRes);
    process.exit(1);
}
console.log('Funding TX:', fundRes.result ?? fundRes);

console.log('Broadcasting reveal transaction...');
const revealRes = await rpc('btc_sendRawTransaction', [deployment.transaction[1], false]);
if (!revealRes?.success) {
    console.error('Reveal TX failed:', revealRes?.error ?? revealRes);
    process.exit(1);
}
console.log('Reveal TX:', revealRes.result ?? revealRes);

// ─── Done ─────────────────────────────────────────────────────────────────────
console.log('\n=== DEPLOYMENT COMPLETE ===');
console.log('Contract address:', deployment.contractAddress);
console.log('\nUpdate src/config/networks.ts:');
console.log(`  export const CONTRACT_ADDRESS = '${deployment.contractAddress}';`);
console.log('\nWait ~10 blocks for OPNet to index it, then try posting.');
