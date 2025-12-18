import { type Network } from '@btc-vision/bitcoin';
import type { SupportedWallets } from './wallets';
export type { MessageType } from '@btc-vision/transaction';

export enum WalletNetwork {
    BITCOIN_MAINNET = 'BITCOIN_MAINNET',
    BITCOIN_TESTNET4 = 'BITCOIN_TESTNET4',
    BITCOIN_TESTNET = 'BITCOIN_TESTNET',
    BITCOIN_REGTEST = 'BITCOIN_REGTEST',
    BITCOIN_SIGNET = 'BITCOIN_SIGNET',
    FRACTAL_BITCOIN_TESTNET = 'FRACTAL_BITCOIN_TESTNET',
    FRACTAL_BITCOIN_MAINNET = 'FRACTAL_BITCOIN_MAINNET',
}

export interface WalletConnectNetwork extends Network {
    chainType: WalletNetwork;
    network: string;
}

export interface WalletInformation {
    name: SupportedWallets;
    icon: string;
    isInstalled: boolean;
    isConnected: boolean;
}

export interface WalletBalance {
    total: number;
    confirmed: number;
    unconfirmed: number;
    csv75_total: number;
    csv75_unlocked: number;
    csv75_locked: number;
    csv1_total: number;
    csv1_unlocked: number;
    csv1_locked: number;
    p2wda_total_amount: number;
    p2wda_pending_amount: number;
    usd_value: string;
}
