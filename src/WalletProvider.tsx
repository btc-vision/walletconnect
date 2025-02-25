import { Network } from '@btc-vision/bitcoin';
import { Address } from '@btc-vision/transaction';
import { AbstractRpcProvider } from 'opnet';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import WalletConnection, { Signers, SupportedWallets, Wallets } from './WalletConnection';

export interface Account {
    isConnected: boolean;
    signer: Signers | null;
    address: Address;
    network: Network;
    provider: AbstractRpcProvider;
}

interface WalletContextType {
    connect: (walletType: SupportedWallets) => Promise<void>;
    disconnect: () => void;
    walletType: SupportedWallets | null;
    walletWindowInstance: Wallets | null;
    account: Account | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [walletConnection] = useState(new WalletConnection());
    const [walletType, setWalletType] = useState<SupportedWallets | null>(null);
    const [walletWindowInstance, setWalletWindowInstance] = useState<Wallets | null>(null);
    const [account, setAccount] = useState<Account | null>(null);

    const registeredEvents = useRef(false);

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

            // For wallets other than OP_WALLET, ensure that a signer is present
            if (
                (walletConnection.walletType !== SupportedWallets.OP_WALLET &&
                    !walletConnection.signer) ||
                !walletConnection.walletWindowInstance
            )
                throw new Error('Failed to connect to wallet');

            setWalletType(walletType);
            setWalletWindowInstance(walletConnection.walletWindowInstance);
            localStorage.setItem('walletType', walletType);

            const signer = walletConnection.signer;
            const address = await walletConnection.getAddress();
            const network = await walletConnection.getNetwork();
            const provider = await walletConnection.getProvider();

            setAccount({
                isConnected: true,
                signer,
                address,
                network,
                provider,
            });

            if (
                walletConnection.walletType === SupportedWallets.OP_WALLET ||
                walletConnection.walletType === SupportedWallets.UNISAT
            ) {
                const instance = walletConnection.walletWindowInstance;

                if (instance && !registeredEvents.current) {
                    instance.on('disconnect', () => {
                        disconnect();
                    });

                    instance.on('accountsChanged', async () => {
                        try {
                            const updatedAddress = await walletConnection.getAddress();
                            const updatedNetwork = await walletConnection.getNetwork();
                            const updatedProvider = await walletConnection.getProvider();

                            setAccount((prevAccount) =>
                                prevAccount
                                    ? {
                                          ...prevAccount,
                                          address: updatedAddress,
                                          network: updatedNetwork,
                                          provider: updatedProvider,
                                      }
                                    : prevAccount,
                            );
                        } catch (error) {
                            disconnect();
                            throw error;
                        }
                    });

                    registeredEvents.current = true;
                }
            }
        },
        [walletConnection],
    );

    const disconnect = useCallback(() => {
        walletConnection.disconnect();
        setWalletType(null);
        setWalletWindowInstance(null);
        localStorage.removeItem('walletType');
        setAccount(null);
        registeredEvents.current = false;
    }, [walletConnection]);

    const value = {
        connect,
        disconnect,
        walletType,
        walletWindowInstance,
        account,
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
