import type { Unisat } from '@btc-vision/transaction';

export interface OPWalletInterface extends Unisat {
    disconnect: () => Promise<void>;
}
