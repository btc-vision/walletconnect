import { WalletController } from './controller';
import OPWallet from './opwallet/controller';
import { logo as OPWalletLogo } from './opwallet/interface';
import type { SupportedWallets } from './supported-wallets';
import UniSatWallet from './unisat/controller';
import { logo as UnisatLogo } from './unisat/interface';

WalletController.registerWallet({
    name: 'OP_WALLET',
    icon: OPWalletLogo,
    controller: new OPWallet(),
});

WalletController.registerWallet({
    name: 'UNISAT',
    icon: UnisatLogo,
    controller: new UniSatWallet(),
});

export { WalletController };
export type { SupportedWallets };
