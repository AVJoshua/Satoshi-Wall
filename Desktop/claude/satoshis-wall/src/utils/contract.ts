import { fromBech32 } from '@btc-vision/bitcoin';
import { RPC_URL, CONTRACT_ADDRESS } from '../config/networks';

const RPC_ENDPOINT = `${RPC_URL}/api/v1/json-rpc`;
const SEL_HAS_POSTED = '8cc849be';

/** Decode a bech32/bech32m OPNet address to a 32-byte hex string (left-padded). */
function addressToHex32(addr: string): string | null {
    try {
        const { data } = fromBech32(addr);
        const padded = new Uint8Array(32);
        padded.set(data, 32 - data.length);
        return Array.from(padded).map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
        return null;
    }
}

/**
 * Check on-chain whether a wallet address has already posted.
 * Returns true/false, or null if the check could not be performed (fail-open).
 */
export async function checkHasPosted(walletAddress: string): Promise<boolean | null> {
    try {
        const addrHex = addressToHex32(walletAddress);
        if (!addrHex) return null;

        const resp = await fetch(RPC_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'btc_call',
                params: [CONTRACT_ADDRESS, SEL_HAS_POSTED + addrHex, null, null, null, null, null],
            }),
        });
        if (!resp.ok) return null;
        const json = await resp.json() as { result?: { result?: string; revert?: string } };
        if (!json.result?.result || json.result.revert) return null;
        const bytes = Uint8Array.from(atob(json.result.result), (c) => c.charCodeAt(0));
        return bytes[0] === 1;
    } catch {
        return null;
    }
}
