# WalletConnect

WalletConnect is a library that allows you to connect to various wallets and manage your accounts and transactions. It
provides a unified interface for interacting with different wallets, making it easier to build applications that require
wallet integration.

## Adding a wallet

To add a wallet, you must start by creating a new directory in the `/WalletConnect/src/wallets` directory.

Inside this directory, you will need a controller class for the wallet, which should implement the `WalletBase`
interface. This class will handle the wallet's specific logic, such as connecting to the wallet, signing transactions,
and retrieving account information.

Once you have created the controller class, you will need to add its name to the SupportedWallets type and register it
in the `/wallets/index.ts` module. The latest is done by calling the `registerWallet` method in the `WalletConnect`
module's `init` method. You will need to pass the controller class as an argument to this method.

```ts
import { WalletController } from './controller.ts';
import myWallet from './mywallet/controller.ts';

type SupportedWallets = 'OP_WALLET' | 'UNISAT' | 'My Wallet';

WalletController.registerWallet({
    name: 'My Wallet',
    icon: '',
    controller: new myWallet(), // Class that you have created
});
```
