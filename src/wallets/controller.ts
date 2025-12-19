import { type Network, networks } from '@btc-vision/bitcoin';
import {
    type MessageType,
    type MLDSASignature,
} from '@btc-vision/transaction';
import { AbstractRpcProvider } from 'opnet';
import { type WalletBalance, type WalletConnectNetwork, WalletChainType, WalletNetwork } from '../types';
import { _e } from '../utils/accessibility/errorDecoder';
import { type SupportedWallets } from './index';
import {
    type ControllerConnectAccounts,
    type ControllerErrorResponse,
    type ControllerResponse,
    type WalletConnectWallet,
} from './types';
import type { OPWallet } from './opwallet/interface';

class WalletController {
    private static wallets: Map<string, WalletConnectWallet> = new Map();
    private static currentWallet: WalletConnectWallet | null = null;

    static getWallets = () => {
        return [...WalletController.wallets.values()];
    };
    static isWalletInstalled(wallet: string): boolean {
        return this.wallets.get(wallet)?.controller?.isInstalled() || false;
    }
    static getWalletType(): SupportedWallets | null {
        return WalletController.currentWallet?.name || null;
    }

    static getWalletInstance(): OPWallet | null {
        const wallet = this.currentWallet;
        if (!wallet) {
            return null;
        }
        // Needs to return a Proxy to be sure useEffects are triggered
        const walletInstance = wallet.controller.getWalletInstance();
        return walletInstance ? new Proxy(walletInstance, {}) : null;
    }

    static async getProvider(): Promise<AbstractRpcProvider | null> {
        const wallet = this.currentWallet;
        if (!wallet) {
            return null;
        }
        // Needs to return a Proxy to be sure useEffects are triggered
        const provider = await wallet.controller.getProvider();
        return provider ? new Proxy(provider, {}) : null;
    }

    static async getSigner(): Promise<null> {
        const wallet = this.currentWallet;
        if (!wallet) {
            return null;
        }
        return await wallet.controller.getSigner();
    }

    //TODO: check if we really want to return a default network here
    //      instead of null.  Default is there: DefaultWalletConnectChain.network
    static convertChainTypeToNetwork(chainType: WalletChainType): WalletConnectNetwork | null {
        const walletNetwork = (network: Network, name: WalletNetwork): WalletConnectNetwork => {
            return { ...network, chainType: chainType, network: name };
        };
        switch (chainType) {
            case WalletChainType.BITCOIN_REGTEST:
                return walletNetwork(networks.regtest, WalletNetwork.regtest);
            case WalletChainType.BITCOIN_TESTNET:
                return walletNetwork(networks.testnet, WalletNetwork.testnet);
            case WalletChainType.BITCOIN_MAINNET:
                return walletNetwork(networks.bitcoin, WalletNetwork.mainnet);

            case WalletChainType.BITCOIN_TESTNET4:
            case WalletChainType.BITCOIN_SIGNET:
            case WalletChainType.FRACTAL_BITCOIN_TESTNET:
            case WalletChainType.FRACTAL_BITCOIN_MAINNET:
            default:
                return null;
        }
    }

    static async getNetwork(): Promise<WalletConnectNetwork | null> {
        const wallet = this.currentWallet;
        if (!wallet) {
            return null;
        }

        const chainType = await wallet.controller.getNetwork();
        return this.convertChainTypeToNetwork(chainType);
    }

    static async getPublicKey(): Promise<string | null> {
        const wallet = this.currentWallet;
        if (!wallet) {
            return null;
        }
        return wallet.controller.getPublicKey();
    }

    static async getBalance(): Promise<WalletBalance | null> {
        const wallet = this.currentWallet;
        if (!wallet) {
            return null;
        }
        return wallet.controller.getBalance();
    }

    static async canAutoConnect(walletName: string) {
        const wallet = this.wallets.get(walletName);
        return (wallet && (await wallet.controller.canAutoConnect())) || false;
    }

    static async connect(
        walletName: string,
    ): Promise<ControllerResponse<ControllerConnectAccounts | ControllerErrorResponse>> {
        const wallet = this.wallets.get(walletName);
        if (!wallet) {
            return {
                code: 404,
                data: {
                    message: _e('Wallet not found'),
                },
            };
        }
        try {
            const accounts = await wallet.controller.connect();
            await this.disconnectIfWalletChanged(wallet);
            this.currentWallet = wallet;
            return {
                code: 200,
                data: accounts,
            };
        } catch (error) {
            return {
                code: 499,
                data: {
                    message: _e((error as Error)?.message || (error as string)),
                },
            };
        }
    }

    static async disconnectIfWalletChanged(newWallet: WalletConnectWallet) {
        const wallet = this.currentWallet;
        if (wallet && wallet.name != newWallet.name) {
            await this.disconnect();
            this.unbindHooks();
        }
    }

    static async disconnect(): Promise<void> {
        const wallet = this.currentWallet;
        if (!wallet) {
            return;
        }
        await wallet.controller.disconnect();
        this.currentWallet = null;
    }

    static setAccountsChangedHook(fn: (accounts: string[]) => void): void {
        const wallet = this.currentWallet;
        if (!wallet) {
            return;
        }
        wallet.controller.removeAccountsChangedHook();
        wallet.controller.setAccountsChangedHook(fn);
    }

    static setDisconnectHook(fn: () => void): void {
        const wallet = this.currentWallet;
        if (!wallet) {
            return;
        }
        wallet.controller.removeDisconnectHook();
        wallet.controller.setDisconnectHook(fn);
    }

    static setChainChangedHook(fn: (network: WalletConnectNetwork) => void): void {
        const wallet = this.currentWallet;
        if (!wallet) {
            console.log('No current wallet to set network switch hook for');
            return;
        }
        wallet.controller.removeChainChangedHook();
        wallet.controller.setChainChangedHook((chainType: WalletChainType) => {
            const network = this.convertChainTypeToNetwork(chainType);
            if (network) {
                fn(network);
            }
        });
    }

    static removeAccountsChangedHook(): void {
        const wallet = this.currentWallet;
        if (!wallet) {
            console.log('No current wallet to remove accounts changed hook from');
            return;
        }
        try {
            wallet.controller.removeAccountsChangedHook();
        } catch (error) {
            console.error('Error removing accounts changed hook:', error);
        }
    }

    static removeDisconnectHook(): void {
        const wallet = this.currentWallet;
        if (!wallet) {
            console.log('No current wallet to remove disconnect hook from');
            return;
        }
        try {
            wallet.controller.removeDisconnectHook();
        } catch (error) {
            console.error('Error removing disconnect hook:', error);
        }
    }

    static removeChainChangedHook(): void {
        const wallet = this.currentWallet;
        if (!wallet) {
            console.log('No current wallet to remove network change hook from');
            return;
        }
        try {
            wallet.controller.removeChainChangedHook();
        } catch (error) {
            console.error('Error removing network change hook:', error);
        }
    }

    static registerWallet = (wallet: WalletConnectWallet): void => {
        this.wallets.set(wallet.name, wallet);
    };

    static unbindHooks(): void {
        this.removeDisconnectHook();
        this.removeChainChangedHook();
        this.removeAccountsChangedHook();
    }

    static async switchNetwork(network: WalletNetwork|WalletChainType): Promise<void> {
        const wallet = this.currentWallet;
        if (!wallet) return;

        return wallet.controller.switchNetwork(network);
    }

    static async signMessage(message: string, messageType?: MessageType): Promise<string | null> {
        const wallet = this.currentWallet;
        if (!wallet) return null;

        return wallet.controller.signMessage(message, messageType);
    }

    static async getMLDSAPublicKey(): Promise<string | null> {
        const wallet = this.currentWallet;
        if (!wallet) return null;

        return wallet.controller.getMLDSAPublicKey();
    }

    static async getHashedMLDSAKey(): Promise<string | null> {
        const wallet = this.currentWallet;
        if (!wallet) return null;

        return wallet.controller.getHashedMLDSAKey();
    }

    static async signMLDSAMessage(message: string): Promise<MLDSASignature | null> {
        const wallet = this.currentWallet;
        if (!wallet) return null;

        return wallet.controller.signMLDSAMessage(message);
    }

    static async verifyMLDSASignature(
        message: string,
        signature: MLDSASignature,
    ): Promise<boolean> {
        const wallet = this.currentWallet;
        if (!wallet) return false;

        return wallet.controller.verifyMLDSASignature(message, signature);
    }
}

export { WalletController };
