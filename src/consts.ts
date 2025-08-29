import { networks } from '@btc-vision/bitcoin';
import { UnisatChainType } from '@btc-vision/transaction';
import { type WalletConnectNetwork } from './types';

export const DefaultWalletConnectNetwork: WalletConnectNetwork = {
    ...networks.regtest,
    chainType: UnisatChainType.BITCOIN_REGTEST,
    network: 'regtest',
} as const;
