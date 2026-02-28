import { useState, useEffect, useCallback, useRef } from 'react';
import type { WallMessage, WallStats } from '../types/index';
import { decodeMessage } from '../utils/encoding';
import { RPC_URL, CONTRACT_ADDRESS } from '../config/networks';

const RPC_ENDPOINT = `${RPC_URL}/api/v1/json-rpc`;

// ABI selectors (SHA256 of function signature, first 4 bytes)
const SEL_COUNT        = '91d46a36'; // getMessageCount()
const SEL_MESSAGES     = '77983818'; // getMessages(uint256,uint256)
const SEL_TOTAL_RAISED = '99e14bc8'; // getTotalRaised()

/** Raw JSON-RPC call to the wall contract. Returns decoded bytes or null. */
async function contractCall(calldata: string): Promise<Uint8Array | null> {
    const payload = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'btc_call',
        params: [CONTRACT_ADDRESS, calldata, null, null, null, null, null],
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    let resp: Response;
    try {
        resp = await fetch(RPC_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timer);
    }

    if (!resp.ok) return null;

    const json = (await resp.json()) as {
        result?: { result?: string; revert?: string };
    };

    if (!json.result?.result || json.result.revert) return null;

    return Uint8Array.from(atob(json.result.result), (c) => c.charCodeAt(0));
}

function u256Hex(value: bigint): string {
    return value.toString(16).padStart(64, '0');
}

function readU256(bytes: Uint8Array, offset = 0): bigint {
    let r = 0n;
    for (let i = offset; i < offset + 32; i++) r = (r << 8n) | BigInt(bytes[i]);
    return r;
}

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

/** Fetch current message count. */
async function fetchCount(): Promise<bigint | null> {
    const bytes = await contractCall(SEL_COUNT);
    if (!bytes || bytes.length < 32) return null;
    return readU256(bytes);
}

/** Fetch total raised (sats). */
async function fetchTotalRaised(): Promise<bigint> {
    const bytes = await contractCall(SEL_TOTAL_RAISED);
    if (!bytes || bytes.length < 32) return 0n;
    return readU256(bytes);
}

/**
 * Batch-fetch messages using getMessages(offset, limit).
 * Returns up to 50 most-recent messages, newest first.
 */
async function fetchAllMessages(total: bigint): Promise<WallMessage[]> {
    if (total === 0n) return [];

    const PAGE = 50n;
    const offset = total > PAGE ? total - PAGE : 0n;
    const limit  = total > PAGE ? PAGE       : total;

    // getMessages(uint256 offset, uint256 limit)
    const calldata = SEL_MESSAGES + u256Hex(offset) + u256Hex(limit);
    const bytes = await contractCall(calldata);

    // Response layout: u32 count (4 bytes) + N × 128 bytes
    if (!bytes || bytes.length < 4) return [];

    const view = new DataView(bytes.buffer);
    const count = view.getUint32(0, false); // big-endian
    const messages: WallMessage[] = [];

    for (let i = 0; i < count; i++) {
        const base = 4 + i * 128;
        if (base + 128 > bytes.length) break;

        const sender      = bytesToHex(bytes.slice(base, base + 32));
        const blockNumber = readU256(bytes, base + 32);
        const chunk1      = readU256(bytes, base + 64);
        const chunk2      = readU256(bytes, base + 96);
        const text        = decodeMessage(chunk1, chunk2);
        const index       = Number(offset) + i;

        messages.push({ index, sender, blockNumber, text });
    }

    // Newest first
    return messages.reverse();
}

export function useWall(): {
    readonly messages: readonly WallMessage[];
    readonly stats: WallStats;
    readonly loading: boolean;
    readonly refreshing: boolean;
    readonly refresh: () => void;
} {
    const [messages, setMessages]   = useState<readonly WallMessage[]>([]);
    const [stats, setStats]         = useState<WallStats>({ messageCount: 0n, totalRaised: 0n });
    const [loading, setLoading]     = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const lastCountRef  = useRef<bigint | null>(null);
    const fetchingRef   = useRef(false);

    /** Full fetch: count + messages + totalRaised in parallel. */
    const doFullFetch = useCallback(async (isRefresh: boolean): Promise<void> => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        if (isRefresh) setRefreshing(true);

        try {
            // Count first (needed for message pagination)
            const total = await fetchCount();
            if (total === null) return; // keep stale data on network error

            lastCountRef.current = total;

            // Fetch messages + totalRaised concurrently
            const [msgs, raised] = await Promise.all([
                fetchAllMessages(total),
                fetchTotalRaised(),
            ]);

            setStats({ messageCount: total, totalRaised: raised });
            setMessages(msgs);
        } catch (err) {
            console.error('[useWall] fetch error:', err);
        } finally {
            fetchingRef.current = false;
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    /** Light poll: just check the count; full fetch only when it changes. */
    const pollCount = useCallback(async (): Promise<void> => {
        try {
            const total = await fetchCount();
            if (total === null) return;

            if (lastCountRef.current === null || total !== lastCountRef.current) {
                await doFullFetch(true);
            } else {
                // Count unchanged — still refresh totalRaised silently
                const raised = await fetchTotalRaised();
                setStats((prev) => ({ ...prev, totalRaised: raised }));
            }
        } catch {
            // ignore
        }
    }, [doFullFetch]);

    useEffect(() => { void doFullFetch(false); }, [doFullFetch]);

    useEffect(() => {
        const id = setInterval(() => void pollCount(), 5_000);
        return () => clearInterval(id);
    }, [pollCount]);

    const refresh = useCallback((): void => { void doFullFetch(true); }, [doFullFetch]);

    return { messages, stats, loading, refreshing, refresh };
}
