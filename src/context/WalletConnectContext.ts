import { createContext } from 'react';
import type { WalletConnectNetwork } from '../types.ts';
import { SupportedWallets } from '../wallets';

export type WalletConnectContextType = {
    walletAddress: string | null;
    publicKey: string | undefined;
    connecting: boolean;
    connectToWallet: (wallet: SupportedWallets) => void;
    disconnect: () => void;
    openConnectModal: () => void;
    network: WalletConnectNetwork;
};

export const WalletConnectContext = createContext<WalletConnectContextType | undefined>(undefined);
