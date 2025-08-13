import { WalletController } from './controller.ts';
import OPWallet from './opwallet/controller.ts';

WalletController.registerWallet({
    name: 'OP_WALLET',
    icon: '',
    controller: new OPWallet()
});

export { WalletController };
