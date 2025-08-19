import { WalletController } from './controller';
import OPWallet from './opwallet/controller';
import { logo as OPWalletLogo } from './opwallet/interface'
import UniSatWallet from './unisat/controller';
import { logo as UnisatLogo } from './unisat/interface'
import XverseWallet from './xverse/controller';
import { logo as XverseLogo } from './xverse/interface'
import TestWallet from './test/controller';

type SupportedWallets
    = "OP_WALLET"
    | "UNISAT"
    | "Xverse"
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
    name: 'Xverse',
    icon: XverseLogo,
    controller: new XverseWallet()
});

WalletController.registerWallet({
    name: 'TEST',
    icon: '',
    controller: new TestWallet()
});

export { WalletController,  };
export type { SupportedWallets };
