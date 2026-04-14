import { type Unisat } from '@btc-vision/transaction';

export interface MyScribeWalletInterface extends Unisat {
    disconnect: () => Promise<void>;
}

// MyScribe logo as base64 PNG (128x128)
export { logo } from './logo';
