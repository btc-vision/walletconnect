import type { WalletBase } from '../types.ts';
import type { TestWalletInterface } from './interface.ts';
import type { Unisat, UnisatChainInfo } from '@btc-vision/transaction';
import type { WalletConnectNetwork } from '../../types.ts';

interface TestWalletWindow extends Window {
    test?: TestWalletInterface;
}

const notInstalledError = 'TEST is not installed';

class TestWallet implements WalletBase {
    private walletBase: TestWalletWindow['test'];
    private accountsChangedHookWrapper?: (accounts: Array<string>) => void;
    private chainChangedHookWrapper?: (network: UnisatChainInfo) => void;
    private disconnectHookWrapper?: () => void;

    isInstalled() {
        this.walletBase = (window as unknown as TestWalletWindow).test;
        return !!this.walletBase;
    }
    isConnected() {
        return false;
    }

    getProvider(): Unisat | null {
        return this.walletBase || null;
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

    getPublicKey(): Promise<string> {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }
        return this.walletBase.getPublicKey();
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

    setAccountsChangedHook(fn: (accounts: string[]) => void): void {
        console.log('Setting account changed hook for OPWallet');

        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }

        this.accountsChangedHookWrapper = (accounts: string[]) => {
            console.log('OPWallet Account Changed Hook', accounts);
            fn(accounts);
        };

        this.walletBase?.on('accountsChanged', this.accountsChangedHookWrapper);
    }

    removeAccountsChangedHook(): void {
        if (!this.isInstalled()) {
            throw new Error(notInstalledError);
        }

        if (this.accountsChangedHookWrapper) {
            console.log('Removing account changed hook for OPWallet');
            this.walletBase?.removeListener('accountsChanged', this.accountsChangedHookWrapper);
            this.accountsChangedHookWrapper = undefined;
        }
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
}

export default TestWallet;
