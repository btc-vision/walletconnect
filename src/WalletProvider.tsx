import { Network } from '@btc-vision/bitcoin';
import { Address, UnisatSigner } from '@btc-vision/transaction';
import { JSONRpcProvider } from 'opnet';
import React, { createContext, useCallback, useContext, useState } from 'react';
import WalletConnection, { SupportedWallets } from './WalletConnection';

interface WalletContextType {
    connect: (walletType: SupportedWallets) => Promise<void>;
    disconnect: () => void;
    address: Address | null;
    signer: UnisatSigner | null;
    network: Network | null;
    provider: JSONRpcProvider | null;
    isConnected: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [walletConnection] = useState(new WalletConnection());
    const [address, setAddress] = useState<Address | null>(null);
    const [signer, setSigner] = useState<UnisatSigner | null>(null);
    const [network, setNetwork] = useState<Network | null>(null);
    const [provider, setProvider] = useState<JSONRpcProvider | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const connect = useCallback(
        async (walletType: SupportedWallets) => {
            await walletConnection.connect(walletType);
            const publicKey = walletConnection.getSigner().getPublicKey();
            const connectedAddress = Address.fromString(publicKey.toString('hex'));

            setAddress(connectedAddress);
            setSigner(walletConnection.getSigner());
            setNetwork(walletConnection.getNetwork());
            setProvider(walletConnection.getProvider());
            setIsConnected(true);
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
