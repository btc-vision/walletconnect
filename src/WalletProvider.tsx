import { Network } from '@btc-vision/bitcoin';
import { Address } from '@btc-vision/transaction';
import { AbstractRpcProvider } from 'opnet';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import WalletConnection, { Signers, SupportedWallets, Wallets } from './WalletConnection';

interface WalletContextType {
    connect: (walletType: SupportedWallets) => Promise<void>;
    disconnect: () => void;

    isConnected: boolean;

    signer: Signers | null;
    walletType: SupportedWallets | null;
    walletWindowInstance: Wallets | null;

    address: Address | null;
    network: Network | null;
    provider: AbstractRpcProvider | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [walletConnection] = useState(new WalletConnection());

    const [isConnected, setIsConnected] = useState(false);

    const [signer, setSigner] = useState<Signers | null>(null);
    const [walletType, setWalletType] = useState<SupportedWallets | null>(null);
    const [walletWindowInstance, setWalletWindowInstance] = useState<Wallets | null>(null);

    const [address, setAddress] = useState<Address | null>(null);
    const [network, setNetwork] = useState<Network | null>(null);
    const [provider, setProvider] = useState<AbstractRpcProvider | null>(null);

    useEffect(() => {
        const storedWalletType = localStorage.getItem('walletType') as SupportedWallets | null;

        if (storedWalletType) {
            connect(storedWalletType).catch((error: unknown) => {
                console.error('Failed to reconnect wallet:', error);
                disconnect();
            });
        }
    }, []);

    const connect = useCallback(
        async (walletType: SupportedWallets) => {
            await walletConnection.connect(walletType);

            if (!walletConnection.signer || !walletConnection.walletWindowInstance)
                throw new Error('Failed to connect to wallet');

            setIsConnected(true);
            localStorage.setItem('walletType', walletType);

            setSigner(walletConnection.signer);
            setWalletType(walletType);
            setWalletWindowInstance(walletConnection.walletWindowInstance);

            setAddress(await walletConnection.getAddress());
            setNetwork(await walletConnection.getNetwork());
            setProvider(await walletConnection.getProvider());

            if (
                walletConnection.walletType === SupportedWallets.OP_WALLET ||
                walletConnection.walletType === SupportedWallets.UNISAT
            ) {
                walletConnection.walletWindowInstance.on('disconnect', () => {
                    disconnect();
                });

                walletConnection.walletWindowInstance.on('accountsChanged', async () => {
                    if (!walletConnection.walletWindowInstance) return;

                    setAddress(await walletConnection.getAddress());
                });

                walletConnection.walletWindowInstance.on('chainChanged', async () => {
                    if (!walletConnection.walletWindowInstance) return;

                    setNetwork(await walletConnection.getNetwork());
                    setProvider(await walletConnection.getProvider());
                });

                walletConnection.walletWindowInstance.on('networkChanged', async () => {
                    if (!walletConnection.walletWindowInstance) return;

                    setNetwork(await walletConnection.getNetwork());
                    setProvider(await walletConnection.getProvider());
                });
            }
        },
        [walletConnection],
    );

    const disconnect = useCallback(() => {
        walletConnection.disconnect();

        setIsConnected(false);
        localStorage.removeItem('walletType');

        setSigner(null);
        setWalletType(null);
        setWalletWindowInstance(null);

        setAddress(null);
        setNetwork(null);
        setProvider(null);
    }, [walletConnection]);

    const value = {
        connect,
        disconnect,

        isConnected,

        signer,
        walletType,
        walletWindowInstance,

        address,
        network,
        provider,
    };

    return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = (): WalletContextType => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};
