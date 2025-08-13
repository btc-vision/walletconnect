import type { WalletBase } from '../types.ts';
import type { UnisatWalletInterface } from './interface';
import type { UnisatChainInfo } from '@btc-vision/transaction';
import type { WalletConnectNetwork } from '../../types.ts';

interface UnisatWalletWindow extends Window {
    unisat?: UnisatWalletInterface;
}

const notInstalledError = 'UNISAT is not installed';

class UniSatWallet implements WalletBase {
    private walletBase: UnisatWalletWindow['unisat'];
    private disconnectHookWrapper?: () => void;
    private chainChangedHookWrapper?: (network: UnisatChainInfo) => void;
    private networkChangedHookWrapper?: (network: UnisatChainInfo) => void;

    isInstalled() {
        this.walletBase = (window as unknown as UnisatWalletWindow).unisat;
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
        console.log('Setting disconnect hook for Unisat');

        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }

        this.disconnectHookWrapper = () => {
            console.log('Unisat Disconnected Hook');
            fn();
        };

        this.walletBase?.on('disconnect', this.disconnectHookWrapper);
    }

    removeDisconnectHook(): void {
        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }

        if (this.disconnectHookWrapper) {
            console.log('Removing disconnect hook for Unisat');
            this.walletBase?.removeListener('disconnect', this.disconnectHookWrapper);
            this.disconnectHookWrapper = undefined;
        }
    }

    setChainChangedHook(fn: (network: UnisatChainInfo) => void): void {
        console.log('Setting chain changed hook for Unisat');
        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }

        this.chainChangedHookWrapper = (network: UnisatChainInfo) => {
            console.log('Unisat ChainChanged Hook', network as UnisatChainInfo);
            fn(network);
        };

        this.walletBase?.on('chainChanged', this.chainChangedHookWrapper);
    }

    removeChainChangedHook(): void {
        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }

        if (this.chainChangedHookWrapper) {
            console.log('Removing chain changed hook for Unisat');
            this.walletBase?.removeListener('chainChanged', this.chainChangedHookWrapper);
            this.chainChangedHookWrapper = undefined;
        }
    }

    setNetworkChangedHook(fn: (network: WalletConnectNetwork) => void): void {
        console.log('Setting network changed hook for Unisat');
        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }

        this.networkChangedHookWrapper = (network: UnisatChainInfo) => {
            console.log('Unisat NetworkChanged Hook', network);
            fn(network as unknown as WalletConnectNetwork);
        };

        this.walletBase?.on('networkChanged', this.networkChangedHookWrapper);
    }

    removeNetworkChangedHook(): void {
        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }

        if (this.networkChangedHookWrapper) {
            console.log('Removing network changed hook for Unisat');
            this.walletBase?.removeListener('networkChanged', this.networkChangedHookWrapper);
            this.networkChangedHookWrapper = undefined;
        }
    }
}

export default UniSatWallet;
