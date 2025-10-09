import { createContext, type ReactNode } from 'react';
import { Address, type Unisat, UnisatSigner } from '@btc-vision/transaction';
import type { WalletBalance, WalletConnectNetwork, WalletInformation } from '../types.ts';
import { AbstractRpcProvider } from 'opnet';
import { type SupportedWallets } from '../wallets';

export type WalletConnectContextType = {
    allWallets: WalletInformation[];
    walletType: string | null;
    walletAddress: string | null;
    walletInstance: Unisat | null;
    network: WalletConnectNetwork | null;
    publicKey: string | null;
    address: Address | null;
    openConnectModal: (children?: ReactNode) => void;
    connectToWallet: (wallet: SupportedWallets) => void;
    connecting: boolean;
    disconnect: () => void;
    provider: AbstractRpcProvider | null;
    signer: UnisatSigner | null;
    walletBalance: WalletBalance | null;
};

export const WalletConnectContext = createContext<WalletConnectContextType | undefined>(undefined);
