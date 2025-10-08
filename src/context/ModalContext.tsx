import React, { createContext, useState, useContext } from 'react';
import { useWallet, Wallet } from './WalletContext';

interface ModalContextType {
  // Withdraw modal
  isWithdrawModalOpen: boolean;
  withdrawModalData: {
    walletAddress: string;
    availableBalance: string;
    symbol: string;
  };
  openWithdrawModal: (walletAddress: string) => Promise<void>;
  closeWithdrawModal: () => void;
  executeWithdraw: (amount: string, destination: string) => Promise<void>;
  
  // Wallet config modal
  isWalletConfigModalOpen: boolean;
  walletConfigModalData: {
    walletAddress: string;
    activeTab: string;
  };
  openWalletConfigModal: (walletAddress: string) => void;
  closeWalletConfigModal: () => void;
  switchConfigTab: (tab: string) => void;
}

export const ModalContext = createContext<ModalContextType>({
  isWithdrawModalOpen: false,
  withdrawModalData: {
    walletAddress: '',
    availableBalance: '0',
    symbol: 'CORE'
  },
  openWithdrawModal: async () => {},
  closeWithdrawModal: () => {},
  executeWithdraw: async () => {},
  
  isWalletConfigModalOpen: false,
  walletConfigModalData: {
    walletAddress: '',
    activeTab: 'buying'
  },
  openWalletConfigModal: () => {},
  closeWalletConfigModal: () => {},
  switchConfigTab: () => {}
});

export const ModalProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { wallets, updateWalletBalances } = useWallet();
  
  // Withdraw modal state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawModalData, setWithdrawModalData] = useState({
    walletAddress: '',
    availableBalance: '0',
    symbol: 'CORE'
  });
  
  // Wallet config modal state
  const [isWalletConfigModalOpen, setIsWalletConfigModalOpen] = useState(false);
  const [walletConfigModalData, setWalletConfigModalData] = useState({
    walletAddress: '',
    activeTab: 'buying'
  });

  const openWithdrawModal = async (walletAddress: string) => {
    const wallet = wallets.get(walletAddress);
    if (!wallet) return;
    
    await updateWalletBalances(walletAddress);
    
    const updatedWallet = wallets.get(walletAddress);
    
    setWithdrawModalData({
      walletAddress,
      availableBalance: updatedWallet?.balances?.native || '0',
      symbol: updatedWallet?.balances?.symbol || 'CORE'
    });
    
    setIsWithdrawModalOpen(true);
  };

  const closeWithdrawModal = () => {
    setIsWithdrawModalOpen(false);
  };

  const executeWithdraw = async (amount: string, destination: string) => {
    // In a real implementation, this would execute the withdrawal
    console.log('Executing withdrawal', {
      walletAddress: withdrawModalData.walletAddress,
      amount,
      destination
    });
    
    // Close the modal after withdrawal
    closeWithdrawModal();
  };

  const openWalletConfigModal = (walletAddress: string) => {
    setWalletConfigModalData({
      walletAddress,
      activeTab: 'buying'
    });
    
    setIsWalletConfigModalOpen(true);
  };

  const closeWalletConfigModal = () => {
    setIsWalletConfigModalOpen(false);
  };

  const switchConfigTab = (tab: string) => {
    setWalletConfigModalData(prev => ({
      ...prev,
      activeTab: tab
    }));
  };

  return (
    <ModalContext.Provider
      value={{
        isWithdrawModalOpen,
        withdrawModalData,
        openWithdrawModal,
        closeWithdrawModal,
        executeWithdraw,
        
        isWalletConfigModalOpen,
        walletConfigModalData,
        openWalletConfigModal,
        closeWalletConfigModal,
        switchConfigTab
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);