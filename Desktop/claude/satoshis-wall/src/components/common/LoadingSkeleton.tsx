export function LoadingSkeleton(): JSX.Element {
    return (
        <div
            className="rounded-2xl p-4 animate-pulse"
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            <div className="flex items-center justify-between mb-3">
                <div
                    className="h-2.5 w-10 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                />
                <div
                    className="h-2.5 w-20 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                />
            </div>
            <div className="space-y-2 mb-4">
                <div
                    className="h-2.5 w-full rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                />
                <div
                    className="h-2.5 w-3/4 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                />
                <div
                    className="h-2.5 w-1/2 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                />
            </div>
            <div
                className="pt-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
                <div
                    className="h-2.5 w-28 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                />
            </div>
        </div>
    );
}
