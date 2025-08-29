import { type Network } from '@btc-vision/bitcoin';
import { UnisatChainType } from '@btc-vision/transaction';

export interface WalletConnectNetwork extends Network {
    chainType: UnisatChainType;
    network: string;
}

export interface WalletInformation {
    name: string;
    icon: string;
    isInstalled: boolean;
    isConnected: boolean;
}
