import type { WalletBase } from '../types.ts';
import type {
    XverseAccountChangeEvent, XverseAddress,
    XverseBitcoinProvider, XverseNetworkChangeEvent,
    XverseResponse, XverseResult,
    XverseWalletInterface,
} from './interface';
import { Unisat, UnisatChainType, UnisatNetwork } from '@btc-vision/transaction';
import type { WalletConnectNetwork } from '../../types.ts';
import { XverseProvider } from './provider';

interface XverseWalletWindow extends Window {
    XverseProviders?: XverseWalletInterface;
}

const notInstalledError = 'OP_WALLET is not installed';

class XverseWallet implements WalletBase {
    private walletBase: XverseBitcoinProvider | null = null;
    private accountsChangedHookWrapper?: () => void;
    private chainChangedHookWrapper?: () => void;
    private disconnectHookWrapper?: () => void;
    private _isConnected: boolean = false;

    isInstalled() {
        this.walletBase = (window as unknown as XverseWalletWindow).XverseProviders?.BitcoinProvider || null;
        return !!this.walletBase;
    }
    isConnected() {
        return !!this.walletBase && this._isConnected;
    }
    async canAutoConnect(): Promise<boolean> {
        const request_params = { purposes: ['payment'] };
        return await this.walletBase?.request("getAddresses", request_params).then(response => {
            return !!response.result
        }) || false
    }

    getChainId(): void {
        throw new Error('Method not implemented.');
    }

    async connect(): Promise<string[]> {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        const connect_params = { addresses: ['payment'], message: 'test' }
        const permission: XverseResponse = await this.walletBase.request('wallet_connect', connect_params);
        if (permission.error) throw new Error(permission.error.message)

        console.log("Xverse", permission)
        const xWallet = this.getxWallet(permission.result);
        if (!xWallet) {
            throw new Error('No Xverse wallet address found.');
        }

        this._isConnected = true;
        return [xWallet.address]
    }

    async disconnect() {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }
        return this._isConnected ? await this.walletBase.request("wallet_disconnect").then(() => {
            this._isConnected = false;
        }) : undefined;
    }

    getProvider(): Unisat | null {
        return this._isConnected && this.walletBase && new XverseProvider(this.walletBase) || null;
    }

    async getPublicKey(): Promise<string> {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        const request_params = { purposes: ['payment'] };
        return this.walletBase.request("getAddresses", request_params).then(response => {
            console.log("getPublicKey", response);
            const xWallet = this.getxWallet(response.result)
            return xWallet?.publicKey || '';
        });
    }

    getxWallet(result: XverseResult|XverseAccountChangeEvent|undefined): XverseAddress | undefined {
        return (result?.addresses??[]).find(
            (address) => address.purpose === "payment"
        );
    }

    getChainName(name: string) {
        switch (name.toLocaleLowerCase()) {
            case 'testnet': return UnisatChainType.BITCOIN_TESTNET;
            case 'regtest': return UnisatChainType.BITCOIN_REGTEST;
            case 'testnet4': return UnisatChainType.BITCOIN_TESTNET4;
            case 'signet': return UnisatChainType.BITCOIN_SIGNET;
            case 'mainnet': return UnisatChainType.BITCOIN_MAINNET;
        }
        return UnisatChainType.BITCOIN_MAINNET;
    }

    async getNetwork(): Promise<WalletConnectNetwork> {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        const request_params = { purposes: ['payment'] };
        return this.walletBase.request("getAddresses", request_params).then(response => {
            console.log("getNetwork", response)
            const name = response.result?.network?.bitcoin?.name || ''

            return {
                network: name.toLocaleLowerCase(),
                chainType: this.getChainName(name),
            }
        });
    }

    setAccountsChangedHook(fn: (accounts: string[], forceConnect?: boolean) => void): void {
        console.log('Setting account changed hook for Xverse');

        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        const callback = (addresses: XverseAccountChangeEvent) => {
            const xWallet = this.getxWallet(addresses)
            console.log('Xverse Account Changed Hook', addresses);
            console.log('Xverse Account Changed Hook', xWallet);

            if (xWallet) {
                fn([xWallet.address]);
            }
            else {
                fn([], true)
            }
            //    console.log('Xverse Account Changed Hook --> Disconnect');
            //    this._isConnected = false;
            //    this.disconnectHookWrapper?.()
            //}
        };

        this.accountsChangedHookWrapper = this.walletBase.addListener('accountChange', callback);
    }

    removeAccountsChangedHook(): void {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        if (this.accountsChangedHookWrapper) {
            console.log('Removing account changed hook for Xverse');
            this.accountsChangedHookWrapper();
            this.accountsChangedHookWrapper = undefined;
        }
    }

    setDisconnectHook(fn: () => void): void {
        console.log('Setting disconnect hook for Xverse');

        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        const callback = () => {
            console.log('Xverse Disconnecting Hook');
            fn();
        };

        this.disconnectHookWrapper = this.walletBase.addListener('disconnect', callback);
    }

    removeDisconnectHook(): void {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        if (this.disconnectHookWrapper) {
            console.log('Removing disconnect hook for Xverse');
            this.disconnectHookWrapper();
            this.disconnectHookWrapper = undefined;
        }
    }

    setChainChangedHook(fn: (network: WalletConnectNetwork, forceConnect?:boolean) => void): void {
        console.log('Setting chain changed hook for Xverse');
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        const callback = (network: XverseNetworkChangeEvent) => {
            console.log('Xverse ChainChanged Hook', network);
            const name = network?.bitcoin?.name?.toLocaleLowerCase() || ''
            const addresses = network?.addresses || []
            fn({
                chainType: this.getChainName(name),
                network: name.toLocaleLowerCase() as UnisatNetwork,
            }, addresses.length > 0)
        };

        this.chainChangedHookWrapper = this.walletBase.addListener('networkChange', callback);
    }

    removeChainChangedHook(): void {
        if (!this.isInstalled() || !this.walletBase) {
            throw new Error(notInstalledError);
        }

        if (this.chainChangedHookWrapper) {
            console.log('Removing chain changed hook for Xverse');
            this.chainChangedHookWrapper();
            this.chainChangedHookWrapper = undefined;
        }
    }
}

export default XverseWallet;
