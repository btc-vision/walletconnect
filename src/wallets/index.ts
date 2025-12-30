import { WalletController } from './controller';
import { logo as OPWalletLogo } from './opwallet/interface';
import OPWalletInstance from './opwallet/controller';

import { SupportedWallets } from './supported-wallets';

WalletController.registerWallet(
    {
    name: SupportedWallets.OP_WALLET,
    icon: OPWalletLogo,
    controller: new OPWalletInstance(),
});

export { WalletController, SupportedWallets };
