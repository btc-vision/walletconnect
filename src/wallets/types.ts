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
    getWalletInstance(): Unisat | Xverse | null;
    getProvider(chainType: UnisatChainType): AbstractRpcProvider | null;
    getSigner(): Promise<UnisatSigner | XverseSigner | null>;
    connect(): Promise<string[] | undefined>;
    disconnect(): Promise<void>;
    getPublicKey(): Promise<string | null>;
    getBalance(): Promise<WalletBalance>;
    getNetwork(): Promise<UnisatChainType>;
    setAccountsChangedHook(fn: (accounts: string[]) => void): void;
    removeAccountsChangedHook(): void;
    setDisconnectHook(fn: () => void): void;
    removeDisconnectHook(): void;
    setChainChangedHook(fn: (network: UnisatChainType) => void): void;
    removeChainChangedHook(): void;
    getChainId(): void;
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
