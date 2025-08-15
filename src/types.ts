export interface WalletConnectNetwork {
    network: string;
    chainType: string;
}

export interface WalletInformation {
    name: string;
    icon: string;
    isInstalled: boolean;
    isConnected: boolean;
}

export interface WalletConnectChainMap {
    [key: string]: string;
}

export const WalletConnectChainType: WalletConnectChainMap = {
    BITCOIN_REGTEST: 'bitcoin',
    BITCOIN_TESTNET: 'bitcoin',
    BITCOIN_MAINNET: 'bitcoin'
};
