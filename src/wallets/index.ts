import { WalletController } from './controller';
import OPWallet from './opwallet/controller';
import { logo as OPWalletLogo } from './opwallet/interface'
import UniSatWallet from './unisat/controller';
import { logo as UnisatLogo } from './unisat/interface'

type SupportedWallets
    = "OP_WALLET"
    | "UNISAT"

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

export { WalletController,  };
export type { SupportedWallets };
