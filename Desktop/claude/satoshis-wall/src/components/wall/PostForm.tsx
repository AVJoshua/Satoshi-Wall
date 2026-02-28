import { useState } from 'react';
import { getContract, JSONRpcProvider } from 'opnet';
import type { WalletState } from '../../types/index';
import { encodeMessage } from '../../utils/encoding';
import { checkHasPosted } from '../../utils/contract';
import { RPC_URL, CONTRACT_ADDRESS, ACTIVE_NETWORK, TREASURY_ADDRESS, MIN_POST_SATS } from '../../config/networks';
import type { ISatoshisWall } from '../../abi/SatoshisWall';
import { SatoshisWallABI } from '../../abi/SatoshisWall';

const RPC_ENDPOINT = `${RPC_URL}/api/v1/json-rpc`;

async function waitForReceipt(txId: string, timeoutMs = 180_000): Promise<'confirmed' | 'reverted' | 'timeout'> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 4000));
        try {
            const resp = await fetch(RPC_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'btc_getTransactionReceipt', params: [txId] }),
            });
            const json = await resp.json() as { result?: { revert?: string; receipt?: string } };
            if (!json.result) continue;
            if (json.result.revert) return 'reverted';
            if (json.result.receipt) return 'confirmed';
        } catch { /* ignore, keep polling */ }
    }
    return 'timeout';
}

interface PostFormProps {
    readonly wallet: WalletState;
    readonly onPosted: (text: string) => void;
    readonly justPosted: boolean;
    /** True if this wallet has already posted (checked on wallet connect). */
    readonly alreadyPosted: boolean;
}

const MAX_CHARS = 64;

export function PostForm({ wallet, onPosted, justPosted, alreadyPosted }: PostFormProps): JSX.Element {
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState('');

    const charCount = message.length;
    const isValid = charCount > 0 && charCount <= MAX_CHARS;
    const nearLimit = charCount > MAX_CHARS * 0.8;

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        if (!isValid || !wallet.connected) return;

        setSubmitting(true);
        setError('');

        try {
            // Pre-check: use native fetch to verify this wallet hasn't already posted.
            // OPNet simulation always uses zero address for Blockchain.tx.origin, so
            // hasPosted(zero) = false and simulation always passes — we must check the
            // real wallet address here before simulation.
            const posted = await checkHasPosted(wallet.address);
            if (posted === true) {
                setError("This wallet has already posted a message. One post per wallet is allowed on Satoshi's Wall.");
                return;
            }

            const provider = new JSONRpcProvider(RPC_URL, ACTIVE_NETWORK);
            const contract = getContract<ISatoshisWall>(
                CONTRACT_ADDRESS,
                SatoshisWallABI,
                provider,
                ACTIVE_NETWORK,
            );

            const [chunk1, chunk2] = encodeMessage(message);

            // Tell the simulator about the treasury output so the contract
            // can verify it during simulation (flags: 1 = hasTo)
            contract.setTransactionDetails({
                inputs: [],
                outputs: [{
                    value: BigInt(MIN_POST_SATS),
                    index: 1,
                    flags: 1,
                    to: TREASURY_ADDRESS,
                }],
            });

            const sim = await contract.postMessage(chunk1, chunk2);
            if (!sim.properties.success) {
                setError('Simulation failed. You may have already posted a message.');
                return;
            }

            // Include the treasury payment output in the actual Bitcoin transaction
            const receipt = await sim.sendTransaction({
                signer: null,
                mldsaSigner: null,
                refundTo: wallet.address,
                maximumAllowedSatToSpend: 20000n,
                network: ACTIVE_NETWORK,
                extraOutputs: [{
                    address: TREASURY_ADDRESS,
                    value: MIN_POST_SATS,
                }],
            });

            setSubmitting(false);
            setConfirming(true);

            const status = await waitForReceipt(receipt.transactionId);

            if (status === 'reverted') {
                setError(
                    'Transaction was reverted by the contract. This wallet may have already posted, or the payment was not included correctly.',
                );
                return;
            }
            if (status === 'timeout') {
                // Tx may still confirm later — optimistically treat as success
                // The pending message will disappear on its own if it never confirms
            }

            const postedText = message;
            setMessage('');
            onPosted(postedText);
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : 'Transaction failed. Please try again.';
            setError(msg);
        } finally {
            setSubmitting(false);
            setConfirming(false);
        }
    }

    /* ── Already posted (permanent) or just posted (5 s) ── */
    if (justPosted || alreadyPosted) {
        return (
            <div
                className="mb-8 p-8 rounded-2xl text-center animate-slide-up"
                style={{
                    background: 'rgba(247,147,26,0.07)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(247,147,26,0.25)',
                    boxShadow: '0 0 60px rgba(247,147,26,0.08), inset 0 1px 0 rgba(247,147,26,0.15)',
                }}
            >
                <div className="text-5xl mb-4" aria-hidden="true">₿</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#F7931A' }}>
                    {justPosted ? 'Your mark is on Bitcoin history!' : 'Already inscribed on Bitcoin!'}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                    {justPosted ? (
                        <>
                            Your message is now permanently recorded on Bitcoin Layer 1.
                            <br />
                            It will exist as long as Bitcoin exists.
                        </>
                    ) : (
                        <>
                            This wallet has already carved its message into Bitcoin L1.
                            <br />
                            <span className="text-white/35 text-xs mt-2 block">
                                One message per wallet — connect a different wallet to inscribe again.
                            </span>
                        </>
                    )}
                </p>
            </div>
        );
    }

    return (
        <div
            className="mb-8 rounded-2xl overflow-hidden animate-fade-in"
            style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(24px) saturate(160%)',
                WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 32px rgba(0,0,0,0.3)',
            }}
        >
            {/* Orange accent line at top */}
            <div
                className="h-px"
                style={{
                    background:
                        'linear-gradient(90deg, transparent, rgba(247,147,26,0.5), transparent)',
                }}
            />

            <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                        style={{
                            background: 'rgba(247,147,26,0.12)',
                            border: '1px solid rgba(247,147,26,0.22)',
                            color: '#F7931A',
                        }}
                    >
                        ✍
                    </div>
                    <div>
                        <h2 className="text-white font-semibold text-sm">Leave Your Mark</h2>
                        <p className="text-white/35 text-xs mt-0.5">
                            One message per wallet · 1,000 sats · Permanent on Bitcoin L1
                        </p>
                    </div>
                </div>

                {!wallet.connected ? (
                    <div
                        className="text-center py-8 rounded-xl"
                        style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px dashed rgba(255,255,255,0.1)',
                        }}
                    >
                        <p className="text-white/40 text-sm mb-1">
                            Connect your OPWallet to leave a message
                        </p>
                        <p className="text-white/20 text-xs">
                            Your message will be stored permanently on Bitcoin L1
                        </p>
                    </div>
                ) : (
                    <form onSubmit={(e) => { void handleSubmit(e); }}>
                        <div className="relative mb-4">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="What do you want Bitcoin history to remember? (max 64 chars)"
                                maxLength={MAX_CHARS}
                                rows={3}
                                className="input-field resize-none"
                                disabled={submitting || confirming}
                            />
                            <div
                                className={`absolute bottom-3 right-3 text-xs font-mono transition-colors duration-200 ${
                                    nearLimit ? '' : 'text-white/25'
                                }`}
                                style={nearLimit ? { color: '#F7931A' } : {}}
                            >
                                {charCount}/{MAX_CHARS}
                            </div>
                        </div>

                        {error && (
                            <div
                                className="mb-4 px-4 py-3 rounded-xl text-red-300 text-sm"
                                style={{
                                    background: 'rgba(239,68,68,0.08)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-4">
                            <p className="text-white/25 text-xs">
                                OPWallet · 1,000 sats + network fee · No token needed
                            </p>
                            <button
                                type="submit"
                                disabled={!isValid || submitting || confirming}
                                className="btn-primary whitespace-nowrap"
                            >
                                {confirming ? (
                                    <span className="flex items-center gap-2">
                                        <span
                                            className="w-3 h-3 rounded-full border border-black/30 border-t-black animate-spin"
                                        />
                                        Confirming…
                                    </span>
                                ) : submitting ? (
                                    <span className="flex items-center gap-2">
                                        <span
                                            className="w-3 h-3 rounded-full border border-black/30 border-t-black animate-spin"
                                        />
                                        Posting…
                                    </span>
                                ) : (
                                    'Carve Into Bitcoin ₿'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
