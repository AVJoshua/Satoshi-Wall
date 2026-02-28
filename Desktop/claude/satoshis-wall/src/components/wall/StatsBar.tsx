interface StatsBarProps {
    readonly messageCount: bigint;
    readonly totalRaised: bigint;
    readonly refreshing: boolean;
    readonly onRefresh: () => void;
}

function formatSats(sats: bigint): string {
    if (sats === 0n) return '0 sats';
    if (sats >= 100_000_000n) {
        const btc = Number(sats) / 1e8;
        return `${btc.toFixed(4)} BTC`;
    }
    return `${sats.toLocaleString()} sats`;
}

export function StatsBar({ messageCount, totalRaised, refreshing, onRefresh }: StatsBarProps): JSX.Element {
    const remaining = 10000n - messageCount;
    const pct = Math.min(100, Number(messageCount) / 100);

    return (
        <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-5 rounded-2xl"
            style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(24px) saturate(160%)',
                WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.25)',
            }}
        >
            {/* Stats */}
            <div className="flex flex-wrap gap-6 sm:gap-8">
                <div>
                    <div className="text-xs text-white/40 mb-1 uppercase tracking-widest">Messages</div>
                    <div
                        className="text-2xl font-bold"
                        style={{ color: '#F7931A', textShadow: '0 0 20px rgba(247,147,26,0.4)' }}
                    >
                        {messageCount.toString()}
                    </div>
                </div>

                <div
                    className="pl-6 sm:pl-8"
                    style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}
                >
                    <div className="text-xs text-white/40 mb-1 uppercase tracking-widest">Remaining</div>
                    <div className="text-2xl font-bold text-white">
                        {remaining < 0n ? '0' : remaining.toString()}
                    </div>
                </div>

                <div
                    className="pl-6 sm:pl-8"
                    style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}
                >
                    <div className="text-xs text-white/40 mb-1 uppercase tracking-widest">Total Raised</div>
                    <div
                        className="text-2xl font-bold"
                        style={{ color: '#F7931A', textShadow: '0 0 20px rgba(247,147,26,0.3)' }}
                    >
                        {formatSats(totalRaised)}
                    </div>
                </div>

                <div
                    className="pl-6 sm:pl-8 hidden sm:block"
                    style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}
                >
                    <div className="text-xs text-white/40 mb-1 uppercase tracking-widest">Capacity</div>
                    <div className="text-2xl font-bold text-white/40">10,000</div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full sm:w-44">
                <div className="flex justify-between text-xs text-white/35 mb-2">
                    <span>Wall filled</span>
                    <span>{pct > 0 ? pct.toFixed(1) + '%' : '0%'}</span>
                </div>
                <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, #F7931A, #f9a030)',
                            boxShadow: '0 0 8px rgba(247,147,26,0.6)',
                        }}
                    />
                </div>
            </div>

            {/* Refresh */}
            <button
                onClick={onRefresh}
                disabled={refreshing}
                className="btn-secondary text-xs px-3 py-2 flex items-center gap-2"
                type="button"
            >
                <span className={refreshing ? 'animate-spin inline-block' : 'inline-block'} aria-hidden="true">
                    ↻
                </span>
                {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
        </div>
    );
}
