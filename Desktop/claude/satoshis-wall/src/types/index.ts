export interface WallMessage {
    readonly index: number;
    readonly sender: string;
    readonly blockNumber: bigint;
    readonly text: string;
    readonly pending?: boolean;
}

export interface WalletState {
    readonly connected: boolean;
    readonly address: string;
    readonly publicKey: string;
}

export interface WallStats {
    readonly messageCount: bigint;
    readonly totalRaised: bigint;
}
