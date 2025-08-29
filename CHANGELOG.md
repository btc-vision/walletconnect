# OP_NET - WalletConnect

## V2

This new version makes it easier for developer to use the library to connect to wallets and to implements support for new wallets.

### New features

-   Themes support (current themes are light, dark and moto)
-   Auto reconnect only if already logged in the wallet

### Breaking changes

-   Some properties are moved to the WalletConnect context for easier use

### Migration

```
Old version            -->      New version
{                               {
                                    allWallets
                                    openConnectModal
    connect                         connectToWallet
    disconnect                      disconnect
    walletType                      walletType
    walletWindowInstance            walletInstance
    account                         -
      - isConnected                 publicKey != null
      - signer                      signer
      - address                     address (Address.fromString(publicKey))
                                    publicKey (account publicKey)
                                    walletAddress (account address)
      - addressTyped
      - network                     network
      - provider                    provider
                                    connecting
} = useWallet()                 } = useWalletConnect()
```

walletAddress,

### Sample use of new version (snipets)

**App.tsx**

```typescript jsx
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <WalletConnectProvider theme="light">
            <App />
        </WalletConnectProvider>
    </StrictMode>,
);
```

**Main.tsx**

```typescript jsx
function App() {
    const { openConnectModal, publicKey, provider } = useWalletConnect();

    const [balance, setBalance] = useState<number | undefined>(undefined);

    useEffect(() => {
        const updateBalance = async () => {
            const balance = await provider?.getBalance();
            setBalance(balance?.total);
        };
        void updateBalance();
    }, [provider, setBalance]);

    return (
        <div>
            <button onClick={() => openConnectModal()}>Connect Wallet</button>

            <div>
                <div>Public Key: {publicKey}</div>
                <div>Balance: {balance}</div>
            </div>
        </div>
    );
}
```
