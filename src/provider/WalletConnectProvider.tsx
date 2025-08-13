import React, { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { WalletConnectContext } from '../context/WalletConnectContext';
import { SupportedWallets, WalletController } from '../wallets';
import type {
    ControllerConnectAccounts,
    ControllerErrorResponse,
    ControllerResponse,
    WalletConnectWallet
} from '../wallets/types.ts';
import '../utils/style.css';
import type { WalletConnectNetwork } from '../types.ts';
import { DefaultWalletConnectChain } from '../consts';

const AUTO_RECONNECT_RETRIES = 5;

const WalletConnectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [connectError, setConnectError] = useState<string | undefined>(undefined);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [network, setNetwork] = useState<WalletConnectNetwork>(DefaultWalletConnectChain);

    const [availableWallets, setAvailableWallets] = useState<WalletConnectWallet[]>([]);
    const [selectedWallet, setSelectedWallet] = useState<SupportedWallets | null>(
        () => localStorage.getItem('WC_SelectedWallet') as SupportedWallets || null
    );
    const [connecting, setConnecting] = useState<boolean>(false);
    const [modalOpen, setModalOpen] = useState<boolean>(false);

    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [publicKey, setPublicKey] = useState<string | undefined>(undefined);

    const clearConnectError = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setConnectError(undefined), 5000);
    }, []);

    useEffect(() => {
        if (connectError) {
            clearConnectError();
        }
    }, [connectError, clearConnectError]);

    const openConnectModal = () => {
        setConnectError(undefined);
        setAvailableWallets(availableWallets || []);
        setModalOpen(true);
    };

    const closeConnectModal = () => {
        setModalOpen(false);
        setConnectError(undefined);
    };

    const disconnect = useCallback(async () => {
        console.log("DISCONNECTING FROM WALLET")
        setWalletAddress(null);
        setPublicKey(undefined);
        setSelectedWallet(null);
        setNetwork(DefaultWalletConnectChain);
        setConnecting(false);
        localStorage.removeItem('WC_SelectedWallet');
        WalletController.removeDisconnectHook();
        WalletController.removeNetworkChangeHook();
        WalletController.removeChainChangedHook();
        await WalletController.disconnect();
    }, []);

    const connectToWallet = useCallback(
        async (wallet: SupportedWallets) => {
            setConnecting(true);
            try {
                const response: ControllerResponse<ControllerConnectAccounts | ControllerErrorResponse> =
                    await WalletController.connect(wallet);

                if (response.code === 200 && Array.isArray(response.data)) {
                    if (!response.data || response.data.length === 0) {
                        return;
                    }
                    setWalletAddress(response.data[0]);
                    const publicKey = await WalletController.getPublicKey();
                    setPublicKey(publicKey);
                    const network = await WalletController.getNetwork();
                    setNetwork(network);
                    WalletController.setDisconnectHook(disconnect);
                    WalletController.setNetworkChangeHook(changeNetwork);
                    WalletController.setChainChangedHook(changeChain);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [disconnect]
    );

    const attemptReconnect = useCallback(async () => {
        if (!selectedWallet) return;
        let attempts = 0;

        const reconnect = async () => {
            attempts++;
            if (!availableWallets || availableWallets.length === 0) {
                console.warn('No available wallets to reconnect to.');
                return;
            }
            const walletAvailable = availableWallets.some(
                (w) => w.name === selectedWallet && w.controller.isInstalled()
            );

            console.log(`Attempting to reconnect to ${selectedWallet} (Attempt ${attempts})`);

            if (walletAvailable && selectedWallet) {
                await connectToWallet(selectedWallet);
                return;
            }

            if (attempts < AUTO_RECONNECT_RETRIES) {
                setTimeout(reconnect, 1000 * attempts);
            }
        };

        await reconnect();
    }, [selectedWallet, availableWallets, connectToWallet]);

    useEffect(() => {
        setAvailableWallets(WalletController.getWallets());
        void attemptReconnect();
    }, [attemptReconnect]);

    const changeNetwork = useCallback(
        (network: WalletConnectNetwork): void => {
            if (selectedWallet) {
                setNetwork(network);
                void connectToWallet(selectedWallet);
            }
        },
        [connectToWallet, selectedWallet]
    );

    const changeChain = useCallback(
        (network: unknown): void => {
            if (selectedWallet) {
                console.log("Change chain", network);
                //setNetwork(network);
                //void connectToWallet(selectedWallet);
            }
        },
        [connectToWallet, selectedWallet]
    );

    return (
        <WalletConnectContext.Provider
            value={{ walletAddress, publicKey, connecting, connectToWallet, disconnect, openConnectModal, network }}>
            {children}
            {modalOpen && (
                <div className="wallet-connect-modal-backdrop">
                    <div
                        className="wallet-connect-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="wallet-connect-modal-title">
                        <div className="wallet-connect-header">
                            <span>Connect Wallet</span>
                            <button className="close" onClick={() => closeConnectModal()}>
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
                        {availableWallets && availableWallets.length > 0 ? (
                            <div className="wallet-list">
                                {availableWallets.map((wallet) => (
                                    <button
                                        key={wallet.name}
                                        onClick={() => connectToWallet(wallet.name)}
                                        disabled={connecting || !wallet.controller.isInstalled()}
                                        className="wallet-button">
                                        {wallet.icon
                                        ?
                                            <div className="wallet-icon">
                                                <img src={wallet.icon} />
                                            </div>
                                        :
                                            <div className="wallet-name">
                                                {wallet.name}
                                            </div>
                                        }

                                        {wallet.controller.isInstalled()
                                            ? (<></>)
                                            : (<div className="wallet-not-installed">(Not Installed)</div>)
                                        }
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p>No wallets available</p>
                        )}
                    </div>
                </div>
            )}
        </WalletConnectContext.Provider>
    );
};

export default WalletConnectProvider;
