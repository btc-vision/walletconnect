import {
    type MessageType,
    type MLDSASignature,
} from '@btc-vision/transaction';
import { AbstractRpcProvider } from 'opnet';
import { type SupportedWallets } from './index';
import type { WalletBalance, WalletNetwork } from '../types';
import type { OPWallet } from './opwallet/interface';
export { type AbstractRpcProvider } from 'opnet';

export interface WalletBase {
    isInstalled(): boolean;
    isConnected(): boolean;
    canAutoConnect(): Promise<boolean>;
    getWalletInstance(): OPWallet | null;
    getProvider(): Promise<AbstractRpcProvider | null>;
    getSigner(): Promise<null>;
    connect(): Promise<string[] | undefined>;
    disconnect(): Promise<void>;
    getPublicKey(): Promise<string | null>;
    getBalance(): Promise<WalletBalance | null>;
    getNetwork(): Promise<WalletNetwork>;
    setAccountsChangedHook(fn: (accounts: string[]) => void): void;
    removeAccountsChangedHook(): void;
    setDisconnectHook(fn: () => void): void;
    removeDisconnectHook(): void;
    setChainChangedHook(fn: (network: WalletNetwork) => void): void;
    removeChainChangedHook(): void;
    getChainId(): void;
    getMLDSAPublicKey(): Promise<string | null>;
    getHashedMLDSAKey(): Promise<string | null>;
    switchNetwork(network: string): Promise<void>;
    signMessage(message: string, messageType?: MessageType): Promise<string | null>;
    signMLDSAMessage(message: string): Promise<MLDSASignature | null>;
    verifyMLDSASignature(message: string, signature: MLDSASignature): Promise<boolean>;
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
