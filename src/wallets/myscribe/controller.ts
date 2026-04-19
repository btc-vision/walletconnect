import { fromHex, networks, sha256, toHex } from '@btc-vision/bitcoin';
import {
    type MLDSASignature,
    type Unisat,
    type UnisatChainInfo,
    UnisatChainType,
} from '@btc-vision/transaction';
import { AbstractRpcProvider, JSONRpcProvider } from 'opnet';
import { type WalletBase } from '../types';
import { type MyScribeWalletInterface } from './interface';

interface MyScribeWindow extends Window {
    myscribe?: MyScribeWalletInterface;
}

const notInstalledError = 'MyScribe Wallet is not installed';

class MyScribeWallet implements WalletBase {
    private walletBase: MyScribeWindow['myscribe'];
    private accountsChangedHookWrapper?: (accounts: Array<string>) => void;
    private chainChangedHookWrapper?: (network: UnisatChainInfo) => void;
    private disconnectHookWrapper?: () => void;
    private _isConnected: boolean = false;

    isInstalled() {
        if (typeof window === 'undefined') {
            return false;
        }
        this.walletBase = (window as unknown as MyScribeWindow).myscribe;
        return !!this.walletBase;
    }
    isConnected() {
        return !!this.walletBase && this._isConnected;
    }
    async canAutoConnect(): Promise<boolean> {
        const accounts = (await this.walletBase?.getAccounts()) || [];
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
            this._isConnected = accounts.length > 0;
            return accounts;
        });
    }

    async disconnect() {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }
        return this._isConnected
            ? await this.walletBase.disconnect().then(() => {
                  this._isConnected = false;
              })
            : undefined;
    }

    getWalletInstance(): Unisat | null {
        return (this._isConnected && this.walletBase) || null;
    }

    public async getProvider(): Promise<AbstractRpcProvider | null> {
        if (!this._isConnected || !this.walletBase) return null;

        const chain = await this.walletBase.getChain();
        switch (chain.enum) {
            case UnisatChainType.BITCOIN_MAINNET:
                return new JSONRpcProvider({
                    url: 'https://mainnet.opnet.org',
                    network: networks.bitcoin,
                });
            case UnisatChainType.OPNET_TESTNET:
                return new JSONRpcProvider({
                    url: 'https://testnet.opnet.org',
                    network: networks.opnetTestnet,
                });
            case UnisatChainType.BITCOIN_REGTEST:
                return new JSONRpcProvider({
                    url: 'https://regtest.opnet.org',
                    network: networks.regtest,
                });
            default:
                return null;
        }
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

    async getNetwork(): Promise<UnisatChainType> {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        const chainInfo = await this.walletBase.getChain();
        if (!chainInfo) {
            throw new Error('Failed to retrieve chain information');
        }

        return chainInfo.enum;
    }

    setAccountsChangedHook(fn: (accounts: string[]) => void): void {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        this.accountsChangedHookWrapper = (accounts: string[]) => {
            if (accounts.length > 0) {
                fn(accounts);
            } else {
                this._isConnected = false;
                this.disconnectHookWrapper?.();
            }
        };

        this.walletBase.on('accountsChanged', this.accountsChangedHookWrapper);
    }

    removeAccountsChangedHook(): void {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        if (this.accountsChangedHookWrapper) {
            this.walletBase.removeListener('accountsChanged', this.accountsChangedHookWrapper);
            this.accountsChangedHookWrapper = undefined;
        }
    }

    setDisconnectHook(fn: () => void): void {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        this.disconnectHookWrapper = () => {
            fn();
        };

        this.walletBase.on('disconnect', this.disconnectHookWrapper);
    }

    removeDisconnectHook(): void {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        if (this.disconnectHookWrapper) {
            this.walletBase.removeListener('disconnect', this.disconnectHookWrapper);
            this.disconnectHookWrapper = undefined;
        }
    }

    setChainChangedHook(fn: (chainType: UnisatChainType) => void): void {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        this.chainChangedHookWrapper = (chainInfo: UnisatChainInfo) => {
            fn(chainInfo.enum);
        };

        this.walletBase.on('chainChanged', this.chainChangedHookWrapper);
    }

    removeChainChangedHook(): void {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        if (this.chainChangedHookWrapper) {
            this.walletBase.removeListener('chainChanged', this.chainChangedHookWrapper);
            this.chainChangedHookWrapper = undefined;
        }
    }

    async getMLDSAPublicKey(): Promise<string | null> {
        if (!this._isConnected || !this.walletBase?.web3) return null;

        return this.walletBase.web3.getMLDSAPublicKey();
    }

    async getHashedMLDSAKey(): Promise<string | null> {
        const mldsaPublicKey = await this.getMLDSAPublicKey();
        if (!mldsaPublicKey) return null;

        const publicKeyBytes = fromHex(mldsaPublicKey);
        const hash = sha256(publicKeyBytes);
        return toHex(hash);
    }

    async signMLDSAMessage(message: string): Promise<MLDSASignature | null> {
        if (!this._isConnected || !this.walletBase?.web3) return null;

        return this.walletBase.web3.signMLDSAMessage(message);
    }

    async verifyMLDSASignature(message: string, signature: MLDSASignature): Promise<boolean> {
        if (!this._isConnected || !this.walletBase?.web3) return false;

        return this.walletBase.web3.verifyMLDSASignature(message, signature);
    }
}

export default MyScribeWallet;
