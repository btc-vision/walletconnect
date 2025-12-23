import { type Network } from '@btc-vision/bitcoin';
import { UnisatChainType } from '@btc-vision/transaction';
import type { SupportedWallets } from './wallets/supported-wallets';

export interface WalletConnectNetwork extends Network {
    chainType: UnisatChainType;
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
