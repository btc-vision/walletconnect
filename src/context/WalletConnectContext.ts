import { createContext } from 'react';
import type { WalletConnectNetwork, WalletInformation } from '../types.ts';
import { SupportedWallets } from '../wallets';

export type WalletConnectContextType = {
    allWallets: WalletInformation[];
    network: WalletConnectNetwork;
    walletAddress: string | null;
    publicKey: string | null;
    openConnectModal: () => void;
    connectToWallet: (wallet: SupportedWallets) => void;
    connecting: boolean;
    disconnect: () => void;
};

export const WalletConnectContext = createContext<WalletConnectContextType | undefined>(undefined);
