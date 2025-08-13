import { createContext } from 'react';
import type { WalletConnectNetwork } from '../types.ts';

export type WalletConnectContextType = {
    walletAddress: string | null;
    publicKey: string | undefined;
    connecting: boolean;
    connectToWallet: (wallet: string) => void;
    disconnect: () => void;
    openConnectModal: () => void;
    network: WalletConnectNetwork;
};

export const WalletConnectContext = createContext<WalletConnectContextType | undefined>(undefined);
