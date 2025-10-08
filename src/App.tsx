import React, { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/Header';
import BotConfiguration from './components/BotConfiguration';
import TokenPairManager from './components/TokenPairManager';
import NetworkSelector from './components/NetworkSelector';
import DexSelector from './components/DexSelector';
import BuyingParameters from './components/BuyingParameters';
import SellingParameters from './components/SellingParameters';
import BotStatus from './components/BotStatus';
import WalletManager from './components/WalletManager';
import ParameterControls from './components/ParameterControls';
import WalletGenerator from './components/WalletGenerator';
import WithdrawModal from './components/modals/WithdrawModal';
import WalletConfigModal from './components/modals/WalletConfigModal';
import TermsModal from './components/modals/TermsModal';
import AIAssistant from './components/AIAssistant';

import { Web3Provider } from './context/Web3Context';
import { BotProvider } from './context/BotContext';
import { WalletProvider } from './context/WalletContext';
import { ModalProvider } from './context/ModalContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';

const MainApp = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    const createShootingStar = () => {
      const star = document.createElement('div');
      star.className = 'shooting-star';
      star.style.top = `${Math.random() * 100}%`;
      star.style.left = `${Math.random() * 100}%`;
      document.body.appendChild(star);

      star.addEventListener('animationend', () => {
        star.remove();
      });
    };

    const createStarInterval = () => {
      createShootingStar();
      setTimeout(createStarInterval, Math.random() * 10000 + 5000);
    };

    createStarInterval();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Web3Provider>
      <BotProvider>
        <WalletProvider>
          <ModalProvider>
            <div className="min-h-screen relative">
              <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
                <Header />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <BotConfiguration />
                  <TokenPairManager />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <NetworkSelector />
                  <DexSelector />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <BuyingParameters />
                  <SellingParameters />
                </div>

                <BotStatus />

                <WalletManager />

                <ParameterControls />

                <WalletGenerator />
              </div>

              <WithdrawModal />
              <WalletConfigModal />
              <TermsModal />
              <AIAssistant />

              <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
            </div>
          </ModalProvider>
        </WalletProvider>
      </BotProvider>
    </Web3Provider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;