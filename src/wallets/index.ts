import { WalletController } from './controller';
import OPWallet from './opwallet/controller';
import { logo as OPWalletLogo } from './opwallet/interface';
import UniSatWallet from './unisat/controller';
import { logo as UnisatLogo } from './unisat/interface';
import XverseWallet from './xverse/controller';
import { logo as XverseLogo } from './xverse/interface'

type SupportedWallets = 'OP_WALLET' | 'UNISAT' | 'XVERSE';

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

WalletController.registerWallet({
    name: 'XVERSE',
    icon: XverseLogo,
    controller: new XverseWallet()
});

export { WalletController };
export type { SupportedWallets };
