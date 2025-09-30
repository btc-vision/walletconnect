import { type Unisat, UnisatChainType, UnisatSigner, XverseSigner } from '@btc-vision/transaction';
import { AbstractRpcProvider } from 'opnet';
import { type SupportedWallets } from './index';
import type { WalletBalance } from '../types';
import type { Xverse } from './xverse/interface';
export { type AbstractRpcProvider } from 'opnet';

export interface WalletBase {
    isInstalled(): boolean;
    isConnected(): boolean;
    canAutoConnect(): Promise<boolean>;
    connect(): Promise<string[] | undefined>;
    disconnect(): Promise<void>;

    getWalletInstance(): Unisat | Xverse | null;
    getPublicKey(): Promise<string | null>;
    getNetwork(): Promise<UnisatChainType>;
    getSigner(): Promise<UnisatSigner | XverseSigner | null>;
    getBalance(): Promise<WalletBalance>;
    getProvider(chainType: UnisatChainType): AbstractRpcProvider | null;

    setAccountsChangedHook(fn: (accounts: string[]) => void): void;
    removeAccountsChangedHook(): void;
    setDisconnectHook(fn: () => void): void;
    removeDisconnectHook(): void;
    setChainChangedHook(fn: (network: UnisatChainType) => void): void;
    removeChainChangedHook(): void;
}

export interface WalletConnectWallet {
    name: SupportedWallets;
    icon: string;
    controller: WalletBase;
}

export interface ControllerResponse<T> {
    code: number;
    data?: T;
}

export interface ControllerErrorResponse {
    message: string;
}

export type ControllerConnectAccounts = string[];
