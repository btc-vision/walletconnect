import type { Unisat } from '@btc-vision/transaction';

export interface TestWalletInterface extends Unisat {
    disconnect: () => Promise<void>;
}
