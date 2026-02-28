import { useState } from 'react';
import { getContract, JSONRpcProvider } from 'opnet';
import type { WalletState } from '../../types/index';
import { encodeMessage } from '../../utils/encoding';
import { RPC_URL, CONTRACT_ADDRESS, ACTIVE_NETWORK, TREASURY_ADDRESS, MIN_POST_SATS } from '../../config/networks';
import type { ISatoshisWall } from '../../abi/SatoshisWall';
import { SatoshisWallABI } from '../../abi/SatoshisWall';

interface PostFormProps {
    readonly wallet: WalletState;
    readonly onPosted: (text: string) => void;
    readonly justPosted: boolean;
}

const MAX_CHARS = 64;

export function PostForm({ wallet, onPosted, justPosted }: PostFormProps): JSX.Element {
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
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
            await sim.sendTransaction({
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

            const postedText = message;
            setMessage('');
            onPosted(postedText);
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : 'Transaction failed. Please try again.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    }

    /* ── Success state ── */
    if (justPosted) {
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
                    Your mark is on Bitcoin history!
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                    Your message is now permanently recorded on Bitcoin Layer 1.
                    <br />
                    It will exist as long as Bitcoin exists.
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
                                disabled={submitting}
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
                                disabled={!isValid || submitting}
                                className="btn-primary whitespace-nowrap"
                            >
                                {submitting ? (
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
