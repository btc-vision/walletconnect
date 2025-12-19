import { networks } from '@btc-vision/bitcoin';
import {
    MessageSigner,
    MessageType,
    type MLDSASignature,
    type UnisatChainInfo,
    UnisatChainType,
} from '@btc-vision/transaction';
import { AbstractRpcProvider, JSONRpcProvider } from 'opnet';
import { type WalletBase } from '../types';
import { type OPWallet } from './interface';
import { type WalletBalance, WalletNetwork } from '../../types';

interface OPWalletWindow extends Window {
    opnet?: OPWallet;
}

const notInstalledError = 'OP_WALLET is not installed';

class OPWalletInstance implements WalletBase {
    private walletBase: OPWalletWindow['opnet'];
    private accountsChangedHookWrapper?: (accounts: Array<string>) => void;
    private chainChangedHookWrapper?: (network: UnisatChainInfo) => void;
    private disconnectHookWrapper?: () => void;
    private _isConnected: boolean = false;

    isInstalled() {
        if (typeof window === 'undefined') {
            return false;
        }
        this.walletBase = (window as unknown as OPWalletWindow).opnet;
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

    getWalletInstance(): OPWallet | null {
        return (this._isConnected && this.walletBase) || null;
    }

    public async getProvider(): Promise<AbstractRpcProvider | null> {
        if (!this._isConnected || !this.walletBase) return null;

        const chain = await this.walletBase.getChain();
        switch (chain.enum) {
            case UnisatChainType.BITCOIN_MAINNET:
                return new JSONRpcProvider('https://mainnet.opnet.org', networks.bitcoin);
            case UnisatChainType.BITCOIN_TESTNET:
                return new JSONRpcProvider('https://testnet.opnet.org', networks.testnet);
            case UnisatChainType.BITCOIN_REGTEST:
                return new JSONRpcProvider('https://regtest.opnet.org', networks.regtest);
            // TODO: Add Fractal Mainnet & Testnet when available
            default:
                return null;
        }
    }

    async getSigner(): Promise<null> {
        return Promise.resolve(null);
    }

    async getPublicKey(): Promise<string> {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }
        return this.walletBase.getPublicKey();
    }

    async getBalance(): Promise<WalletBalance | null> {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }
        return (await this.walletBase.getBalance()) as WalletBalance | null;
    }

    async getNetwork(): Promise<WalletNetwork> {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        const chainInfo = await this.walletBase.getChain();
        if (!chainInfo) {
            throw new Error('Failed to retrieve chain information');
        }

        return this.unisatChainToWalletNetwork(chainInfo.enum);
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
                console.log(
                    'OPWallet Account Changed Hook --> Disconnect',
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

    setChainChangedHook(fn: (chainType: WalletNetwork) => void): void {
        console.log('Setting chain changed hook for OPWallet');
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        this.chainChangedHookWrapper = (chainInfo: UnisatChainInfo) => {
            console.log('OPWallet ChainChanged Hook', chainInfo);
            fn(this.unisatChainToWalletNetwork(chainInfo.enum));
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

    async getMLDSAPublicKey(): Promise<string | null> {
        if (!this._isConnected || !this.walletBase?.web3) return null;

        return this.walletBase.web3.getMLDSAPublicKey();
    }

    async getHashedMLDSAKey(): Promise<string | null> {
        const mldsaPublicKey = await this.getMLDSAPublicKey();
        if (!mldsaPublicKey) return null;

        const publicKeyBuffer = Buffer.from(mldsaPublicKey, 'hex');
        const hash = MessageSigner.sha256(publicKeyBuffer);
        return hash.toString('hex');
    }

    unisatChainToWalletNetwork = (chainType: UnisatChainType): WalletNetwork => {
        switch (chainType) {
            case UnisatChainType.BITCOIN_MAINNET: return WalletNetwork.BITCOIN_MAINNET;
            case UnisatChainType.BITCOIN_TESTNET: return WalletNetwork.BITCOIN_TESTNET;
            case UnisatChainType.BITCOIN_REGTEST: return WalletNetwork.BITCOIN_REGTEST;
            case UnisatChainType.BITCOIN_TESTNET4: return WalletNetwork.BITCOIN_TESTNET4;
            case UnisatChainType.FRACTAL_BITCOIN_MAINNET: return WalletNetwork.FRACTAL_BITCOIN_MAINNET;
            case UnisatChainType.FRACTAL_BITCOIN_TESTNET: return WalletNetwork.FRACTAL_BITCOIN_TESTNET;
            case UnisatChainType.BITCOIN_SIGNET: return WalletNetwork.BITCOIN_SIGNET;
            default: return WalletNetwork.BITCOIN_REGTEST;
        }
    }

    walletNetworkToUnisatChain = (network: WalletNetwork): UnisatChainType => {
        switch (network) {
            case 'BITCOIN_MAINNET': return UnisatChainType.BITCOIN_MAINNET;
            case 'BITCOIN_TESTNET': return UnisatChainType.BITCOIN_TESTNET;
            case 'BITCOIN_REGTEST': return UnisatChainType.BITCOIN_REGTEST;
            case 'BITCOIN_TESTNET4': return UnisatChainType.BITCOIN_TESTNET4;
            case 'FRACTAL_BITCOIN_MAINNET': return UnisatChainType.FRACTAL_BITCOIN_MAINNET;
            case 'FRACTAL_BITCOIN_TESTNET': return UnisatChainType.FRACTAL_BITCOIN_TESTNET;
            case 'BITCOIN_SIGNET': return UnisatChainType.BITCOIN_SIGNET;
            default: return UnisatChainType.BITCOIN_REGTEST;
        }
    }

    async switchNetwork(network: WalletNetwork): Promise<void> {
        if (!this._isConnected || !this.walletBase) return;

        const unisatChainType = this.walletNetworkToUnisatChain(network)
        await this.walletBase.switchChain(unisatChainType);
    }

    async signMessage(message: string, messageType?: MessageType): Promise<string | null> {
        if (!this._isConnected || !this.walletBase) return null;

        return this.walletBase.signMessage(message, messageType);
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

export default OPWalletInstance;
