import { createContext } from 'react';
import type { WalletConnectNetwork, WalletInformation } from '../types.ts';
import { SupportedWallets } from '../wallets';
import { Unisat, UnisatSigner } from '@btc-vision/transaction';
import { AbstractRpcProvider } from 'opnet';

export type WalletConnectContextType = {
    allWallets: WalletInformation[];
    network: WalletConnectNetwork;
    walletAddress: string | null;
    publicKey: string | null;
    openConnectModal: () => void;
    connectToWallet: (wallet: SupportedWallets) => void;
    connecting: boolean;
    disconnect: () => void;
    provider: AbstractRpcProvider | null;
    signer: UnisatSigner | null;
    walletType: string | null;
    walletWindow: Unisat | null;

};

export const WalletConnectContext = createContext<WalletConnectContextType | undefined>(undefined);
