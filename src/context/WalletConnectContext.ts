import { Address, type MessageType, type MLDSASignature, type Unisat, UnisatSigner } from '@btc-vision/transaction';
import { AbstractRpcProvider } from 'opnet';
import { createContext } from 'react';
import type { WalletBalance, WalletConnectNetwork, WalletInformation, WalletNetwork } from '../types.ts';
import { type SupportedWallets } from '../wallets';

export type WalletConnectContextType = {
    allWallets: WalletInformation[];
    walletType: string | null;
    walletAddress: string | null;
    walletInstance: Unisat | null;
    network: WalletConnectNetwork | null;
    publicKey: string | null;
    address: Address | null;
    openConnectModal: () => void;
    connectToWallet: (wallet: SupportedWallets) => Promise<void>;
    connecting: boolean;
    disconnect: () => Promise<void>;
    provider: AbstractRpcProvider | null;
    signer: UnisatSigner | null;
    walletBalance: WalletBalance | null;
    mldsaPublicKey: string | null;
    hashedMLDSAKey: string | null;
    switchNetwork: (network: WalletNetwork) => Promise<void>;
    signMessage: (message: string, messageType?: MessageType) => Promise<string | null>;
    signMLDSAMessage: (message: string) => Promise<MLDSASignature | null>;
    verifyMLDSASignature: (message: string, signature: MLDSASignature) => Promise<boolean>;
};

export const WalletConnectContext = createContext<WalletConnectContextType | undefined>(undefined);
