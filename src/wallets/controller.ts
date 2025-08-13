import type {
    ControllerConnectAccounts,
    ControllerErrorResponse,
    ControllerResponse,
    WalletConnectWallet
} from './types.ts';
import { _e } from '../utils/accessibility/errorDecoder.ts';
import type { WalletConnectNetwork } from '../types.ts';

class WalletController {
    private static wallets: WalletConnectWallet[] = [];
    private static currentWallet: WalletConnectWallet | null = null;

    static getWallets(): WalletConnectWallet[] {
        if (!this.wallets || this.wallets.length === 0) {
            return [];
        }
        return this.wallets;
    }

    static getNetwork(): Promise<WalletConnectNetwork> {
        const wallet = this.currentWallet;
        if (!wallet) {
            throw new Error('No wallet connected');
        }
        return wallet.controller.getNetwork();
    }

    static async getPublicKey(): Promise<string | undefined> {
        const wallet = this.currentWallet;
        if (!wallet) {
            return;
        }
        return wallet.controller.getPublicKey();
    }

    static async connect(
        walletName: string
    ): Promise<ControllerResponse<ControllerConnectAccounts | ControllerErrorResponse>> {
        const wallet = this.wallets.find((w) => w.name === walletName);
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
            this.currentWallet = wallet;
            return {
                code: 200,
                data: accounts
            };
        } catch (error) {
            return {
                code: 499,
                data: {
                    message: _e(error as string)
                }
            };
        }
    }

    static async disconnect(): Promise<void> {
        const wallet = this.currentWallet;
        if (!wallet) {
            throw new Error('Not connected to any wallet');
        }
        await wallet.controller.disconnect();
    }

    static setDisconnectHook(fn: () => void): void {
        const wallet = this.currentWallet;
        if (!wallet) {
            return;
        }
        try {
            wallet.controller.setDisconnectHook(fn);
        } catch (error) {
            console.error('Error setting disconnect hook:', error);
        }
    }

    static setNetworkChangeHook(fn: (network: WalletConnectNetwork) => void): void {
        const wallet = this.currentWallet;
        if (!wallet) {
            console.log('No current wallet to set network switch hook for');
            return;
        }
        try {
            wallet.controller.setNetworkChangedHook(fn);
        } catch (error) {
            console.error('Error setting network switch hook:', error);
        }
    }

    static setChainChangedHook(fn: (chain: unknown) => void): void {
        const wallet = this.currentWallet;
        if (!wallet) {
            console.log('No current wallet to set network switch hook for');
            return;
        }
        try {
            wallet.controller.setChainChangedHook(fn);
        } catch (error) {
            console.error('Error setting network switch hook:', error);
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

    static removeNetworkChangeHook(): void {
        const wallet = this.currentWallet;
        if (!wallet) {
            console.log('No current wallet to remove network change hook from');
            return;
        }
        try {
            wallet.controller.removeNetworkChangedHook();
        } catch (error) {
            console.error('Error removing network change hook:', error);
        }
    }

    static registerWallet(wallet: WalletConnectWallet): void {
        if (!this.wallets) {
            this.wallets = [];
        }
        if (!this.wallets.some((w) => w.name === wallet.name)) {
            this.wallets.push(wallet);
        }
    }

    static unbindHooks(): void {
        this.removeDisconnectHook();
        this.removeChainChangedHook();
        this.removeNetworkChangeHook();
    }
}

export { WalletController };
