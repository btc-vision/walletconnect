import { createContext, type ReactNode } from 'react';
import { Address, type Unisat, UnisatSigner, XverseSigner } from '@btc-vision/transaction';
import type { WalletBalance, WalletConnectNetwork, WalletInformation } from '../types.ts';
import { AbstractRpcProvider } from 'opnet';
import { type SupportedWallets } from '../wallets';
import type { Xverse } from '../wallets/xverse/interface';

export type WalletConnectContextType = {
    allWallets: WalletInformation[];
    walletType: string | null;
    walletAddress: string | null;
    walletInstance: Unisat | Xverse | null;
    network: WalletConnectNetwork | null;
    publicKey: string | null;
    address: Address | null;
    openConnectModal: (children?: ReactNode) => void;
    connectToWallet: (wallet: SupportedWallets) => void;
    connecting: boolean;
    disconnect: () => void;
    provider: AbstractRpcProvider | null;
    signer: UnisatSigner | XverseSigner | null;
    walletBalance: WalletBalance | null;
};

export const WalletConnectContext = createContext<WalletConnectContextType | undefined>(undefined);
