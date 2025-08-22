import type { WalletConnectNetwork } from '../types.ts';
import { SupportedWallets } from './index';
import { Unisat, UnisatSigner } from '@btc-vision/transaction';
export type { AbstractRpcProvider } from 'opnet';

export interface WalletBase {
    isInstalled(): boolean;
    isConnected(): boolean;
    canAutoConnect(): Promise<boolean>;
    getProvider(): Unisat | null;
    getSigner(): Promise<UnisatSigner | null>;
    connect(): Promise<string[] | undefined>;
    disconnect(): Promise<void>;
    getPublicKey(): Promise<string | null>;
    getNetwork(): Promise<WalletConnectNetwork>;
    setAccountsChangedHook(fn: (accounts: string[]) => void): void;
    removeAccountsChangedHook(): void;
    setDisconnectHook(fn: () => void): void;
    removeDisconnectHook(): void;
    setChainChangedHook(fn: (network: WalletConnectNetwork) => void): void;
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
