import { useState, useEffect, useCallback, useRef } from 'react';
import type { WallMessage, WallStats } from '../types/index';
import { decodeMessage } from '../utils/encoding';
import { RPC_URL, CONTRACT_ADDRESS } from '../config/networks';

const RPC_ENDPOINT = `${RPC_URL}/api/v1/json-rpc`;

const SEL_COUNT        = '91d46a36'; // getMessageCount()
const SEL_MESSAGES     = '77983818'; // getMessages(uint256,uint256)
const SEL_TOTAL_RAISED = '99e14bc8'; // getTotalRaised()

async function contractCall(calldata: string): Promise<Uint8Array | null> {
    try {
        const resp = await fetch(RPC_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'btc_call',
                params: [CONTRACT_ADDRESS, calldata, null, null, null, null, null],
            }),
        });

        if (!resp.ok) return null;

        const json = await resp.json() as {
            result?: { result?: string; revert?: string };
        };

        if (!json.result?.result || json.result.revert) return null;

        return Uint8Array.from(atob(json.result.result), (c) => c.charCodeAt(0));
    } catch {
        return null;
    }
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
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function fetchCount(): Promise<bigint | null> {
    const bytes = await contractCall(SEL_COUNT);
    if (!bytes || bytes.length < 32) return null;
    return readU256(bytes);
}

async function fetchTotalRaised(): Promise<bigint> {
    const bytes = await contractCall(SEL_TOTAL_RAISED);
    if (!bytes || bytes.length < 32) return 0n;
    return readU256(bytes);
}

async function fetchAllMessages(total: bigint): Promise<WallMessage[]> {
    if (total === 0n) return [];

    const PAGE = 50n;
    const offset = total > PAGE ? total - PAGE : 0n;
    const limit  = total > PAGE ? PAGE : total;

    const bytes = await contractCall(SEL_MESSAGES + u256Hex(offset) + u256Hex(limit));
    if (!bytes || bytes.length < 4) return [];

    const view = new DataView(bytes.buffer);
    const count = view.getUint32(0, false);
    const messages: WallMessage[] = [];

    for (let i = 0; i < count; i++) {
        const base = 4 + i * 128;
        if (base + 128 > bytes.length) break;

        messages.push({
            index:       Number(offset) + i,
            sender:      bytesToHex(bytes.slice(base, base + 32)),
            blockNumber: readU256(bytes, base + 32),
            text:        decodeMessage(readU256(bytes, base + 64), readU256(bytes, base + 96)),
        });
    }

    return messages.reverse();
}

export function useWall(): {
    readonly messages: readonly WallMessage[];
    readonly stats: WallStats;
    readonly loading: boolean;
    readonly refreshing: boolean;
    readonly refresh: () => void;
} {
    const [messages, setMessages]     = useState<readonly WallMessage[]>([]);
    const [stats, setStats]           = useState<WallStats>({ messageCount: 0n, totalRaised: 0n });
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const lastCountRef  = useRef<bigint | null>(null);
    const fetchingRef   = useRef(false);
    // True once we've had at least one successful message fetch (even if count=0).
    // Used to force a re-fetch in pollCount if messages are empty despite count > 0,
    // which can happen when the initial fetch had a transient error.
    const msgsLoadedRef = useRef(false);

    const doFullFetch = useCallback(async (isRefresh: boolean): Promise<void> => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        if (isRefresh) setRefreshing(true);

        try {
            const total = await fetchCount();
            if (total === null) return;

            lastCountRef.current = total;

            const [msgs, raised] = await Promise.all([
                fetchAllMessages(total),
                fetchTotalRaised(),
            ]);

            setStats({ messageCount: total, totalRaised: raised });
            setMessages(msgs);
            // Mark messages as successfully loaded (even if the array is empty,
            // that just means count === 0n which is valid).
            msgsLoadedRef.current = true;
        } finally {
            fetchingRef.current = false;
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const pollCount = useCallback(async (): Promise<void> => {
        const total = await fetchCount();
        if (total === null) return;

        // Re-fetch if: count changed, first run, or messages never loaded successfully
        // (e.g. initial fetch had a transient error but count > 0).
        const needsRefresh =
            lastCountRef.current === null ||
            total !== lastCountRef.current ||
            (!msgsLoadedRef.current && total > 0n);

        if (needsRefresh) {
            await doFullFetch(true);
        } else {
            const raised = await fetchTotalRaised();
            setStats((prev) => ({ ...prev, totalRaised: raised }));
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
