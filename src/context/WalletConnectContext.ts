import { createContext } from 'react';
import type { WalletConnectNetwork } from '../types.ts';
import { SupportedWallets } from '../wallets';

export type WalletConnectContextType = {
    network: WalletConnectNetwork;
    walletAddress: string | null;
    publicKey: string | null;
    openConnectModal: () => void;
    connectToWallet: (wallet: SupportedWallets) => void;
    connecting: boolean;
    disconnect: () => void;
};

export const WalletConnectContext = createContext<WalletConnectContextType | undefined>(undefined);
