import { useState, useCallback, useEffect } from 'react';
import type { OPWallet } from '@btc-vision/transaction';
import type { WalletState } from '../types/index';

function getOpWallet(): OPWallet | undefined {
    return window.opnet;
}

export function useWallet(): {
    readonly wallet: WalletState;
    readonly connecting: boolean;
    readonly connectError: string;
    readonly connect: () => Promise<void>;
    readonly disconnect: () => void;
} {
    const [wallet, setWallet] = useState<WalletState>({
        connected: false,
        address: '',
        publicKey: '',
    });
    const [connecting, setConnecting] = useState(false);
    const [connectError, setConnectError] = useState('');

    // Listen for account changes from the wallet extension
    useEffect(() => {
        const opnet = getOpWallet();
        if (!opnet) return;

        const handleAccountsChanged = (accounts: string[]): void => {
            if (accounts.length === 0) {
                setWallet({ connected: false, address: '', publicKey: '' });
            } else {
                const addr = accounts[0] ?? '';
                setWallet((prev) => ({ ...prev, connected: true, address: addr }));
            }
        };

        opnet.on('accountsChanged', handleAccountsChanged);
        return () => opnet.removeListener('accountsChanged', handleAccountsChanged);
    }, []);

    const connect = useCallback(async (): Promise<void> => {
        const opnet = getOpWallet();
        if (!opnet) {
            window.open('https://opnet.org/wallet', '_blank');
            return;
        }

        setConnecting(true);
        setConnectError('');
        try {
            // requestAccounts triggers the wallet popup and returns addresses
            const accounts = await opnet.requestAccounts();
            const address = accounts[0] ?? '';
            const publicKey = await opnet.getPublicKey();

            setWallet({ connected: true, address, publicKey });
        } catch (err: unknown) {
            const code = (err as { code?: number }).code;
            if (code === 4001) {
                setConnectError('Wallet is locked. Please unlock your OPWallet extension and try again.');
            } else if (code === 4100) {
                setConnectError('Connection rejected. Please approve the request in your wallet.');
            } else {
                const msg = err instanceof Error ? err.message : '';
                if (msg.toLowerCase().includes('lock') || msg.toLowerCase().includes('initializ')) {
                    setConnectError('Wallet is locked. Please unlock your OPWallet extension and try again.');
                } else {
                    setConnectError(msg || 'Connection failed. Please try again.');
                }
            }
        } finally {
            setConnecting(false);
        }
    }, []);

    const disconnect = useCallback((): void => {
        getOpWallet()?.disconnect();
        setWallet({ connected: false, address: '', publicKey: '' });
    }, []);

    return { wallet, connecting, connectError, connect, disconnect };
}
