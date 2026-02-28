import { useEffect, useRef } from 'react';
import type { WallMessage } from '../../types/index';
import { shortenAddress } from '../../utils/encoding';

interface LiveFeedProps {
    readonly messages: readonly WallMessage[];
}

const ACCENT_DOTS = ['#F7931A', '#8B5CF6', '#3B82F6', '#10B981', '#EC4899', '#EAB308', '#06B6D4'];

function getDot(sender: string): string {
    const idx = parseInt(sender.slice(-2), 16) % ACCENT_DOTS.length;
    return ACCENT_DOTS[idx] ?? ACCENT_DOTS[0]!;
}

export function LiveFeed({ messages }: LiveFeedProps): JSX.Element {
    const trackRef = useRef<HTMLDivElement>(null);

    // We duplicate the items so the scroll loops seamlessly
    const confirmed = messages.filter((m) => !m.pending).slice(0, 20);

    // Need at least 2 items to scroll meaningfully
    const items = confirmed.length > 0 ? [...confirmed, ...confirmed] : [];

    useEffect(() => {
        const track = trackRef.current;
        if (!track || items.length === 0) return;

        let frame: number;
        let pos = 0;
        const speed = 0.4; // px per frame

        function step(): void {
            pos += speed;
            const half = track!.scrollWidth / 2;
            if (pos >= half) pos -= half;
            track!.style.transform = `translateX(-${pos}px)`;
            frame = requestAnimationFrame(step);
        }

        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, [items.length]);

    if (confirmed.length === 0) return <></>;

    return (
        <div className="mb-8">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                    style={{ boxShadow: '0 0 6px rgba(52,211,153,0.9)' }}
                />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                    Live Feed
                </span>
            </div>

            {/* Ticker strip */}
            <div
                className="relative overflow-hidden rounded-xl"
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    // Fade edges
                    maskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
                }}
            >
                <div
                    ref={trackRef}
                    className="flex items-center gap-0 py-3 will-change-transform"
                    style={{ width: 'max-content' }}
                >
                    {items.map((msg, i) => {
                        const dot = getDot(msg.sender);
                        return (
                            <div
                                key={`${msg.index}-${i}`}
                                className="flex items-center gap-2.5 px-5 flex-shrink-0"
                                style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
                            >
                                <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ background: dot, boxShadow: `0 0 4px ${dot}aa` }}
                                />
                                <span
                                    className="text-xs font-mono"
                                    style={{ color: dot + 'bb' }}
                                >
                                    {shortenAddress(msg.sender)}
                                </span>
                                <span className="text-white/60 text-xs font-mono">
                                    &ldquo;{msg.text}&rdquo;
                                </span>
                                <span
                                    className="text-[10px] px-1.5 py-0.5 rounded-full ml-1"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'rgba(255,255,255,0.25)',
                                    }}
                                >
                                    #{msg.blockNumber.toString()}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
