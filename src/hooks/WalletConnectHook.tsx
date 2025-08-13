import { WalletConnectContext, type WalletConnectContextType } from '../context/WalletConnectContext.ts';
import { useContext } from 'react';

export const useWalletConnect = (): WalletConnectContextType => {
    const context = useContext(WalletConnectContext);
    if (!context) {
        throw new Error('useCore must be used within a UserProvider');
    }
    return context;
};
