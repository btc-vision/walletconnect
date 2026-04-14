import { WalletController } from './controller';
import MyScribeWallet from './myscribe/controller';
import { logo as MyScribeLogo } from './myscribe/interface';
import OPWallet from './opwallet/controller';
import { logo as OPWalletLogo } from './opwallet/interface';
import { SupportedWallets } from './supported-wallets';
import UniSatWallet from './unisat/controller';
import { logo as UnisatLogo } from './unisat/interface';

WalletController.registerWallet({
    name: SupportedWallets.OP_WALLET,
    icon: OPWalletLogo,
    controller: new OPWallet(),
});

WalletController.registerWallet({
    name: SupportedWallets.UNISAT,
    icon: UnisatLogo,
    controller: new UniSatWallet(),
});

WalletController.registerWallet({
    name: SupportedWallets.MYSCRIBE,
    icon: MyScribeLogo,
    controller: new MyScribeWallet(),
});

export { WalletController, SupportedWallets };
