import type { WallMessage } from '../../types/index';
import { MessageTile } from './MessageTile';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

interface WallGridProps {
    readonly messages: readonly WallMessage[];
    readonly loading: boolean;
}

export function WallGrid({ messages, loading }: WallGridProps): JSX.Element {
    if (loading) {
        return (
            <div>
                <SectionHeader count={null} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <LoadingSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div>
                <SectionHeader count={0} />
                <div
                    className="text-center py-20 rounded-2xl"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px dashed rgba(255,255,255,0.08)',
                    }}
                >
                    <div className="text-5xl mb-4 opacity-40" aria-hidden="true">🧱</div>
                    <h3 className="text-lg font-semibold text-white/50 mb-2">The wall is empty</h3>
                    <p className="text-white/25 text-sm">
                        Be the first to leave your mark on Bitcoin history.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <SectionHeader count={messages.length} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {messages.map((msg, i) => (
                    <MessageTile key={msg.pending ? `pending-${i}` : msg.index} message={msg} />
                ))}
            </div>
        </div>
    );
}

function SectionHeader({ count }: { readonly count: number | null }): JSX.Element {
    return (
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest">
                The Wall
                {count !== null && count > 0 && (
                    <span className="ml-2 font-normal text-white/25 normal-case tracking-normal">
                        ({count} shown)
                    </span>
                )}
            </h2>
            <div className="text-xs text-white/25">Newest first</div>
        </div>
    );
}
