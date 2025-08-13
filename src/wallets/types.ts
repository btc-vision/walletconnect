import type { WalletConnectNetwork } from '../types.ts';

export interface WalletBase {
    isInstalled(): boolean;
    connect(): Promise<string[] | undefined>;
    disconnect(): Promise<void>;
    getPublicKey(): Promise<string> | undefined;
    getNetwork(): Promise<WalletConnectNetwork>;
    setDisconnectHook(fn: () => void): void;
    removeDisconnectHook(): void;
    setChainChangedHook(fn: (network: unknown) => void): void;
    removeChainChangedHook(): void;
    setNetworkChangedHook(fn: (network: WalletConnectNetwork) => void): void;
    removeNetworkChangedHook(): void;
    getChainId(): void;
}

export interface WalletConnectWallet {
    name: string;
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
