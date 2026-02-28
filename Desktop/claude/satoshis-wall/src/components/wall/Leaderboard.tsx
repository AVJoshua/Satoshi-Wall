import type { WallMessage } from '../../types/index';
import { shortenAddress } from '../../utils/encoding';

interface LeaderboardProps {
    readonly messages: readonly WallMessage[];
    readonly loading: boolean;
}

const MEDALS = ['🥇', '🥈', '🥉'];

const ACCENTS = [
    '#F7931A', '#8B5CF6', '#3B82F6', '#10B981',
    '#EC4899', '#EAB308', '#06B6D4',
];

function getAccentColor(address: string): string {
    const idx = parseInt(address.slice(-2), 16) % ACCENTS.length;
    return ACCENTS[idx] ?? ACCENTS[0]!;
}

export function Leaderboard({ messages, loading }: LeaderboardProps): JSX.Element {
    // Sort confirmed messages by block number ascending (earliest first)
    const ranked = [...messages]
        .filter((m) => !m.pending)
        .sort((a, b) => (a.blockNumber < b.blockNumber ? -1 : a.blockNumber > b.blockNumber ? 1 : 0))
        .slice(0, 10);

    return (
        <div className="mb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest">
                    Hall of Fame
                    <span className="ml-2 font-normal text-white/25 normal-case tracking-normal">
                        earliest inscribers
                    </span>
                </h2>
                <div className="text-xs text-white/25">By block number</div>
            </div>

            <div
                className="rounded-2xl overflow-hidden"
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                }}
            >
                {loading ? (
                    <div className="divide-y divide-white/5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                                <div className="w-7 h-4 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
                                <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 w-32 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
                                    <div className="h-2.5 w-48 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
                                </div>
                                <div className="h-3 w-16 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
                            </div>
                        ))}
                    </div>
                ) : ranked.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-3xl mb-3 opacity-30" aria-hidden="true">🏆</div>
                        <p className="text-white/30 text-sm">No inscriptions yet — be the first!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {ranked.map((msg, rank) => {
                            const color = getAccentColor(msg.sender);
                            return (
                                <div
                                    key={msg.index}
                                    className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-200 hover:bg-white/[0.02]"
                                >
                                    {/* Rank */}
                                    <div className="w-7 text-center flex-shrink-0">
                                        {rank < 3 ? (
                                            <span className="text-lg leading-none">{MEDALS[rank]}</span>
                                        ) : (
                                            <span className="text-xs font-bold text-white/30">#{rank + 1}</span>
                                        )}
                                    </div>

                                    {/* Avatar dot */}
                                    <div
                                        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-black"
                                        style={{
                                            background: color,
                                            boxShadow: `0 0 12px ${color}55`,
                                        }}
                                    >
                                        {msg.sender.slice(2, 4).toUpperCase()}
                                    </div>

                                    {/* Address + message */}
                                    <div className="flex-1 min-w-0">
                                        <a
                                            href={`https://testnet.opnet.org/address/${msg.sender}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-mono hover:text-white/70 transition-colors"
                                            style={{ color: color + 'cc' }}
                                            title={msg.sender}
                                        >
                                            {shortenAddress(msg.sender)}
                                        </a>
                                        <p className="text-white/55 text-sm truncate mt-0.5 font-mono">
                                            &ldquo;{msg.text}&rdquo;
                                        </p>
                                    </div>

                                    {/* Block badge */}
                                    <div className="flex-shrink-0 text-right">
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full"
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                color: 'rgba(255,255,255,0.3)',
                                            }}
                                        >
                                            Block {msg.blockNumber.toString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
