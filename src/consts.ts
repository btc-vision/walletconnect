import { UnisatChainType } from '@btc-vision/transaction';
import { networks } from '@btc-vision/bitcoin';
import { WalletConnectNetwork } from './types';

export const DefaultWalletConnectNetwork: WalletConnectNetwork = {
    ...networks.regtest,
    chainType: UnisatChainType.BITCOIN_REGTEST,
} as const;
