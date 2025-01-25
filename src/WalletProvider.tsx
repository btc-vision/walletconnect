import { Network } from '@btc-vision/bitcoin';
import { Address } from '@btc-vision/transaction';
import { JSONRpcProvider } from 'opnet';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import WalletConnection, { Signers, SupportedWallets } from './WalletConnection';

interface WalletContextType {
    connect: (walletType: SupportedWallets) => Promise<void>;
    disconnect: () => void;
    address: Address | null;
    signer: Signers | null;
    network: Network | null;
    provider: JSONRpcProvider | null;
    isConnected: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [walletConnection] = useState(new WalletConnection());
    const [address, setAddress] = useState<Address | null>(null);
    const [signer, setSigner] = useState<Signers | null>(null);
    const [network, setNetwork] = useState<Network | null>(null);
    const [provider, setProvider] = useState<JSONRpcProvider | null>(null);
    const [isConnected, setIsConnected] = useState(false);

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

            setAddress(await walletConnection.getAddress());
            setSigner(walletConnection.signer);
            setNetwork(await walletConnection.getNetwork());
            setProvider(await walletConnection.getProvider());
            setIsConnected(true);
            localStorage.setItem('walletType', walletType);

            walletConnection.getWalletInstance().on('disconnect', () => {
                disconnect();
            });

            walletConnection.getWalletInstance().on('accountsChanged', async () => {
                setAddress(await walletConnection.getAddress());
            });

            walletConnection.getWalletInstance().on('chainChanged', async () => {
                setNetwork(await walletConnection.getNetwork());
                setProvider(await walletConnection.getProvider());
            });

            walletConnection.getWalletInstance().on('networkChanged', async () => {
                setNetwork(await walletConnection.getNetwork());
                setProvider(await walletConnection.getProvider());
            });
        },
        [walletConnection],
    );

    const disconnect = useCallback(() => {
        walletConnection.disconnect();
        setAddress(null);
        setSigner(null);
        setNetwork(null);
        setProvider(null);
        setIsConnected(false);
        localStorage.removeItem('walletType');
    }, [walletConnection]);

    const value = {
        connect,
        disconnect,
        address,
        signer,
        network,
        provider,
        isConnected,
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
