import type { WallMessage } from '../../types/index';
import { shortenAddress } from '../../utils/encoding';

interface MessageTileProps {
    readonly message: WallMessage;
}

/* Deterministic accent colour from sender address */
const ACCENTS = [
    { border: 'rgba(247,147,26,0.25)',  glow: 'rgba(247,147,26,0.12)',  dot: '#F7931A'  },
    { border: 'rgba(139,92,246,0.25)',  glow: 'rgba(139,92,246,0.12)',  dot: '#8B5CF6'  },
    { border: 'rgba(59,130,246,0.25)',  glow: 'rgba(59,130,246,0.12)',  dot: '#3B82F6'  },
    { border: 'rgba(16,185,129,0.25)',  glow: 'rgba(16,185,129,0.12)',  dot: '#10B981'  },
    { border: 'rgba(236,72,153,0.25)',  glow: 'rgba(236,72,153,0.12)',  dot: '#EC4899'  },
    { border: 'rgba(234,179,8,0.25)',   glow: 'rgba(234,179,8,0.12)',   dot: '#EAB308'  },
    { border: 'rgba(6,182,212,0.25)',   glow: 'rgba(6,182,212,0.12)',   dot: '#06B6D4'  },
];

function getAccent(address: string) {
    const idx = parseInt(address.slice(-2), 16) % ACCENTS.length;
    return ACCENTS[idx] ?? ACCENTS[0]!;
}

export function MessageTile({ message }: MessageTileProps): JSX.Element {
    const accent = getAccent(message.sender);

    return (
        <div
            className="message-tile group"
            style={{
                border: `1px solid ${accent.border}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.25)`,
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = accent.border.replace(
                    /[\d.]+\)$/,
                    '0.5)',
                );
                (e.currentTarget as HTMLDivElement).style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.08), 0 16px 48px rgba(0,0,0,0.4), 0 0 40px ${accent.glow}`;
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = accent.border;
                (e.currentTarget as HTMLDivElement).style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.25)`;
            }}
        >
            {/* Top row */}
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                    <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${message.pending ? 'animate-pulse' : ''}`}
                        style={{
                            background: accent.dot,
                            boxShadow: `0 0 6px ${accent.dot}99`,
                        }}
                    />
                    {message.pending ? (
                        <span className="text-white/30 text-xs">your message</span>
                    ) : (
                        <span className="text-white/30 text-xs">#{message.index + 1}</span>
                    )}
                </div>
                {message.pending ? (
                    <span
                        className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1.5"
                        style={{
                            background: 'rgba(247,147,26,0.1)',
                            border: '1px solid rgba(247,147,26,0.3)',
                            color: 'rgba(247,147,26,0.8)',
                        }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F7931A] animate-pulse inline-block" />
                        Pending
                    </span>
                ) : (
                    <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.3)',
                        }}
                    >
                        Block {message.blockNumber.toString()}
                    </span>
                )}
            </div>

            {/* Message text */}
            <p className="text-white/85 text-sm leading-relaxed break-words min-h-[3rem] mb-4 font-mono">
                &ldquo;{message.text}&rdquo;
            </p>

            {/* Sender */}
            <div
                className="flex items-center gap-2 pt-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
                <span
                    className="w-4 h-4 rounded-full flex-shrink-0 opacity-70"
                    style={{ background: accent.dot }}
                />
                {message.pending ? (
                    <span className="address-badge truncate opacity-60" title={message.sender}>
                        {shortenAddress(message.sender)}
                    </span>
                ) : (
                    <a
                        href={`https://testnet.opnet.org/address/${message.sender}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="address-badge hover:text-white/70 transition-colors duration-200 truncate"
                        title={message.sender}
                    >
                        {shortenAddress(message.sender)}
                    </a>
                )}
            </div>
        </div>
    );
}
