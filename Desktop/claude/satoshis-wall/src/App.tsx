import { useState, useEffect } from 'react';
import type { WallMessage } from './types/index';
import { Header } from './components/wallet/Header';
import { Hero } from './components/wall/Hero';
import { WallGrid } from './components/wall/WallGrid';
import { PostForm } from './components/wall/PostForm';
import { StatsBar } from './components/wall/StatsBar';
import { Leaderboard } from './components/wall/Leaderboard';
import { LiveFeed } from './components/wall/LiveFeed';
import { useWallet } from './hooks/useWallet';
import { useWall } from './hooks/useWall';
import { checkHasPosted } from './utils/contract';

export function App(): JSX.Element {
    const { wallet, connecting, connectError, connect, disconnect } = useWallet();
    const { messages, stats, loading, refreshing, refresh } = useWall();
    const [justPosted, setJustPosted] = useState(false);
    const [walletHasPosted, setWalletHasPosted] = useState(false);
    const [pendingMsg, setPendingMsg] = useState<WallMessage | null>(null);
    const [baselineCount, setBaselineCount] = useState<bigint | null>(null);

    // When wallet connects, immediately check on-chain whether it has already posted.
    // This gives a permanent "already posted" state so the user never wastes a tx.
    useEffect(() => {
        if (!wallet.connected || !wallet.address) {
            setWalletHasPosted(false);
            return;
        }
        void checkHasPosted(wallet.address).then((result) => {
            if (result === true) setWalletHasPosted(true);
        });
    }, [wallet.connected, wallet.address]);

    // When the on-chain count grows past the baseline, the reveal tx confirmed — clear pending
    useEffect(() => {
        if (pendingMsg && baselineCount !== null && stats.messageCount > baselineCount) {
            setPendingMsg(null);
            setBaselineCount(null);
        }
    }, [stats.messageCount, pendingMsg, baselineCount]);

    // Safety net: clear stale pending message after 2 minutes if count never increased
    useEffect(() => {
        if (!pendingMsg) return;
        const timer = setTimeout(() => {
            setPendingMsg(null);
            setBaselineCount(null);
        }, 120_000);
        return () => clearTimeout(timer);
    }, [pendingMsg]);

    function handlePosted(text: string): void {
        setJustPosted(true);
        setTimeout(() => setJustPosted(false), 5000);
        // Mark this wallet as permanently posted so the form stays hidden
        setWalletHasPosted(true);

        // Show the message instantly as "pending" while the reveal tx mines
        setPendingMsg({
            index: -1,
            sender: wallet.address,
            blockNumber: 0n,
            text,
            pending: true,
        });

        // Snapshot current count — clear pending once count exceeds this
        setBaselineCount(stats.messageCount);
    }

    // Pending message goes at the top; disappears once the confirmed version appears
    const displayMessages: readonly WallMessage[] =
        pendingMsg ? [pendingMsg, ...messages] : messages;

    return (
        <div className="min-h-screen bg-[#06060c] grid-pattern relative">

            {/* ── Ambient gradient blobs ── */}
            <div
                className="fixed inset-0 overflow-hidden pointer-events-none"
                aria-hidden="true"
            >
                <div
                    className="absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(124,58,237,0.13) 0%, transparent 70%)',
                    }}
                />
                <div
                    className="absolute -bottom-60 -right-40 w-[600px] h-[600px] rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(247,147,26,0.09) 0%, transparent 70%)',
                    }}
                />
                <div
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
                    }}
                />
            </div>

            <Header
                wallet={wallet}
                connecting={connecting}
                connectError={connectError}
                onConnect={connect}
                onDisconnect={disconnect}
            />

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                <Hero messageCount={stats.messageCount} />

                <StatsBar
                    messageCount={stats.messageCount}
                    totalRaised={stats.totalRaised}
                    refreshing={refreshing}
                    onRefresh={refresh}
                />

                {/* Post form — above the wall so call-to-action is immediately visible */}
                <LiveFeed messages={displayMessages} />

                <PostForm
                    wallet={wallet}
                    onPosted={handlePosted}
                    justPosted={justPosted}
                    alreadyPosted={walletHasPosted}
                />

                <Leaderboard messages={displayMessages} loading={loading} />

                {/* THE WALL — after Hall of Fame */}
                <WallGrid messages={displayMessages} loading={loading} />
            </main>

            <footer className="relative z-10 border-t border-white/5 py-8 text-center text-white/25 text-xs font-mono">
                <p>Built on Bitcoin L1 · Powered by OP_NET · Permanent Forever</p>
            </footer>
        </div>
    );
}
