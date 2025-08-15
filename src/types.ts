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
