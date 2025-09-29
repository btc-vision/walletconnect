import {
    type Balance,
    MessageType,
    type PsbtSignatureOptions,
    SignatureType,
    type Unisat,
    type UnisatChainInfo,
    UnisatChainType,
    UnisatNetwork,
} from '@btc-vision/transaction';
import { type Xverse } from './interface';

export class XverseProvider implements Unisat {
    private wallet: Xverse

    constructor(wallet: Xverse) {
        this.wallet = wallet
    }

    connect(): void {
        //this.wallet.connect()
    }

    disconnect(): void {
    }

    getAccounts(): Promise<string[]> {
        return Promise.resolve([]);
    }

    async getBalance(): Promise<Balance> {
        const response = await this.wallet.request('getBalance', undefined);
        console.log("getBalance", response);

        return {
            confirmed: response.result?.available || 0,
            unconfirmed: response.result?.unconfirmed || 0,
            total: response.result?.total || 0,
        }
    }

    getChain(): Promise<UnisatChainInfo> {
        return Promise.resolve({
            enum: UnisatChainType.BITCOIN_MAINNET,
            name: '',
            network: UnisatNetwork.mainnet,
        })
    }

    getNetwork(): Promise<UnisatNetwork> {
        return Promise.resolve(
            UnisatNetwork.mainnet
        );
    }

    getPublicKey(): Promise<string> {
        return Promise.resolve('');
    }

    on(event: "accountsChanged", listener: (accounts: string[]) => void): void;
    on(event: "chainChanged" | "networkChanged", listener: (chain: UnisatChainInfo) => void): void;
    on(event: "disconnect", listener: () => void): void;
    on(event: "accountsChanged" | "chainChanged" | "networkChanged" | "disconnect", listener: ((accounts: string[]) => void) | ((chain: UnisatChainInfo) => void) | (() => void)): void {
    }

    pushPsbt(psbtHex: string): Promise<string> {
        return Promise.resolve('');
    }

    pushTx(options: { rawtx: string }): Promise<string> {
        return Promise.resolve('');
    }

    removeListener(event: "accountsChanged", listener: (accounts: string[]) => void): void;
    removeListener(event: "chainChanged" | "networkChanged", listener: (chain: UnisatChainInfo) => void): void;
    removeListener(event: "disconnect", listener: () => void): void;
    removeListener(event: "accountsChanged" | "chainChanged" | "networkChanged" | "disconnect", listener: ((accounts: string[]) => void) | ((chain: UnisatChainInfo) => void) | (() => void)): void {
    }

    requestAccounts(): Promise<string[]> {
        return Promise.resolve([]);
    }

    sendBitcoin(toAddress: string, satoshis: number, options: {
        feeRate: number;
        memo?: string;
        memos?: string[]
    }): Promise<string> {
        return Promise.resolve('');
    }

    signData(hex: string, type?: SignatureType): Promise<string> {
        return Promise.resolve('');
    }

    signMessage(message: string | Buffer, type?: MessageType): Promise<string> {
        return Promise.resolve('');
    }

    signPsbt(psbtHex: string, psbtOptions: PsbtSignatureOptions): Promise<string> {
        return Promise.resolve('');
    }

    signPsbts(psbtHex: string[], psbtOptions: PsbtSignatureOptions[]): Promise<string[]> {
        return Promise.resolve([]);
    }

    switchNetwork(network: UnisatNetwork): Promise<void> {
        return Promise.resolve(undefined);
    }

}
