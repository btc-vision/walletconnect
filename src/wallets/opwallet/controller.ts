import type { WalletBase } from '../types.ts';
import type { OPWalletInterface } from './interface';
import { Unisat, UnisatChainInfo } from '@btc-vision/transaction';
import type { WalletConnectNetwork } from '../../types.ts';

interface OPWalletWindow extends Window {
    opnet?: OPWalletInterface;
}

const notInstalledError = 'OP_WALLET is not installed';

class OPWallet implements WalletBase {
    private walletBase: OPWalletWindow['opnet'];
    private accountsChangedHookWrapper?: (accounts: Array<string>) => void;
    private chainChangedHookWrapper?: (network: UnisatChainInfo) => void;
    private disconnectHookWrapper?: () => void;
    private _isConnected: boolean = false;

    isInstalled() {
        this.walletBase = (window as unknown as OPWalletWindow).opnet;
        return !!this.walletBase;
    }
    isConnected() {
        return !!this.walletBase && this._isConnected;
    }
    async canAutoConnect(): Promise<boolean> {
        // getAccounts returns empty array if not connected,
        // without launching connection modal window.
        const accounts = await this.walletBase?.getAccounts() || []
        return accounts.length > 0;
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

    getProvider(): Unisat | null {
        return this._isConnected && this.walletBase || null;
    }

    async getSigner(): Promise<null> {
        return Promise.resolve(null);
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
        console.log('Setting account changed hook for OPWallet');

        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        this.accountsChangedHookWrapper = (accounts: string[]) => {
            console.log('OPWallet Account Changed Hook', accounts, accounts.length);

            if (accounts.length > 0) {
                fn(accounts);
            } else {
                console.log('OPWallet Account Changed Hook --> Disconnect', accounts.length, !!this.disconnectHookWrapper);
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
            console.log('Removing account changed hook for OPWallet');
            this.walletBase.removeListener('accountsChanged', this.accountsChangedHookWrapper);
            this.accountsChangedHookWrapper = undefined;
        }
    }

    setDisconnectHook(fn: () => void): void {
        console.log('Setting disconnect hook for OPWallet');

        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        this.disconnectHookWrapper = () => {
            console.log('OPWallet Disconnecting Hook');
            fn();
        };

        this.walletBase.on('disconnect', this.disconnectHookWrapper);
    }

    removeDisconnectHook(): void {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        if (this.disconnectHookWrapper) {
            console.log('Removing disconnect hook for OPWallet');
            this.walletBase.removeListener('disconnect', this.disconnectHookWrapper);
            this.disconnectHookWrapper = undefined;
        }
    }

    setChainChangedHook(fn: (network: WalletConnectNetwork) => void): void {
        console.log('Setting chain changed hook for OPWallet');
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        this.chainChangedHookWrapper = (network: UnisatChainInfo) => {
            console.log('OPWallet ChainChanged Hook', network);
            fn({
                chainType: network.enum,
                network: network.network,
            });
        };

        this.walletBase.on('chainChanged', this.chainChangedHookWrapper);
    }

    removeChainChangedHook(): void {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        if (this.chainChangedHookWrapper) {
            console.log('Removing chain changed hook for OPWallet');
            this.walletBase.removeListener('chainChanged', this.chainChangedHookWrapper);
            this.chainChangedHookWrapper = undefined;
        }
    }
}

export default OPWallet;
