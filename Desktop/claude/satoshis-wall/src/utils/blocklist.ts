/**
 * Frontend content blocklist.
 * Addresses added here have their messages hidden in the UI.
 * This does NOT remove content from the blockchain — it only affects display.
 * Add sender hex addresses (32-byte, lowercase) to block abusive content.
 */
const BLOCKED_SENDERS = new Set<string>([
    // Example (remove and add real addresses as needed):
    // '0000000000000000000000000000000000000000000000000000000000000000',
]);

export function isBlocked(senderHex: string): boolean {
    return BLOCKED_SENDERS.has(senderHex.toLowerCase());
}
