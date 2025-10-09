/*
import type { Unisat } from '@btc-vision/transaction';

export interface XverseAddress {
    address: string;
    addressType: string;
    publicKey: string;
    purpose: string;
}

export interface XverseNetworks {
    bitcoin: XverseNetwork;
    stacks: XverseNetwork;
}

export interface XverseNetwork {
    name: string;
}

export interface XverseBalanceResult {
    total: number;
    unconfirmed: number;
    available: number;
}

export interface XverseResult extends XverseBalanceResult {
    addresses?: XverseAddress[];
    network?: XverseNetworks;
}

export interface XverseError {
    code: number;
    message: string,
}

export interface XverseAccountChangeEvent {
    type: string;
    addresses: XverseAddress[];
}
export interface XverseAccountDisconnectedEvent {
    type: string;
}
export interface XverseNetworkChangeEvent {
    type: string;
    bitcoin: XverseNetwork;
    stacks: XverseNetwork
    addresses: XverseAddress[];
}

export interface XverseResponse {
    id: string;
    status: string;
    jsonrpc: string;
    result?: XverseResult;
    error?: XverseError;
}

interface InscriptionData {
    address: string;
    amount: number;
    asset: string;
    fee: number;
    nonce: number;
    recipient: string;
}

interface InscriptionResult {
    txid: string;
}

interface RepeatInscriptionsData {
    inscriptions: InscriptionData[];
}

interface TransactionResult {
    txid: string;
}

interface SignedMessageResult {
    signature: string;
}

interface BtcTransaction {
    inputs: {
        address: string;
        amount: number;
        asset: string;
        nonce: number;
    }[];
    outputs: {
        address: string;
        amount: number;
        asset: string;
    }[];
    fee: number;
}

interface SignedTransactionResult {
    txid: string;
    raw: string;
}

export interface Xverse {
    addListener(event: 'accountChange', callback: (args: XverseAccountChangeEvent) => void): () => void;
    addListener(event: 'disconnect', callback: (args: XverseAccountDisconnectedEvent) => void): () => void;
    addListener(event: 'networkChange', callback: (args: XverseNetworkChangeEvent) => void): () => void;
    createInscription: (data: InscriptionData) => Promise<InscriptionResult>;
    createRepeatInscriptions: (data: RepeatInscriptionsData) => Promise<InscriptionResult[]>;
    request: (method: string, params?: object) => Promise<XverseResponse>;
    sendBtcTransaction: (transaction: BtcTransaction) => Promise<TransactionResult>;
    signMessage: (message: string) => Promise<SignedMessageResult>;
    signMultipleTransactions: (transactions: BtcTransaction[]) => Promise<SignedTransactionResult[]>;
    signTransaction: (transaction: BtcTransaction) => Promise<SignedTransactionResult>;
}

export interface XverseWalletInterface extends Unisat {
    disconnect: () => Promise<void>;

    BitcoinProvider: Xverse;
    StacksProvider: unknown;
}

export const logo = "data:image/png;base64," +
    "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" +
    "8D+INtzIjYakkQAAAABJRU5ErkJggg=="
*/
