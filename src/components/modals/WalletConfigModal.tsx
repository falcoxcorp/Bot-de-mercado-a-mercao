import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ArrowUpRight, ArrowDownRight, Layers, X } from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { useWallet } from '../../context/WalletContext';
import { TOKEN_PAIRS } from '../../constants/networks';
import { useWeb3 } from '../../context/Web3Context';

const WalletConfigModal: React.FC = () => {
  const { isWalletConfigModalOpen, walletConfigModalData, closeWalletConfigModal, switchConfigTab } = useModal();
  const { getWalletConfig, saveWalletConfig } = useWallet();
  const { selectedNetwork } = useWeb3();
  
  const [config, setConfig] = useState({
    minBuyAmount: 0.01,
    maxBuyAmount: 0.1,
    buySlippage: 1,
    buyIntervalHours: 0,
    buyIntervalMinutes: 1,
    buyIntervalSeconds: 0,
    minSellAmount: 0.01,
    maxSellAmount: 0.1,
    sellSlippage: 1,
    sellIntervalHours: 0,
    sellIntervalMinutes: 1,
    sellIntervalSeconds: 0,
    selectedToken: ''
  });

  useEffect(() => {
    if (isWalletConfigModalOpen && walletConfigModalData.walletAddress) {
      const storageKey = `walletConfig_${walletConfigModalData.walletAddress}`;
      const savedConfig = localStorage.getItem(storageKey);
      
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          setConfig(parsedConfig);
        } catch (error) {
          console.error('Error parsing saved config:', error);
          const walletConfig = getWalletConfig(walletConfigModalData.walletAddress);
          setConfig(walletConfig);
        }
      } else {
        const walletConfig = getWalletConfig(walletConfigModalData.walletAddress);
        setConfig(walletConfig);
      }
    }
  }, [isWalletConfigModalOpen, walletConfigModalData.walletAddress, getWalletConfig]);

  const handleSaveConfig = () => {
    if (walletConfigModalData.walletAddress) {
      const storageKey = `walletConfig_${walletConfigModalData.walletAddress}`;
      
      // Save to localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(config));
      } catch (error) {
        console.error('Error saving config to localStorage:', error);
      }
      
      // Save to wallet context
      saveWalletConfig(walletConfigModalData.walletAddress, config);
      closeWalletConfigModal();
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <AnimatePresence>
      {isWalletConfigModalOpen && (
        <motion.div 
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="modal-content max-w-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings size={20} className="text-indigo-400" />
                Wallet Configuration
              </h2>
              <button 
                className="text-gray-400 hover:text-white transition-colors"
                onClick={closeWalletConfigModal}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="wallet-config-tabs flex mb-6 bg-slate-900 p-1 rounded-lg">
              <button 
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${walletConfigModalData.activeTab === 'buying' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                onClick={() => switchConfigTab('buying')}
              >
                <ArrowUpRight size={16} className="inline mr-2" />
                Buying Parameters
              </button>
              
              <button 
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${walletConfigModalData.activeTab === 'selling' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                onClick={() => switchConfigTab('selling')}
              >
                <ArrowDownRight size={16} className="inline mr-2" />
                Selling Parameters
              </button>
              
              <button 
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${walletConfigModalData.activeTab === 'token' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                onClick={() => switchConfigTab('token')}
              >
                <Layers size={16} className="inline mr-2" />
                Token Selection
              </button>
            </div>
            
            {walletConfigModalData.activeTab === 'buying' && (
              <div className="buying-config">
                <div className="form-group">
                  <label className="form-label">Minimum Buy Amount (CORE)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={config.minBuyAmount}
                    onChange={(e) => updateConfig('minBuyAmount', parseFloat(e.target.value))}
                    step="0.001"
                    min="0.001"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Maximum Buy Amount (CORE)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={config.maxBuyAmount}
                    onChange={(e) => updateConfig('maxBuyAmount', parseFloat(e.target.value))}
                    step="0.001"
                    min="0.001"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Buy Slippage (%)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={config.buySlippage}
                    onChange={(e) => updateConfig('buySlippage', parseFloat(e.target.value))}
                    step="0.1"
                    min="0.1"
                    max="100"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Buy Interval</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Hours</label>
                      <input 
                        type="number" 
                        className="form-input"
                        value={config.buyIntervalHours}
                        onChange={(e) => updateConfig('buyIntervalHours', parseInt(e.target.value))}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Minutes</label>
                      <input 
                        type="number" 
                        className="form-input"
                        value={config.buyIntervalMinutes}
                        onChange={(e) => updateConfig('buyIntervalMinutes', parseInt(e.target.value))}
                        min="0"
                        max="59"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Seconds</label>
                      <input 
                        type="number" 
                        className="form-input"
                        value={config.buyIntervalSeconds}
                        onChange={(e) => updateConfig('buyIntervalSeconds', parseInt(e.target.value))}
                        min="0"
                        max="59"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {walletConfigModalData.activeTab === 'selling' && (
              <div className="selling-config">
                <div className="form-group">
                  <label className="form-label">Minimum Sell Amount (Token)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={config.minSellAmount}
                    onChange={(e) => updateConfig('minSellAmount', parseFloat(e.target.value))}
                    step="0.001"
                    min="0.001"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Maximum Sell Amount (Token)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={config.maxSellAmount}
                    onChange={(e) => updateConfig('maxSellAmount', parseFloat(e.target.value))}
                    step="0.001"
                    min="0.001"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Sell Slippage (%)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={config.sellSlippage}
                    onChange={(e) => updateConfig('sellSlippage', parseFloat(e.target.value))}
                    step="0.1"
                    min="0.1"
                    max="100"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Sell Interval</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Hours</label>
                      <input 
                        type="number" 
                        className="form-input"
                        value={config.sellIntervalHours}
                        onChange={(e) => updateConfig('sellIntervalHours', parseInt(e.target.value))}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Minutes</label>
                      <input 
                        type="number" 
                        className="form-input"
                        value={config.sellIntervalMinutes}
                        onChange={(e) => updateConfig('sellIntervalMinutes', parseInt(e.target.value))}
                        min="0"
                        max="59"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Seconds</label>
                      <input 
                        type="number" 
                        className="form-input"
                        value={config.sellIntervalSeconds}
                        onChange={(e) => updateConfig('sellIntervalSeconds', parseInt(e.target.value))}
                        min="0"
                        max="59"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {walletConfigModalData.activeTab === 'token' && (
              <div className="token-config">
                <div className="form-group">
                  <label className="form-label">Select Trading Pair</label>
                  <select 
                    className="select-input"
                    value={config.selectedToken}
                    onChange={(e) => updateConfig('selectedToken', e.target.value)}
                  >
                    <option value="">Select a trading pair</option>
                    {Object.entries(TOKEN_PAIRS[selectedNetwork] || {}).map(([symbol, data]) => (
                      <option key={data.address} value={data.address}>
                        {symbol}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            <motion.button 
              className="btn btn-primary w-full mt-6"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSaveConfig}
            >
              Save Configuration
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WalletConfigModal;