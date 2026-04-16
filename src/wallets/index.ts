import { WalletController } from './controller';
import OPWallet from './opwallet/controller';
import { logo as OPWalletLogo } from './opwallet/interface';
import { SupportedWallets } from './supported-wallets';

WalletController.registerWallet({
    name: SupportedWallets.OP_WALLET,
    icon: OPWalletLogo,
    controller: new OPWallet(),
});

export { WalletController, SupportedWallets };
