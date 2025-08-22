import { WalletConnectNetwork } from './types';

export const DefaultWalletConnectChain: WalletConnectNetwork = {
    network: 'regtest',
    chainType: 'BITCOIN_REGTEST'
} as const;
