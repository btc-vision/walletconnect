import { Network, networks } from '@btc-vision/bitcoin';
import { Address, Unisat, UnisatChainType, UnisatSigner } from '@btc-vision/transaction';
import { JSONRpcProvider } from 'opnet';

export enum SupportedWallets {
    OP_WALLET = 'op_wallet',
}
export type Signers = UnisatSigner;
export type Wallets = Unisat;

export class WalletConnection {
    public signer: Signers | null = null;

    /**
     * @description Connect to the wallet
     * @param {SupportedWallets} walletType
     * @returns {Promise<void>}
     */
    public async connect(walletType: SupportedWallets): Promise<void> {
        // TODO: When more wallets are supported, make them disconnect before connecting to the new one
        switch (walletType) {
            case SupportedWallets.OP_WALLET:
                if (this.signer instanceof UnisatSigner) return;

                if (window.opnet || window.unisat) {
                    try {
                        const signer = new UnisatSigner();
                        await signer.init();

                        this.signer = signer;
                        return;
                    } catch (error: unknown) {
                        if (error instanceof Error) throw new Error(error.message);

                        throw new Error(`Unknown error: ${error}`);
                    }
                } else {
                    throw new Error('OP Wallet not found');
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
        if (!this.signer) throw new Error('Wallet not connected');

        if (this.signer instanceof UnisatSigner) this.signer.unisat.disconnect();

        this.signer = null;
    }

    /**
     * @description Get the address of the connected wallet
     * @returns {Address}
     */
    public async getAddress(): Promise<Address> {
        if (!this.signer) throw new Error('Wallet not connected');

        if (this.signer instanceof UnisatSigner) {
            const publicKey = await this.signer.unisat.getPublicKey();

            return Address.fromString(publicKey);
        }

        throw new Error('Unsupported wallet');
    }

    /**
     * @description Get the network of the connected wallet
     * @returns {Network}
     */
    public async getNetwork(): Promise<Network> {
        if (!this.signer) throw new Error('Wallet not connected');

        if (this.signer instanceof UnisatSigner) {
            const chain = await this.signer.unisat.getChain();

            // TODO: Add Fractal network
            switch (chain.enum) {
                case UnisatChainType.BITCOIN_MAINNET:
                    return networks.bitcoin;
                case UnisatChainType.BITCOIN_TESTNET:
                    return networks.testnet;
                case UnisatChainType.BITCOIN_REGTEST:
                    return networks.regtest;
                default:
                    throw new Error('Unsupported network');
            }
        }

        throw new Error('Unsupported wallet');
    }

    /**
     * @description Get the provider of the connected wallet
     * @returns {JSONRpcProvider}
     */
    public async getProvider(): Promise<JSONRpcProvider> {
        if (!this.signer) throw new Error('Wallet not connected');

        if (this.signer instanceof UnisatSigner) {
            const network = await this.getNetwork();

            // TODO: Add Fractal network
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

        throw new Error('Unsupported wallet');
    }
}

export default WalletConnection;
