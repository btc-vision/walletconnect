import { Address, type Unisat, UnisatSigner } from '@btc-vision/transaction';
import { AbstractRpcProvider } from 'opnet';
import React, { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WalletConnectContext } from '../context/WalletConnectContext';
import type { WalletConnectNetwork, WalletInformation } from '../types.ts';
import '../utils/style.css';
import '../utils/theme.css';
import { type SupportedWallets, WalletController } from '../wallets';
import type {
    ControllerConnectAccounts,
    ControllerErrorResponse,
    ControllerResponse,
    WalletConnectWallet,
} from '../wallets/types.ts';

const AUTO_RECONNECT_RETRIES = 5;

interface WalletConnectProviderProps {
    theme?: 'light' | 'dark' | 'moto';
    children: ReactNode;
}

const WalletConnectProvider: React.FC<WalletConnectProviderProps> = ({ theme, children }) => {
    const [pageLoaded, setPageLoaded] = useState<boolean>(false);
    const [connectError, setConnectError] = useState<string | undefined>(undefined);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [network, setNetwork] = useState<WalletConnectNetwork | null>(null);

    const [supportedWallets] = useState<WalletConnectWallet[]>(WalletController.getWallets);
    const [selectedWallet, setSelectedWallet] = useState<SupportedWallets | null>(null);
    const [connecting, setConnecting] = useState<boolean>(false);
    const [modalOpen, setModalOpen] = useState<boolean>(false);

    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [walletType, setWalletType] = useState<SupportedWallets | null>(null);
    const [walletInstance, setWalletInstance] = useState<Unisat | null>(null);
    const [provider, setProvider] = useState<AbstractRpcProvider | null>(null);
    const [signer, setSigner] = useState<UnisatSigner | null>(null);

    const clearConnectError = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setConnectError(undefined), 5000);
    }, []);

    // This will run one time after the component mounts
    useEffect(() => {
        // callback function to call when event triggers
        const onPageLoad = () => {
            setPageLoaded(true);
        };

        if (document.readyState === 'complete') {
            onPageLoad();
        } else {
            window.addEventListener('load', onPageLoad, false);
            return () => window.removeEventListener('load', onPageLoad);
        }
    }, []);

    useEffect(() => {
        const savedWallet = localStorage.getItem('WC_SelectedWallet') as SupportedWallets;
        if (savedWallet) {
            setSelectedWallet(savedWallet);
        }
    }, []);

    useEffect(() => {
        if (connectError) {
            clearConnectError();
        }
    }, [connectError, clearConnectError]);

    const openConnectModal = () => {
        setConnectError(undefined);
        setModalOpen(true);
    };

    const closeConnectModal = () => {
        setModalOpen(false);
        setConnectError(undefined);
    };

    const disconnect = useCallback(async () => {
        console.log('DISCONNECTING FROM WALLET');
        localStorage.removeItem('WC_SelectedWallet');
        setSelectedWallet(null);
        setPublicKey(null);
        setWalletAddress(null);
        setConnecting(false);
        WalletController.removeDisconnectHook();
        WalletController.removeChainChangedHook();
        WalletController.removeAccountsChangedHook();
        await WalletController.disconnect();
        setNetwork(null);
    }, []);

    const connectToWallet = useCallback(
        async (wallet: SupportedWallets) => {
            setConnecting(true);
            try {
                const response: ControllerResponse<
                    ControllerConnectAccounts | ControllerErrorResponse
                > = await WalletController.connect(wallet);

                if (response.code === 200 && Array.isArray(response.data)) {
                    if (!response.data || response.data.length === 0) {
                        return;
                    }
                    setWalletAddress(response.data[0]);
                    const publicKey = await WalletController.getPublicKey();
                    setPublicKey(publicKey);
                    const network = await WalletController.getNetwork();
                    setNetwork(network);

                    WalletController.setAccountsChangedHook(accountsChanged);
                    WalletController.setChainChangedHook(chainChanged);
                    WalletController.setDisconnectHook(disconnect);

                    closeConnectModal();
                    setSelectedWallet(wallet);
                    localStorage.setItem('WC_SelectedWallet', wallet);
                } else if (response.data && 'message' in response.data) {
                    setConnectError(response.data.message);
                } else {
                    setConnectError('Unknown error');
                }
            } catch (err: unknown) {
                setConnectError((err as Error).message || 'Unexpected error');
            } finally {
                setConnecting(false);
            }
        },
        // eslint-disable-next-line
        [disconnect],
    );

    const attemptReconnect = useCallback(async () => {
        console.warn('Trying to reconnect...', selectedWallet, connecting);
        if (!selectedWallet || connecting) return;

        // Ensure we can connect without launching modal popup windows!
        const canAutoConnect = await WalletController.canAutoConnect(selectedWallet);
        console.log('CanAutoConnect', canAutoConnect);
        if (!canAutoConnect) return;

        let attempts = 0;

        const reconnect = async () => {
            attempts++;

            const walletAvailable = WalletController.isWalletInstalled(selectedWallet);
            if (walletAvailable) {
                console.log(`Attempting to reconnect to ${selectedWallet} (Attempt ${attempts})`);
                await connectToWallet(selectedWallet);
                return;
            }

            if (attempts < AUTO_RECONNECT_RETRIES) {
                setTimeout(reconnect, 1000 * attempts);
            }
        };

        await reconnect();
        // eslint-disable-next-line
    }, [selectedWallet, connectToWallet, pageLoaded]);

    useEffect(() => {
        void attemptReconnect();
    }, [attemptReconnect]);

    const accountsChanged = useCallback(
        async (accounts: string[]) => {
            console.log('Accounts', accounts);
            if (selectedWallet) {
                const account = accounts.length > 0 ? accounts[0] : null;
                setWalletAddress(account);
                const publicKey = account ? await WalletController.getPublicKey() : null;
                setPublicKey(publicKey);
            }
        },
        [selectedWallet, setWalletAddress, setPublicKey],
    );

    const chainChanged = useCallback(
        (network: WalletConnectNetwork): void => {
            if (selectedWallet) {
                setNetwork(network);
            }
        },
        [selectedWallet, setNetwork],
    );

    const allWallets = useMemo(() => {
        //console.log("Refreshing all wallets");
        return supportedWallets.map((wallet): WalletInformation => {
            //console.log(" --> ", wallet.name, wallet.controller.isInstalled(), wallet.controller.isConnected());
            return {
                name: wallet.name,
                icon: wallet.icon,
                isInstalled: wallet.controller.isInstalled(),
                isConnected: wallet.controller.isConnected(),
            };
        });
        // eslint-disable-next-line
    }, [supportedWallets, network, pageLoaded]);

    const availableWallets = useMemo(() => {
        return supportedWallets.filter((wallet) => wallet.controller.isInstalled());
        //return supportedWallets
        // eslint-disable-next-line
    }, [supportedWallets, network, pageLoaded]);

    useEffect(() => {
        const walletType = walletAddress ? WalletController.getWalletType() : null;
        setWalletType(walletType);
        const walletInstance = walletAddress ? WalletController.getWalletInstance() : null;
        setWalletInstance(walletInstance);
    }, [walletAddress]);

    useEffect(() => {
        const updateWalletInfo = async () => {
            const provider = walletAddress ? await WalletController.getProvider() : null;
            setProvider(provider);
        };
        void updateWalletInfo();
    }, [walletAddress, network]);

    useEffect(() => {
        const updateSigner = async () => {
            const signer = publicKey ? await WalletController.getSigner() : null;
            setSigner(signer);
        };
        void updateSigner();
    }, [network, publicKey]);

    const currentTheme = useMemo(() => {
        const currentTheme = theme || 'light';
        return `wallet-connect-${currentTheme}-theme`;
    }, [theme]);

    const address = useMemo(() => {
        return publicKey ? Address.fromString(publicKey) : null;
    }, [publicKey]);

    return (
        <WalletConnectContext.Provider
            value={{
                walletAddress,
                publicKey,
                address,
                connecting,
                connectToWallet,
                disconnect,
                openConnectModal,
                network,
                allWallets,
                walletInstance,
                provider,
                signer,
                walletType,
            }}>
            {children}
            {modalOpen && (
                <div className={`wallet-connect-modal-backdrop ${currentTheme}`}>
                    <div
                        className="wallet-connect-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="wallet-connect-modal-title">
                        <div className="wallet-connect-header">
                            <span>Connect Wallet</span>
                            <button
                                className="close"
                                onClick={() => closeConnectModal()}>
                                <span className="close-icon">
                                    <svg
                                        width="30px"
                                        height="30px"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            className="close-x-path"
                                            d="M16 8L8 16M8.00001 8L16 16"
                                            stroke="#fff"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </span>
                            </button>
                        </div>
                        {connectError && (
                            <div className="wallet-connect-error">
                                <p className="error-message">{connectError}</p>
                            </div>
                        )}
                        {availableWallets.length > 0 ? (
                            <div className="wallet-list">
                                {availableWallets.map((wallet) => (
                                    <button
                                        key={wallet.name}
                                        onClick={() => connectToWallet(wallet.name)}
                                        disabled={connecting || !wallet.controller.isInstalled()}
                                        className={`wallet-button ${
                                            wallet.controller.isInstalled()
                                                ? 'wallet-installed'
                                                : 'wallet-not-installed'
                                        }`}>
                                        {wallet.icon ? (
                                            <div
                                                className="wallet-icon"
                                                title={wallet.name}>
                                                <img
                                                    src={wallet.icon}
                                                    alt={wallet.name}
                                                />
                                            </div>
                                        ) : (
                                            <div className="wallet-name">{wallet.name}</div>
                                        )}

                                        {wallet.controller.isConnected() ? (
                                            <div className="wallet-connected">(Connected)</div>
                                        ) : (
                                            <></>
                                        )}
                                        {wallet.controller.isInstalled() ? (
                                            <></>
                                        ) : (
                                            <div className="wallet-not-installed">
                                                (Not Installed)
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : pageLoaded ? (
                            <div>
                                <p>No wallets available</p>
                                <p>Supporting the following wallets</p>
                                <div className="wallet-list">
                                    {supportedWallets.map((wallet) => (
                                        <a
                                            href={`https://chromewebstore.google.com/search/${wallet.name}`}>
                                            {wallet.icon ? (
                                                <div
                                                    className="wallet-icon"
                                                    title={wallet.name}>
                                                    <img
                                                        src={wallet.icon}
                                                        alt={wallet.name}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="wallet-name">{wallet.name}</div>
                                            )}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="wallet-waiting-plugin">
                                <p>Loading plugins...</p>
                                <p>Please wait</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </WalletConnectContext.Provider>
    );
};

export default WalletConnectProvider;
