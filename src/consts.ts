import { networks } from '@btc-vision/bitcoin';
import { UnisatChainType } from '@btc-vision/transaction';
import { WalletConnectNetwork } from './types';

export const DefaultWalletConnectNetwork: WalletConnectNetwork = {
    ...networks.regtest,
    chainType: UnisatChainType.BITCOIN_REGTEST,
} as const;
