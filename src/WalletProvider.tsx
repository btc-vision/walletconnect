import { Network } from '@btc-vision/bitcoin';
import { Address } from '@btc-vision/transaction';
import { AbstractRpcProvider } from 'opnet';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import WalletConnection, { Signers, SupportedWallets, Wallets } from './WalletConnection';

export interface Account {
    isConnected: boolean;
    signer: Signers | null;
    address: Address;
    addressTyped: string;
    network: Network;
    provider: AbstractRpcProvider;
}

interface WalletContextType {
    connect: (wallet: SupportedWallets, signal?: AbortSignal) => Promise<void>;
    disconnect: () => void;
    walletType: SupportedWallets | null;
    walletWindowInstance: Wallets | null;
    account: Account | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 2_000;

function useDocumentComplete(fn: () => void) {
    const fired = useRef(false);

    useEffect(() => {
        if (fired.current) return;
        const run = () => {
            if (fired.current) return;
            fired.current = true;
            fn();
        };

        if (document.readyState === 'complete') {
            run();
            return;
        }

        const handler = () => {
            if (document.readyState === 'complete') {
                document.removeEventListener('readystatechange', handler);
                run();
            }
        };
        document.addEventListener('readystatechange', handler);
        return () => document.removeEventListener('readystatechange', handler);
    }, [fn]);
}

export const WalletProvider = ({ children }: { children: ReactNode }) => {
    const [walletConnection] = useState(() => new WalletConnection());
    const [walletType, setWalletType] = useState<SupportedWallets | null>(null);
    const [walletWindowInstance, setWalletWindowInstance] = useState<Wallets | null>(null);
    const [account, setAccount] = useState<Account | null>(null);

    /** keeps the latest listeners so they can be removed in `disconnect` */
    const listeners = useRef<{
        disconnect?: () => void;
        accountsChanged?: () => void;
    }>({});

    const disconnect = useCallback(() => {
        // detach previously attached listeners, if any
        const inst = walletWindowInstance;
        if (inst) {
            if (listeners.current.disconnect) {
                inst.removeListener?.('disconnect', listeners.current.disconnect);
                listeners.current.disconnect = undefined;
            }
            if (listeners.current.accountsChanged) {
                inst.removeListener?.('accountsChanged', listeners.current.accountsChanged);
                listeners.current.accountsChanged = undefined;
            }
        }

        walletConnection.disconnect();
        setWalletType(null);
        setWalletWindowInstance(null);
        localStorage.removeItem('walletType');
        setAccount(null);
    }, [walletConnection, walletWindowInstance]);

    const connect = useCallback(
        async (type: SupportedWallets, signal?: AbortSignal) => {
            let attempt = 0;

            const throwIfAborted = () => {
                if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
            };

            while (attempt < MAX_RETRIES) {
                throwIfAborted();
                try {
                    await walletConnection.connect(type);

                    if (
                        (walletConnection.walletType !== SupportedWallets.OP_WALLET &&
                            !walletConnection.signer) ||
                        !walletConnection.walletWindowInstance
                    ) {
                        throw new Error('Wallet not fully loaded yet');
                    }
                    break; // success
                } catch (err) {
                    attempt += 1;
                    if (attempt >= MAX_RETRIES) {
                        console.warn(`Failed to connect after ${MAX_RETRIES} attempts.`, err);
                        disconnect();
                        return;
                    }
                    console.warn(`Connection attempt ${attempt} failed:`, (err as Error).message);

                    try {
                        await new Promise<void>((res, rej) => {
                            const t = setTimeout(res, RETRY_DELAY_MS);
                            signal?.addEventListener('abort', () => {
                                clearTimeout(t);
                                rej(new DOMException('Aborted', 'AbortError'));
                            });
                        });
                    } catch {
                        console.debug('Connection aborted during retry delay.');
                        return;
                    }
                }
            }

            throwIfAborted();

            setWalletType(type);
            setWalletWindowInstance(walletConnection.walletWindowInstance);
            localStorage.setItem('walletType', type);

            try {
                const [signer, address, addressTyped, network, provider] = await Promise.all([
                    walletConnection.signer,
                    walletConnection.getAddress(),
                    walletConnection.getAddressTyped(),
                    walletConnection.getNetwork(),
                    walletConnection.getProvider(),
                ]);

                setAccount({
                    isConnected: true,
                    signer,
                    address,
                    addressTyped,
                    network,
                    provider,
                });

                /* attach listeners exactly once per successful connect */
                const instance = walletConnection.walletWindowInstance;
                if (instance) {
                    const onDisconnect = () => disconnect();
                    const onAccountsChanged = async () => {
                        try {
                            const [updatedAddr, updatedAddrTyped, updatedNet, updatedProv] =
                                await Promise.all([
                                    walletConnection.getAddress(),
                                    walletConnection.getAddressTyped(),
                                    walletConnection.getNetwork(),
                                    walletConnection.getProvider(),
                                ]);

                            setAccount((prev) =>
                                prev
                                    ? {
                                          ...prev,
                                          address: updatedAddr,
                                          addressTyped: updatedAddrTyped,
                                          network: updatedNet,
                                          provider: updatedProv,
                                      }
                                    : prev,
                            );
                        } catch {
                            disconnect();
                        }
                    };

                    /* store for later removal */
                    listeners.current.disconnect = onDisconnect;
                    listeners.current.accountsChanged = onAccountsChanged;

                    instance.on('disconnect', onDisconnect);
                    instance.on('accountsChanged', onAccountsChanged);
                }
            } catch (err) {
                console.warn('Unable to finalize wallet connection:', err);
                disconnect();
            }
        },
        [walletConnection, disconnect],
    );

    useDocumentComplete(() => {
        const stored = localStorage.getItem('walletType') as SupportedWallets | null;
        if (!stored) return;

        const controller = new AbortController();
        connect(stored, controller.signal).catch((err: unknown) => {
            if ((err as DOMException).name !== 'AbortError') {
                console.warn('Failed to reconnect to wallet:', err);
            }
        });

        return () => controller.abort();
    });

    const ctx: WalletContextType = {
        connect,
        disconnect,
        walletType,
        walletWindowInstance,
        account,
    };

    return <WalletContext.Provider value={ctx}>{children}</WalletContext.Provider>;
};

export const useWallet = (): WalletContextType => {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
    return ctx;
};
