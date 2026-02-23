import { networks } from '@btc-vision/bitcoin';
import {
    type MLDSASignature,
    type Unisat,
    type UnisatChainInfo,
    UnisatChainType,
    UnisatSigner,
} from '@btc-vision/transaction';
import { AbstractRpcProvider, JSONRpcProvider } from 'opnet';
import { type WalletBase } from '../types';
import { type UnisatWalletInterface } from './interface';

interface UnisatWalletWindow extends Window {
    unisat?: UnisatWalletInterface;
}

const notInstalledError = 'UNISAT is not installed';

class UnisatWallet implements WalletBase {
    private walletBase: UnisatWalletWindow['unisat'];
    private accountsChangedHookWrapper?: (accounts: Array<string>) => void;
    private chainChangedHookWrapper?: (network: UnisatChainInfo) => void;
    private disconnectHookWrapper?: () => void;
    private _isConnected: boolean = false;

    isInstalled() {
        if (typeof window === 'undefined') {
            return false;
        }
        this.walletBase = (window as unknown as UnisatWalletWindow).unisat;
        return !!this.walletBase;
    }
    isConnected() {
        return !!this.walletBase && this._isConnected;
    }
    async canAutoConnect(): Promise<boolean> {
        // getAccounts returns empty array if not connected,
        // without launching connection modal window.
        const accounts = (await this.walletBase?.getAccounts()) || [];
        return accounts.length > 0;
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
            // TODO: Add Fractal Mainnet & Testnet when available
            default:
                return null;
        }
    }

    async getSigner(): Promise<UnisatSigner> {
        const signer = new UnisatSigner();
        await signer.init();
        return signer;
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
        console.log('Setting account changed hook for Unisat');

        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        this.accountsChangedHookWrapper = (accounts: string[]) => {
            console.log('Unisat Account Changed Hook', accounts, accounts.length);

            if (accounts.length > 0) {
                fn(accounts);
            } else {
                console.log(
                    'Unisat Account Changed Hook --> Disconnect',
                    accounts.length,
                    !!this.disconnectHookWrapper,
                );
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

    setChainChangedHook(fn: (chainType: UnisatChainType) => void): void {
        console.log('Setting chain changed hook for Unisat');
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        this.chainChangedHookWrapper = (chainInfo: UnisatChainInfo) => {
            console.log('Unisat ChainChanged Hook', chainInfo);
            fn(chainInfo.enum);
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

    // Unisat doesn't support MLDSA so these methods return null or false
    getMLDSAPublicKey(): Promise<string | null> {
        return Promise.resolve(null);
    }
    getHashedMLDSAKey(): Promise<string | null> {
        return Promise.resolve(null);
    }
    signMLDSAMessage(_message: string): Promise<MLDSASignature | null> {
        return Promise.resolve(null);
    }
    verifyMLDSASignature(_message: string, _signature: MLDSASignature): Promise<boolean> {
        return Promise.resolve(false);
    }
}

export default UnisatWallet;
