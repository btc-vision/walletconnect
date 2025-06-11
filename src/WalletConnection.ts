import { Network, networks } from '@btc-vision/bitcoin';
import {
    Address,
    Unisat,
    UnisatChainType,
    UnisatSigner,
    Xverse,
    XverseSigner,
} from '@btc-vision/transaction';
import { AbstractRpcProvider, JSONRpcProvider } from 'opnet';

export enum SupportedWallets {
    OP_WALLET = 'op_wallet',
    UNISAT = 'unisat',
    XVERSE = 'xverse',
}
export type Signers = UnisatSigner | XverseSigner;
export type Wallets = Unisat | Xverse;

const window = globalThis as typeof globalThis & {
    unisat?: Unisat;
    opnet?: Unisat;
    xverse?: Xverse;
};

export class WalletConnection {
    public signer: Signers | null = null; // OP_WALLET doesn't need a signer
    public walletType: SupportedWallets | null = null;
    public walletWindowInstance: Wallets | null = null;

    private providerCache = new Map<string, AbstractRpcProvider>();

    /**
     * @description Connect to the wallet
     * @param {SupportedWallets} walletType
     * @returns {Promise<void>}
     */
    public async connect(walletType: SupportedWallets): Promise<void> {
        if (this.walletType === walletType) return;
        if (this.walletType) await this.disconnect();

        switch (walletType) {
            case SupportedWallets.OP_WALLET: {
                if (!window.opnet) throw new Error('OP_WALLET not found');

                try {
                    await window.opnet.requestAccounts(); // Trick on OP_WALLET: force the connection popup to appear

                    this.walletType = walletType;
                    this.walletWindowInstance = window.opnet;
                    return;
                } catch (error: unknown) {
                    if (!error) return;

                    if (error instanceof Error) throw new Error(error.message);

                    if (
                        typeof error === 'object' &&
                        'message' in error &&
                        typeof error.message === 'string'
                    )
                        throw new Error(error.message);

                    console.error(error);
                    throw new Error(`Unknown error, check console`);
                }
            }
            case SupportedWallets.UNISAT: {
                if (!window.unisat) throw new Error('Unisat not found');

                try {
                    await window.unisat.requestAccounts(); // Trick on Unisat: force the connection popup to appear

                    const signer = new UnisatSigner();
                    await signer.init();

                    this.signer = signer;
                    this.walletType = walletType;
                    this.walletWindowInstance = window.unisat;
                    return;
                } catch (error: unknown) {
                    if (!error) return;

                    if (error instanceof Error) throw new Error(error.message);

                    if (
                        typeof error === 'object' &&
                        'message' in error &&
                        typeof error.message === 'string'
                    )
                        throw new Error(error.message);

                    console.error(error);
                    throw new Error(`Unknown error, check console`);
                }
            }
            case SupportedWallets.XVERSE: {
                if (!window.xverse) throw new Error('Xverse not found');

                try {
                    const signer = new XverseSigner();
                    await signer.init();

                    this.signer = signer;
                    this.walletType = walletType;
                    this.walletWindowInstance = window.xverse;
                    return;
                } catch (error: unknown) {
                    if (!error) return;

                    if (error instanceof Error) throw new Error(error.message);

                    if (
                        typeof error === 'object' &&
                        'message' in error &&
                        typeof error.message === 'string'
                    )
                        throw new Error(error.message);

                    console.error(error);
                    throw new Error(`Unknown error, check console`);
                }
            }
            default:
                throw new Error('Unsupported wallet');
        }
    }

    /**
     * @description Disconnect from the wallet
     * @returns {Promise<void>}
     */
    public async disconnect(): Promise<void> {
        if (!this.walletWindowInstance) return;

        switch (this.walletType) {
            case SupportedWallets.OP_WALLET:
            case SupportedWallets.UNISAT:
                if ('disconnect' in this.walletWindowInstance) {
                    this.walletWindowInstance.disconnect();
                }
                break;
            case SupportedWallets.XVERSE:
                if ('request' in this.walletWindowInstance) {
                    await this.walletWindowInstance.request('wallet_disconnect', null);
                }
                break;
            default:
                break;
        }

        this.signer = null;
        this.walletType = null;
        this.walletWindowInstance = null;
    }

    /**
     * @description Get the address of the connected wallet
     * @returns {Promise<Address>}
     */
    public async getAddress(): Promise<Address> {
        if (!this.walletWindowInstance) throw new Error('Wallet not connected');

        switch (this.walletType) {
            case SupportedWallets.OP_WALLET:
            case SupportedWallets.UNISAT: {
                if (!('getPublicKey' in this.walletWindowInstance)) {
                    throw new Error('getPublicKey not available on this wallet');
                }

                const publicKey = await this.walletWindowInstance.getPublicKey();
                return Address.fromString(publicKey);
            }
            case SupportedWallets.XVERSE: {
                if (!('request' in this.walletWindowInstance)) {
                    throw new Error('request not available on this wallet');
                }

                const result = await this.walletWindowInstance.request('wallet_getAccount', null);
                if (!result || 'error' in result) {
                    throw new Error('Failed to get account from Xverse');
                }

                const paymentAddress = result.result.addresses.find(
                    (addr) => addr.purpose === 'payment',
                );
                if (!paymentAddress) {
                    throw new Error('Payment address not found in Xverse response');
                }
                return Address.fromString(paymentAddress.publicKey);
            }
            default:
                throw new Error('Unsupported wallet');
        }
    }

    /**
     * @description Get the address typed (P2TR or Native Segwit, etc.) of the connected wallet
     * @returns {Promise<string>}
     */
    public async getAddressTyped(): Promise<string> {
        if (!this.walletWindowInstance) throw new Error('Wallet not connected');

        switch (this.walletType) {
            case SupportedWallets.OP_WALLET:
            case SupportedWallets.UNISAT: {
                if (!('getAccounts' in this.walletWindowInstance)) {
                    throw new Error('getAccounts not available on this wallet');
                }

                const accounts = await this.walletWindowInstance.getAccounts();
                return accounts[0];
            }
            case SupportedWallets.XVERSE: {
                if (!('request' in this.walletWindowInstance)) {
                    throw new Error('request not available on this wallet');
                }

                const result = await this.walletWindowInstance.request('wallet_getAccount', null);
                if (!result || 'error' in result) {
                    throw new Error('Failed to get account from Xverse');
                }

                const paymentAddress = result.result.addresses.find(
                    (addr) => addr.purpose === 'payment',
                );
                if (!paymentAddress) {
                    throw new Error('Payment address not found in Xverse response');
                }

                return paymentAddress.address;
            }
            default:
                throw new Error('Unsupported wallet');
        }
    }

    /**
     * @description Get the network of the connected wallet
     * @returns {Promise<Network>}
     */
    public async getNetwork(): Promise<Network> {
        if (!this.walletWindowInstance) throw new Error('Wallet not connected');

        switch (this.walletType) {
            case SupportedWallets.OP_WALLET:
            case SupportedWallets.UNISAT: {
                if ('getChain' in this.walletWindowInstance) {
                    const chain = await this.walletWindowInstance.getChain();

                    switch (chain.enum) {
                        case UnisatChainType.BITCOIN_MAINNET:
                            return networks.bitcoin;
                        case UnisatChainType.BITCOIN_TESTNET:
                            return networks.testnet;
                        case UnisatChainType.BITCOIN_REGTEST:
                            return networks.regtest;
                        case UnisatChainType.FRACTAL_BITCOIN_MAINNET:
                            return networks.bitcoin;
                        case UnisatChainType.FRACTAL_BITCOIN_TESTNET:
                            return networks.testnet;
                        default:
                            throw new Error('Unsupported network');
                    }
                }
                throw new Error('getChain not available on this wallet');
            }
            case SupportedWallets.XVERSE: {
                // TODO: Also support mainnet for Xverse when available
                return networks.testnet;
            }
            default:
                throw new Error('Unsupported wallet');
        }
    }

    /**
     * @description Get the provider of the connected wallet
     * @returns {Promise<AbstractRpcProvider>}
     */
    public async getProvider(): Promise<AbstractRpcProvider> {
        if (!this.walletWindowInstance) throw new Error('Wallet not connected');

        let cacheKey: string;
        let provider: AbstractRpcProvider;

        switch (this.walletType) {
            case SupportedWallets.OP_WALLET:
            case SupportedWallets.UNISAT: {
                if (!('getChain' in this.walletWindowInstance))
                    throw new Error('getChain not available on this wallet');

                const chain = await this.walletWindowInstance.getChain();
                cacheKey = `${this.walletType}:${chain.enum}`;

                if (this.providerCache.has(cacheKey))
                    return this.providerCache.get(cacheKey) as AbstractRpcProvider;

                switch (chain.enum) {
                    case UnisatChainType.BITCOIN_MAINNET:
                        provider = new JSONRpcProvider('https://api.opnet.org', networks.bitcoin);
                        break;
                    case UnisatChainType.BITCOIN_TESTNET:
                        provider = new JSONRpcProvider(
                            'https://testnet.opnet.org',
                            networks.testnet,
                        );
                        break;
                    case UnisatChainType.BITCOIN_REGTEST:
                        provider = new JSONRpcProvider(
                            'https://regtest.opnet.org',
                            networks.regtest,
                        );
                        break;
                    default:
                        throw new Error('Unsupported network');
                }

                this.providerCache.set(cacheKey, provider);
                return provider;
            }

            case SupportedWallets.XVERSE: {
                cacheKey = `${this.walletType}:TESTNET`;

                if (!this.providerCache.has(cacheKey)) {
                    this.providerCache.set(
                        cacheKey,
                        new JSONRpcProvider('https://testnet.opnet.org', networks.testnet),
                    );
                    // TODO: Also support mainnet for Xverse when available
                }
                return this.providerCache.get(cacheKey) as AbstractRpcProvider;
            }

            default:
                throw new Error('Unsupported wallet');
        }
    }
}

export default WalletConnection;
