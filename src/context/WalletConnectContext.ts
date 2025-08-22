import { createContext, ReactNode } from 'react';
import type { WalletConnectNetwork, WalletInformation } from '../types.ts';
import { SupportedWallets } from '../wallets';
import { Address, Unisat, UnisatSigner } from '@btc-vision/transaction';

export type WalletConnectContextType = {
    allWallets: WalletInformation[];
    walletType: string | null;
    walletAddress: string | null;
    network: WalletConnectNetwork;
    publicKey: string | null;
    address: Address | null;
    openConnectModal: (children?: ReactNode) => void;
    connectToWallet: (wallet: SupportedWallets) => void;
    connecting: boolean;
    disconnect: () => void;
    provider: Unisat | null;
    signer: UnisatSigner | null;
};

export const WalletConnectContext = createContext<WalletConnectContextType | undefined>(undefined);
