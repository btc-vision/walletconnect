import { Address, type MessageType, type MLDSASignature } from '@btc-vision/transaction';
import { AbstractRpcProvider } from 'opnet';
import { createContext } from 'react';
import {
    type WalletBalance,
    type WalletConnectNetwork,
    type WalletInformation,
    type WalletChainType,
    WalletNetwork,
} from '../types';
import { type SupportedWallets } from '../wallets';
import type { OPWallet } from '../wallets/opwallet/interface';

export type WalletConnectContextType = {
    allWallets: WalletInformation[];
    walletType: string | null;
    walletAddress: string | null;
    walletInstance: OPWallet | null;
    network: WalletConnectNetwork | null;
    publicKey: string | null;
    address: Address | null;
    openConnectModal: () => void;
    connectToWallet: (wallet: SupportedWallets) => Promise<void>;
    connecting: boolean;
    disconnect: () => Promise<void>;
    provider: AbstractRpcProvider | null;
    signer: null;
    walletBalance: WalletBalance | null;
    mldsaPublicKey: string | null;
    hashedMLDSAKey: string | null;
    switchNetwork: (network: WalletNetwork|WalletChainType) => Promise<void>;
    signMessage: (message: string, messageType?: MessageType) => Promise<string | null>;
    signMLDSAMessage: (message: string) => Promise<MLDSASignature | null>;
    verifyMLDSASignature: (message: string, signature: MLDSASignature) => Promise<boolean>;
};

export const WalletConnectContext = createContext<WalletConnectContextType | undefined>(undefined);
