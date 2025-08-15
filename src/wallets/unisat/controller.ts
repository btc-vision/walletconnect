import type { WalletBase } from '../types.ts';
import type { UnisatWalletInterface } from './interface';
import { UnisatChainInfo } from '@btc-vision/transaction';
import type { WalletConnectNetwork } from '../../types.ts';

interface UnisatWalletWindow extends Window {
    unisat?: UnisatWalletInterface;
}

const notInstalledError = 'UNISAT is not installed';

class UnisatWallet implements WalletBase {
    private walletBase: UnisatWalletWindow['unisat'];
    private accountsChangedHookWrapper?: (accounts: Array<string>) => void;
    private disconnectHookWrapper?: () => void;
    private chainChangedHookWrapper?: (network: UnisatChainInfo) => void;
    private _isConnected: boolean = false;

    isInstalled() {
        this.walletBase = (window as unknown as UnisatWalletWindow).unisat;
        return !!this.walletBase;
    }
    isConnected() {
        return !!this.walletBase && this._isConnected;
    }

    getChainId(): void {
        throw new Error('Method not implemented.');
    }

    async connect(): Promise<string[]> {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }
        return this.walletBase.requestAccounts().then((accounts: string[]) => {
            this._isConnected = accounts.length > 0
            return accounts
        });
    }

    async disconnect() {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }
        return this._isConnected ? await this.walletBase.disconnect().then(() => {
            this._isConnected = false;
        }) : undefined;
    }

    getPublicKey(): Promise<string> {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }
        return this.walletBase.getPublicKey();
    }

    async getNetwork(): Promise<WalletConnectNetwork> {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        const chainInfo = await this.walletBase.getChain();
        if (!chainInfo) {
            throw new Error('Failed to retrieve chain information');
        }

        return {
            network: chainInfo.network,
            chainType: chainInfo.enum
        };
    }

    setAccountsChangedHook(fn: (accounts: string[]) => void): void {
        console.log('Setting account changed hook for Unisat');

        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        this.accountsChangedHookWrapper = (accounts: string[]) => {
            console.log('Unisat Account Changed Hook', accounts, accounts.length);

            if (accounts.length > 0) {
                fn(accounts);
            } else {
                console.log('Unisat Account Changed Hook --> Disconnect', accounts.length, !!this.disconnectHookWrapper);
                this._isConnected = false;
                this.disconnectHookWrapper?.()
            }
        };

        this.walletBase.on('accountsChanged', this.accountsChangedHookWrapper);
    }

    removeAccountsChangedHook(): void {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        if (this.accountsChangedHookWrapper) {
            console.log('Removing account changed hook for Unisat');
            this.walletBase.removeListener('accountsChanged', this.accountsChangedHookWrapper);
            this.accountsChangedHookWrapper = undefined;
        }
    }

    setDisconnectHook(fn: () => void): void {
        console.log('Setting disconnect hook for Unisat');

        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        this.disconnectHookWrapper = () => {
            console.log('Unisat Disconnecting Hook');
            fn();
        };

        this.walletBase.on('disconnect', this.disconnectHookWrapper);
    }

    removeDisconnectHook(): void {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        if (this.disconnectHookWrapper) {
            console.log('Removing disconnect hook for Unisat');
            this.walletBase.removeListener('disconnect', this.disconnectHookWrapper);
            this.disconnectHookWrapper = undefined;
        }
    }

    setChainChangedHook(fn: (network: UnisatChainInfo) => void): void {
        console.log('Setting chain changed hook for Unisat');
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        this.chainChangedHookWrapper = (network: UnisatChainInfo) => {
            console.log('Unisat ChainChanged Hook', network);
            fn(network);
        };

        this.walletBase.on('chainChanged', this.chainChangedHookWrapper);
    }

    removeChainChangedHook(): void {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        if (this.chainChangedHookWrapper) {
            console.log('Removing chain changed hook for Unisat');
            this.walletBase.removeListener('chainChanged', this.chainChangedHookWrapper);
            this.chainChangedHookWrapper = undefined;
        }
    }
}

export default UnisatWallet;
