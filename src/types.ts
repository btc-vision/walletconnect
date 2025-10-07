import { type Network } from '@btc-vision/bitcoin';
import { type Unisat, UnisatChainType, UnisatNetwork } from '@btc-vision/transaction';
import type { Xverse } from './wallets/xverse/interface';
import type { SupportedWallets } from './wallets';

export { UnisatChainType, UnisatNetwork }  from '@btc-vision/transaction';

export function isXverse(walletInstance: Unisat|Xverse|null): walletInstance is Xverse {
    return typeof walletInstance == 'object' && (walletInstance as Xverse)?.createInscription !== undefined;
}
export function isUnisat(walletInstance: Unisat|Xverse|null): walletInstance is Unisat {
    return typeof walletInstance == 'object' && (walletInstance as Unisat)?.web3 !== undefined;
}

export interface WalletConnectNetwork extends Network {
    chainType: UnisatChainType;
    network: UnisatNetwork;
}

export interface WalletInformation {
    name: SupportedWallets;
    icon: string;
    isInstalled: boolean;
    isConnected: boolean;
    isRecommended: boolean;
}

export interface WalletBalance {
    total: number;
    confirmed: number;
    unconfirmed: number;
    csv75_total?: number;
    csv75_unlocked?: number;
    csv75_locked?: number;
    csv1_total?: number;
    csv1_unlocked?: number;
    csv1_locked?: number;
    p2wda_total_amount?: number;
    p2wda_pending_amount?: number;
    usd_value?: string;
}
