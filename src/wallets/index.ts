import { WalletController } from './controller';
import { logo as OPWalletLogo } from './opwallet/interface';
import OPWalletInstance from './opwallet/controller';

type SupportedWallets = 'OP_WALLET';

WalletController.registerWallet({
    name: 'OP_WALLET',
    icon: OPWalletLogo,
    controller: new OPWalletInstance(),
});

export { WalletController };
export type { SupportedWallets };
