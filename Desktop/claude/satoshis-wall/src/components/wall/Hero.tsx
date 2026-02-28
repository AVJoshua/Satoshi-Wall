interface HeroProps {
    readonly messageCount: bigint;
}

export function Hero({ messageCount }: HeroProps): JSX.Element {
    return (
        <section className="py-20 text-center animate-fade-in">

            {/* Floating Bitcoin symbol with glass rings */}
            <div className="inline-block mb-10 animate-float">
                <div className="relative flex items-center justify-center">
                    {/* Outermost pulse ring */}
                    <span
                        className="absolute w-36 h-36 rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(247,147,26,0.08) 0%, transparent 70%)',
                            animation: 'pulse-ring 3s ease-out infinite',
                        }}
                        aria-hidden="true"
                    />
                    {/* Outer glass ring */}
                    <span
                        className="absolute w-28 h-28 rounded-full"
                        style={{
                            background: 'rgba(247,147,26,0.05)',
                            border: '1px solid rgba(247,147,26,0.15)',
                        }}
                        aria-hidden="true"
                    />
                    {/* Inner glass ring */}
                    <span
                        className="absolute w-24 h-24 rounded-full"
                        style={{
                            background: 'rgba(247,147,26,0.07)',
                            border: '1px solid rgba(247,147,26,0.22)',
                        }}
                        aria-hidden="true"
                    />
                    {/* Core icon */}
                    <div
                        className="relative w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold text-black"
                        style={{
                            background: 'linear-gradient(135deg, #f9a030, #F7931A)',
                            boxShadow:
                                '0 0 30px rgba(247,147,26,0.5), 0 0 80px rgba(247,147,26,0.15)',
                        }}
                        aria-hidden="true"
                    >
                        ₿
                    </div>
                </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="shimmer-text">Satoshi&apos;s Wall</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/45 max-w-2xl mx-auto mb-10 leading-relaxed">
                The world&apos;s first permanent message board on{' '}
                <span className="text-[#F7931A] font-semibold">Bitcoin Layer 1</span>.
                <br />
                One message per wallet. Recorded forever on the blockchain.
            </p>

            {/* Live counter — glass pill */}
            {messageCount > 0n && (
                <div
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-full animate-slide-up"
                    style={{
                        background: 'rgba(247,147,26,0.08)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(247,147,26,0.2)',
                        boxShadow: '0 0 24px rgba(247,147,26,0.08)',
                    }}
                >
                    <span
                        className="w-2 h-2 rounded-full bg-[#F7931A] animate-pulse"
                        style={{ boxShadow: '0 0 6px rgba(247,147,26,0.8)' }}
                    />
                    <span
                        className="font-bold text-lg"
                        style={{ color: '#F7931A' }}
                    >
                        {messageCount.toString()}
                    </span>
                    <span className="text-white/50 text-sm">
                        {messageCount === 1n ? 'message' : 'messages'} carved into Bitcoin history
                    </span>
                </div>
            )}

            {/* Divider */}
            <div className="mt-16 flex items-center justify-center gap-4">
                <div
                    className="h-px w-28"
                    style={{ background: 'linear-gradient(to right, transparent, rgba(247,147,26,0.3))' }}
                />
                <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                        background: '#F7931A',
                        boxShadow: '0 0 8px rgba(247,147,26,0.6)',
                    }}
                />
                <div
                    className="h-px w-28"
                    style={{ background: 'linear-gradient(to left, transparent, rgba(247,147,26,0.3))' }}
                />
            </div>
        </section>
    );
}
