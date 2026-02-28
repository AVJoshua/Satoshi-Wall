/**
 * Encode a UTF-8 string (max 64 chars) into two BigInt chunks (32 bytes each).
 */
export function encodeMessage(text: string): readonly [bigint, bigint] {
    const clipped = text.slice(0, 64);
    const bytes = new TextEncoder().encode(clipped);
    const padded = new Uint8Array(64);
    padded.set(bytes);

    const chunk1 = bytesToBigInt(padded.slice(0, 32));
    const chunk2 = bytesToBigInt(padded.slice(32, 64));

    return [chunk1, chunk2] as const;
}

/**
 * Decode two BigInt chunks back into a UTF-8 string.
 */
export function decodeMessage(chunk1: bigint, chunk2: bigint): string {
    const bytes = new Uint8Array(64);
    const b1 = bigIntToBytes(chunk1, 32);
    const b2 = bigIntToBytes(chunk2, 32);
    bytes.set(b1, 0);
    bytes.set(b2, 32);

    // Trim null bytes
    let end = bytes.length;
    while (end > 0 && bytes[end - 1] === 0) end--;

    return new TextDecoder().decode(bytes.slice(0, end));
}

function bytesToBigInt(bytes: Uint8Array): bigint {
    let result = 0n;
    for (const byte of bytes) {
        result = (result << 8n) | BigInt(byte);
    }
    return result;
}

function bigIntToBytes(value: bigint, length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    let v = value;
    for (let i = length - 1; i >= 0; i--) {
        bytes[i] = Number(v & 0xffn);
        v >>= 8n;
    }
    return bytes;
}

/**
 * Shorten an address for display: bc1q...abc
 */
export function shortenAddress(addr: string): string {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}
