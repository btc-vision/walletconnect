import type {
    ControllerConnectAccounts,
    ControllerErrorResponse,
    ControllerResponse,
    WalletConnectWallet
} from './types.ts';
import { _e } from '../utils/accessibility/errorDecoder';
import type { WalletConnectNetwork } from '../types.ts';
import { UnisatChainInfo } from '@btc-vision/transaction';

class WalletController {
    private static wallets: Map<string, WalletConnectWallet> = new Map();
    private static currentWallet: WalletConnectWallet | null = null;

    static getWallets = () => {
        return WalletController.wallets.values().toArray();
    }
    static isWalletInstalled(wallet: string): boolean {
        return this.wallets.get(wallet)?.controller?.isInstalled() || false;
    }

    static getNetwork(): Promise<WalletConnectNetwork> {
        const wallet = this.currentWallet;
        if (!wallet) {
            throw new Error('No wallet connected');
        }
        return wallet.controller.getNetwork();
    }

    static async getPublicKey(): Promise<string | null> {
        const wallet = this.currentWallet;
        if (!wallet) {
            return null;
        }
        return wallet.controller.getPublicKey();
    }

    static async connect(
        walletName: string
    ): Promise<ControllerResponse<ControllerConnectAccounts | ControllerErrorResponse>> {
        const wallet = this.wallets.get(walletName);
        if (!wallet) {
            return {
                code: 404,
                data: {
                    message: _e('Wallet not found')
                }
            };
        }
        try {
            const accounts = await wallet.controller.connect();
            await this.disconnectIfWalletChanged(wallet);
            this.currentWallet = wallet;
            return {
                code: 200,
                data: accounts
            };
        } catch (error) {
            return {
                code: 499,
                data: {
                    message: _e((error as Error)?.message || error as string)
                }
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
        try {
            wallet.controller.removeAccountsChangedHook();
            wallet.controller.setAccountsChangedHook(fn);
        } catch (error) {
            console.error('Error setting accounts changed hook:', error);
        }
    }

    static setDisconnectHook(fn: () => void): void {
        const wallet = this.currentWallet;
        if (!wallet) {
            return;
        }
        try {
            wallet.controller.removeDisconnectHook();
            wallet.controller.setDisconnectHook(fn);
        } catch (error) {
            console.error('Error setting disconnect hook:', error);
        }
    }

    static setChainChangedHook(fn: (chain: UnisatChainInfo) => void): void {
        const wallet = this.currentWallet;
        if (!wallet) {
            console.log('No current wallet to set network switch hook for');
            return;
        }
        try {
            wallet.controller.removeChainChangedHook()
            wallet.controller.setChainChangedHook(fn);
        } catch (error) {
            console.error('Error setting network switch hook:', error);
        }
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
    }

    static unbindHooks(): void {
        this.removeDisconnectHook();
        this.removeChainChangedHook();
        this.removeAccountsChangedHook();
    }
}

export { WalletController };
