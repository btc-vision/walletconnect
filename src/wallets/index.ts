import { WalletController } from './controller';
import OPWallet from './opwallet/controller';
import { logo as OPWalletLogo } from './opwallet/interface'
import UniSatWallet from './unisat/controller';
import { logo as UnisatLogo } from './unisat/interface'
import TestWallet from './test/controller';

type SupportedWallets
    = "OP_WALLET"
    | "UNISAT"
    | "TEST"

WalletController.registerWallet({
    name: 'OP_WALLET',
    icon: OPWalletLogo,
    controller: new OPWallet()
});

WalletController.registerWallet({
    name: 'UNISAT',
    icon: UnisatLogo,
    controller: new UniSatWallet()
});

WalletController.registerWallet({
    name: 'TEST',
    icon: '',
    controller: new TestWallet()
});

export { WalletController, SupportedWallets };
