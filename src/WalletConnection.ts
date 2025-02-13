import { Network, networks } from '@btc-vision/bitcoin';
import { Address, Unisat, UnisatChainType, UnisatSigner } from '@btc-vision/transaction';
import { AbstractRpcProvider, JSONRpcProvider } from 'opnet';

export enum SupportedWallets {
    OP_WALLET = 'op_wallet',
    UNISAT = 'unisat',
}
export type Signers = UnisatSigner;
export type Wallets = Unisat;

export class WalletConnection {
    public signer: Signers | null = null; // OP_WALLET doesn't need a signer
    public walletType: SupportedWallets | null = null;
    public walletWindowInstance: Wallets | null = null;

    /**
     * @description Connect to the wallet
     * @param {SupportedWallets} walletType
     * @returns {Promise<void>}
     */
    public async connect(walletType: SupportedWallets): Promise<void> {
        if (this.walletType === walletType) return;
        if (this.walletType) this.disconnect();

        switch (walletType) {
            case SupportedWallets.OP_WALLET: {
                if (window.opnet) {
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
                } else {
                    throw new Error('OP_WALLET not found');
                }
            }
            case SupportedWallets.UNISAT: {
                if (window.unisat) {
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
                } else {
                    throw new Error('Unisat not found');
                }
            }
            default:
                throw new Error('Unsupported wallet');
        }
    }

    /**
     * @description Disconnect from the wallet
     * @returns {void}
     */
    public disconnect(): void {
        if (!this.walletWindowInstance) return;

        if (
            this.walletType === SupportedWallets.OP_WALLET ||
            this.walletType === SupportedWallets.UNISAT
        )
            this.walletWindowInstance.disconnect();

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

        if (
            this.walletType === SupportedWallets.OP_WALLET ||
            this.walletType === SupportedWallets.UNISAT
        ) {
            const publicKey = await this.walletWindowInstance.getPublicKey();

            return Address.fromString(publicKey);
        }

        throw new Error('Unsupported wallet');
    }

    /**
     * @description Get the network of the connected wallet
     * @returns {Promise<Network>}
     */
    public async getNetwork(): Promise<Network> {
        if (!this.walletWindowInstance) throw new Error('Wallet not connected');

        if (
            this.walletType === SupportedWallets.OP_WALLET ||
            this.walletType === SupportedWallets.UNISAT
        ) {
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

        throw new Error('Unsupported wallet');
    }

    /**
     * @description Get the provider of the connected wallet
     * @returns {Promise<AbstractRpcProvider>}
     */
    public async getProvider(): Promise<AbstractRpcProvider> {
        const network = await this.getNetwork();

        switch (network.bech32) {
            case networks.bitcoin.bech32:
                return new JSONRpcProvider('https://api.opnet.org', networks.bitcoin);
            case networks.testnet.bech32:
                return new JSONRpcProvider('https://testnet.opnet.org', networks.testnet);
            case networks.regtest.bech32:
                return new JSONRpcProvider('https://regtest.opnet.org', networks.regtest);
            default:
                throw new Error('Unsupported network');
        }
    }
}

export default WalletConnection;
