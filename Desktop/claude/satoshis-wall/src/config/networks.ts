import { type Network } from '@btc-vision/bitcoin';

// OPNet testnet is a custom Signet fork with 'opt' bech32 prefix.
// @btc-vision/bitcoin v6 doesn't export opnetTestnet yet, so we define it inline.
// Wallet addresses look like opt1p... (P2TR) and opt1q... (P2WPKH).
export const ACTIVE_NETWORK: Network = {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'opt',
    bech32Opnet: 'opt',
    bip32: { public: 0x043587cf, private: 0x04358394 },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
};

export const RPC_URL = 'https://testnet.opnet.org';

// Contract address — deployed on OPNet testnet
export const CONTRACT_ADDRESS = 'opt1sqzpm3gky8pxfa0ulnndeg500lv239s07vvxv8eu0';

// Treasury — receives 1000 sats per post directly via Bitcoin UTXO
export const TREASURY_ADDRESS = 'opt1per7xtma7v53nllqwf7chl3lf3h2mvxcsqgdwsf56mt92ptfe56gsaeftqf';
export const MIN_POST_SATS = 1000; // value: number (PsbtOutputExtendedAddress requires number)
