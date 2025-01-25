import { Network, networks } from '@btc-vision/bitcoin';
import { UnisatSigner } from '@btc-vision/transaction';
import { JSONRpcProvider } from 'opnet';

export enum SupportedWallets {
    OP_WALLET = 'op_wallet',
}

export class WalletConnection {
    public wallet_type: SupportedWallets | null = null;
    private op_wallet: UnisatSigner | null = null; // OP_WALLET is a fork of Unisat so we can use the same signer

    /**
     * @description Connect to the wallet
     * @param {SupportedWallets} walletType
     * @returns {Promise<void>}
     */
    public async connect(walletType: SupportedWallets): Promise<void> {
        if (this.wallet_type === walletType) return;

        // TODO: When more wallets are supported, make them disconnect before connecting to the new one
        switch (walletType) {
            case SupportedWallets.OP_WALLET:
                if (window.opnet || window.unisat) {
                    try {
                        this.op_wallet = new UnisatSigner();
                        await this.op_wallet.init();
                        this.wallet_type = SupportedWallets.OP_WALLET;
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
        if (!this.wallet_type) throw new Error('Wallet not connected');

        if (this.wallet_type === SupportedWallets.OP_WALLET && this.op_wallet)
            this.op_wallet.unisat.disconnect();

        this.wallet_type = null;
        this.op_wallet = null;
    }

    /**
     * @description Get the signer of the connected wallet
     * @returns {UnisatSigner}
     */
    public getSigner(): UnisatSigner {
        if (!this.wallet_type) throw new Error('Wallet not connected');

        if (this.wallet_type === SupportedWallets.OP_WALLET && this.op_wallet)
            return this.op_wallet;

        throw new Error('Unsupported wallet');
    }

    /**
     * @description Get the network of the connected wallet
     * @returns {Network}
     */
    public getNetwork(): Network {
        if (!this.wallet_type) throw new Error('Wallet not connected');

        if (this.wallet_type === SupportedWallets.OP_WALLET && this.op_wallet)
            return this.op_wallet.network;

        throw new Error('Unsupported wallet');
    }

    /**
     * @description Get the provider of the connected wallet
     * @returns {JSONRpcProvider}
     */
    public getProvider(): JSONRpcProvider {
        if (!this.wallet_type) throw new Error('Wallet not connected');

        if (this.wallet_type === SupportedWallets.OP_WALLET && this.op_wallet) {
            // TODO: Add Fractal network
            switch (this.op_wallet.network.bech32) {
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
