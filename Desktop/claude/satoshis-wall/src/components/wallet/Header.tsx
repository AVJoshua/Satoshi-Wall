import type { WalletState } from '../../types/index';
import { shortenAddress } from '../../utils/encoding';

interface HeaderProps {
    readonly wallet: WalletState;
    readonly connecting: boolean;
    readonly connectError: string;
    readonly onConnect: () => void;
    readonly onDisconnect: () => void;
}

export function Header({
    wallet,
    connecting,
    connectError,
    onConnect,
    onDisconnect,
}: HeaderProps): JSX.Element {
    return (
        <header
            className="sticky top-0 z-50 relative"
            style={{
                background: 'rgba(6, 6, 12, 0.7)',
                backdropFilter: 'blur(32px) saturate(180%)',
                WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
        >
            {/* Orange hairline at top */}
            <div
                className="absolute inset-x-0 top-0 h-px pointer-events-none"
                style={{
                    background:
                        'linear-gradient(90deg, transparent 0%, rgba(247,147,26,0.5) 30%, rgba(249,160,48,0.75) 50%, rgba(247,147,26,0.5) 70%, transparent 100%)',
                }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

                {/* ── Logo ── */}
                <div className="flex items-center gap-3">

                    {/* Brick-wall SVG icon */}
                    <div
                        style={{
                            filter: 'drop-shadow(0 0 10px rgba(247,147,26,0.55)) drop-shadow(0 0 24px rgba(247,147,26,0.2))',
                        }}
                    >
                        <svg
                            width="38"
                            height="32"
                            viewBox="0 0 40 34"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            <defs>
                                <linearGradient id="brickGrad" x1="0" y1="0" x2="40" y2="34" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#fbb040" />
                                    <stop offset="60%" stopColor="#F7931A" />
                                    <stop offset="100%" stopColor="#c97010" />
                                </linearGradient>
                            </defs>
                            {/* Row 1 — two full bricks */}
                            <rect x="0"  y="0"  width="17" height="9" rx="2" fill="url(#brickGrad)" />
                            <rect x="23" y="0"  width="17" height="9" rx="2" fill="url(#brickGrad)" />
                            {/* Row 2 — offset: half · full · half */}
                            <rect x="0"  y="13" width="8"  height="9" rx="2" fill="url(#brickGrad)" opacity="0.82" />
                            <rect x="12" y="13" width="16" height="9" rx="2" fill="url(#brickGrad)" opacity="0.88" />
                            <rect x="32" y="13" width="8"  height="9" rx="2" fill="url(#brickGrad)" opacity="0.82" />
                            {/* Row 3 — same as row 1, dimmer */}
                            <rect x="0"  y="26" width="17" height="9" rx="2" fill="url(#brickGrad)" opacity="0.55" />
                            <rect x="23" y="26" width="17" height="9" rx="2" fill="url(#brickGrad)" opacity="0.55" />
                        </svg>
                    </div>

                    {/* Wordmark */}
                    <div className="flex flex-col leading-none select-none">
                        <span
                            className="text-[9px] font-semibold uppercase tracking-[0.22em] mb-0.5"
                            style={{ color: 'rgba(255,255,255,0.38)' }}
                        >
                            Satoshi&apos;s
                        </span>
                        <span
                            className="text-[1.15rem] font-black tracking-tight leading-none"
                            style={{
                                background: 'linear-gradient(135deg, #fbb040 0%, #F7931A 55%, #d97e0e 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            WALL
                        </span>
                    </div>

                    {/* Network tag */}
                    <span
                        className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
                        style={{
                            background: 'rgba(247,147,26,0.08)',
                            border: '1px solid rgba(247,147,26,0.22)',
                            color: 'rgba(247,147,26,0.7)',
                        }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: '#F7931A', boxShadow: '0 0 5px rgba(247,147,26,0.9)' }}
                        />
                        Bitcoin L1
                    </span>
                </div>

                {/* ── Wallet ── */}
                <div className="flex flex-col items-end gap-1">
                    {wallet.connected ? (
                        <button
                            onClick={onDisconnect}
                            className="btn-secondary text-sm flex items-center gap-2"
                            type="button"
                        >
                            <span
                                className="inline-block w-2 h-2 rounded-full bg-emerald-400"
                                style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }}
                            />
                            {shortenAddress(wallet.address)}
                        </button>
                    ) : (
                        <button
                            onClick={onConnect}
                            disabled={connecting}
                            className="btn-primary"
                            type="button"
                        >
                            {connecting ? 'Connecting…' : 'Connect OPWallet'}
                        </button>
                    )}
                    {connectError && (
                        <p className="text-red-400 text-xs max-w-xs text-right leading-tight">
                            {connectError}
                        </p>
                    )}
                </div>
            </div>
        </header>
    );
}
