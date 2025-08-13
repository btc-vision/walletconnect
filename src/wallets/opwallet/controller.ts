import type { WalletBase } from '../types.ts';
import type { OPWalletInterface } from './interface.ts';
import type { UnisatChainInfo } from '@btc-vision/transaction';
import type { WalletConnectNetwork } from '../../types.ts';

interface OPWalletWindow extends Window {
    opnet?: OPWalletInterface;
}

const notInstalledError = 'OP_WALLET is not installed';

class OPWallet implements WalletBase {
    private walletBase: OPWalletWindow['opnet'];
    private disconnectHookWrapper?: () => void;
    private chainChangedHookWrapper?: (network: UnisatChainInfo) => void;

    private networkChangedHookWrapper?: (network: UnisatChainInfo) => void;

    isInstalled() {
        this.walletBase = (window as unknown as OPWalletWindow).opnet;
        return !!this.walletBase;
    }

    getChainId(): void {
        throw new Error('Method not implemented.');
    }

    async connect(): Promise<string[]> {
        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }
        return this.walletBase?.requestAccounts() || [];
    }

    async disconnect() {
        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }
        return await this.walletBase?.disconnect();
    }

    getPublicKey(): Promise<string> | undefined {
        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }
        return this.walletBase?.getPublicKey();
    }

    async getNetwork(): Promise<WalletConnectNetwork> {
        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }
        const chainInfo = await this.walletBase?.getChain();

        if (!chainInfo) {
            throw new Error('Failed to retrieve chain information');
        }

        return {
            network: chainInfo.network,
            chainType: chainInfo.enum
        };
    }

    setDisconnectHook(fn: () => void): void {
        console.log('Setting disconnect hook for OPWallet');

        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }

        this.disconnectHookWrapper = () => {
            fn();
        };

        this.walletBase?.on('disconnect', this.disconnectHookWrapper);
    }

    removeDisconnectHook(): void {
        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }

        if (this.disconnectHookWrapper) {
            this.walletBase?.removeListener('disconnect', this.disconnectHookWrapper);
            this.disconnectHookWrapper = undefined;
        }
    }

    setChainChangedHook(fn: (network: UnisatChainInfo) => void): void {
        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }

        this.chainChangedHookWrapper = (network: UnisatChainInfo) => {
            fn(network);
        };

        this.walletBase?.on('chainChanged', (e) => this.chainChangedHookWrapper?.(e));
    }

    removeChainChangedHook(): void {
        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }

        if (this.chainChangedHookWrapper) {
            this.walletBase?.removeListener('chainChanged', this.chainChangedHookWrapper);
            this.chainChangedHookWrapper = undefined;
        }
    }

    setNetworkChangedHook(fn: (network: WalletConnectNetwork) => void): void {
        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }

        this.networkChangedHookWrapper = (network: unknown) => {
            fn(network as WalletConnectNetwork);
        };

        this.walletBase?.on('networkChanged', (e) => this.networkChangedHookWrapper?.(e));
    }

    removeNetworkChangedHook(): void {
        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }

        if (this.networkChangedHookWrapper) {
            this.walletBase?.removeListener('networkChanged', this.networkChangedHookWrapper);
            this.networkChangedHookWrapper = undefined;
        }
    }
}

export default OPWallet;
