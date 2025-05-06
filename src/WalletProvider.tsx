import { Network } from '@btc-vision/bitcoin';
import { Address } from '@btc-vision/transaction';
import { AbstractRpcProvider } from 'opnet';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import WalletConnection, { Signers, SupportedWallets, Wallets } from './WalletConnection.js';

export interface Account {
    isConnected: boolean;
    signer: Signers | null;
    address: Address;
    addressTyped: string;
    network: Network;
    provider: AbstractRpcProvider;
}

interface WalletContextType {
    connect: (walletType: SupportedWallets, signal?: AbortSignal) => Promise<void>;
    disconnect: () => void;
    walletType: SupportedWallets | null;
    walletWindowInstance: Wallets | null;
    account: Account | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const maxRetries = 10;
const delayBetweenRetries = 2000;

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [walletConnection] = useState(() => new WalletConnection());
    const [walletType, setWalletType] = useState<SupportedWallets | null>(null);
    const [walletWindowInstance, setWalletWindowInstance] = useState<Wallets | null>(null);
    const [account, setAccount] = useState<Account | null>(null);

    const registeredEvents = useRef(false);

    const disconnect = useCallback(() => {
        walletConnection.disconnect();
        setWalletType(null);
        setWalletWindowInstance(null);
        localStorage.removeItem('walletType');
        setAccount(null);
        registeredEvents.current = false;
    }, [walletConnection]);

    const connect = useCallback(
        async (type: SupportedWallets, signal?: AbortSignal) => {
            let success = false;
            let attempt = 0;

            while (attempt < maxRetries) {
                // If the signal was already aborted, exit early
                if (signal?.aborted) {
                    console.debug('Connection aborted.');
                    return;
                }

                try {
                    await walletConnection.connect(type);

                    if (
                        (walletConnection.walletType !== SupportedWallets.OP_WALLET &&
                            !walletConnection.signer) ||
                        !walletConnection.walletWindowInstance
                    ) {
                        throw new Error('Wallet not fully loaded yet');
                    }

                    success = true;
                    break;
                } catch (error) {
                    console.warn(
                        `Connection attempt ${attempt + 1} failed:`,
                        (error as Error).message,
                    );
                }

                attempt++;
                if (attempt < maxRetries) {
                    // Wait before the next retry, unless aborted
                    try {
                        await new Promise<void>((resolve, reject) => {
                            const timer = setTimeout(() => resolve(), delayBetweenRetries);

                            // If the signal is aborted during the timeout, reject so we jump out
                            signal?.addEventListener('abort', () => {
                                clearTimeout(timer);
                                reject(new DOMException('Aborted', 'AbortError'));
                            });
                        });
                    } catch {
                        // The abort event was triggered during the delay
                        console.debug('Connection aborted during retry delay.');
                        return;
                    }
                }
            }

            if (!success) {
                console.warn(`Failed to connect after ${maxRetries} attempts.`);
                disconnect();
                return;
            }

            // If the signal was aborted right after a successful connect, bail
            if (signal?.aborted) {
                console.debug('Connection aborted after a success, cleaning up.');
                disconnect();
                return;
            }

            setWalletType(type);
            setWalletWindowInstance(walletConnection.walletWindowInstance);
            localStorage.setItem('walletType', type);

            try {
                const signer = walletConnection.signer;
                const address = await walletConnection.getAddress();
                const addressTyped = await walletConnection.getAddressTyped();
                const network = await walletConnection.getNetwork();
                const provider = await walletConnection.getProvider();

                setAccount({
                    isConnected: true,
                    signer,
                    address,
                    addressTyped,
                    network,
                    provider,
                });

                if (
                    (walletConnection.walletType === SupportedWallets.OP_WALLET ||
                        walletConnection.walletType === SupportedWallets.UNISAT) &&
                    walletConnection.walletWindowInstance &&
                    !registeredEvents.current
                ) {
                    const instance = walletConnection.walletWindowInstance;
                    instance.on('disconnect', () => {
                        disconnect();
                    });

                    instance.on('accountsChanged', async () => {
                        try {
                            const updatedAddress = await walletConnection.getAddress();
                            const updatedAddressTyped = await walletConnection.getAddressTyped();
                            const updatedNetwork = await walletConnection.getNetwork();
                            const updatedProvider = await walletConnection.getProvider();

                            setAccount((prev) =>
                                prev
                                    ? {
                                        ...prev,
                                        address: updatedAddress,
                                        addressTyped: updatedAddressTyped,
                                        network: updatedNetwork,
                                        provider: updatedProvider,
                                    }
                                    : prev,
                            );
                        } catch (err) {
                            disconnect();
                            throw err;
                        }
                    });

                    registeredEvents.current = true;
                }
            } catch (error) {
                console.warn('Unable to finalize wallet connection:', error);
                disconnect();
            }
        },
        [disconnect, walletConnection],
    );

    // Reconnect if localStorage has a storedWalletType
    useEffect(() => {
        const storedWalletType = localStorage.getItem('walletType') as SupportedWallets | null;
        if (!storedWalletType) return;

        const controller = new AbortController();
        void (async () => {
            try {
                await connect(storedWalletType, controller.signal);
            } catch (error) {
                // AbortError is normal if the component unmounted or re-rendered quickly
                if ((error as DOMException).name !== 'AbortError') {
                    console.warn('Failed to reconnect to wallet:', error);
                }
            }
        })();

        return () => {
            controller.abort();
        };
    }, [connect]);

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
