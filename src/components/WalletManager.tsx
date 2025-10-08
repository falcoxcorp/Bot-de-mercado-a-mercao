import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Eye, EyeOff, Upload, Download, Play, Square, Clock } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useModal } from '../context/ModalContext';
import { useBot } from '../context/BotContext';
import { TOKEN_PAIRS } from '../constants/networks';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import { walletService } from '../services/walletService';

interface WalletCountdown {
  nextOperation: string;
  timeRemaining: string;
  operationsInfo: string;
}

const WalletManager: React.FC = () => {
  const { wallets, importWallet, exportWallets, togglePrivateKey, toggleWalletTrading, removeWallet, saveWalletName } = useWallet();
  const { openWithdrawModal, openWalletConfigModal } = useModal();
  const { addLog } = useBot();
  const { selectedNetwork } = useWeb3();
  const { user } = useAuth();

  const [importInput, setImportInput] = useState('');
  const [walletCountdowns, setWalletCountdowns] = useState<Map<string, WalletCountdown>>(new Map());

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Ready now';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const updateWalletCountdowns = useCallback(async () => {
    if (!user) return;

    const newCountdowns = new Map<string, WalletCountdown>();

    for (const [address, wallet] of wallets.entries()) {
      if (!wallet.active) continue;

      try {
        const walletId = await walletService.getWalletIdByAddress(user.id, address);
        if (!walletId) {
          console.log(`[WalletManager] No wallet ID found for ${address}`);
          continue;
        }

        const strategy = await walletService.loadWalletStrategy(walletId);
        const config = await walletService.loadWalletConfig(walletId);

        if (strategy && config) {
          const nextOp = strategy.currentCycle?.operations?.[0] || 'buy';
          const isBuy = nextOp === 'buy';

          const intervalSeconds = isBuy
            ? (config.buyIntervalHours || 0) * 3600 + (config.buyIntervalMinutes || 0) * 60 + (config.buyIntervalSeconds || 0)
            : (config.sellIntervalHours || 0) * 3600 + (config.sellIntervalMinutes || 0) * 60 + (config.sellIntervalSeconds || 0);

          const lastOpTime = strategy.lastOperationTime
            ? new Date(strategy.lastOperationTime).getTime()
            : 0;

          const now = Date.now();
          const timeSinceLastOp = Math.floor((now - lastOpTime) / 1000);
          const timeRemaining = Math.max(0, intervalSeconds - timeSinceLastOp);

          const timeRemainingStr = formatTimeRemaining(timeRemaining);

          newCountdowns.set(address, {
            nextOperation: isBuy ? 'BUY' : 'SELL',
            timeRemaining: timeRemainingStr,
            operationsInfo: `${strategy.currentCycle?.remainingBuys || 0} buys, ${strategy.currentCycle?.remainingSells || 0} sells (${strategy.currentCycle?.operationsLeft || 0} ops left)`
          });

          console.log(`[WalletManager] Countdown for ${address}:`, {
            nextOp: isBuy ? 'BUY' : 'SELL',
            timeRemaining: timeRemainingStr,
            intervalSeconds,
            timeSinceLastOp
          });
        } else {
          console.log(`[WalletManager] No strategy or config for ${address}`);
        }
      } catch (error) {
        console.error(`[WalletManager] Error updating countdown for ${address}:`, error);
      }
    }

    setWalletCountdowns(newCountdowns);
  }, [user, wallets]);

  useEffect(() => {
    if (user && wallets.size > 0) {
      updateWalletCountdowns();

      const interval = setInterval(() => {
        updateWalletCountdowns();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [user, wallets, updateWalletCountdowns]);

  const handleImport = async () => {
    try {
      await importWallet(importInput);
      setImportInput('');
    } catch (error: any) {
      addLog(`Error importing wallet: ${error.message}`, 'error');
    }
  };
  
  const handleExport = () => {
    if (wallets.size === 0) {
      addLog('No wallets to export', 'warning');
      return;
    }
    exportWallets();
  };
  
  const handleNameChange = (address: string, name: string) => {
    saveWalletName(address, name);
  };

  return (
    <motion.div 
      className="card mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
    >
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <Wallet size={20} className="text-indigo-400" />
        Manual Wallet Management
      </h2>
      
      <div className="form-group">
        <label className="form-label">Import Wallet</label>
        <textarea
          className="form-input min-h-[80px]"
          value={importInput}
          onChange={(e) => setImportInput(e.target.value)}
          placeholder="Enter wallet private key or address..."
        ></textarea>
      </div>

      <div className="flex gap-3 mb-4">
        <motion.button 
          className="btn btn-primary flex-1"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleImport}
        >
          <Upload className="mr-2" size={18} />
          Import Wallet
        </motion.button>
        
        <motion.button 
          className="btn btn-secondary flex-1"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleExport}
        >
          <Download className="mr-2" size={18} />
          Export Wallets
        </motion.button>
      </div>
      
      <div className="wallet-list">
        <h3 className="text-lg font-semibold mb-3 text-gray-200">Imported Wallets</h3>

        <div className="max-h-[600px] overflow-y-auto pr-2">
          {Array.from(wallets.values()).map((wallet) => (
            <div key={wallet.address} className="wallet-card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      className="form-input py-1 text-sm"
                      value={wallet.name}
                      onChange={(e) => handleNameChange(wallet.address, e.target.value)}
                      placeholder="Wallet name"
                    />
                    <motion.button 
                      className="btn btn-secondary py-1 px-2 text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => saveWalletName(wallet.address, wallet.name)}
                    >
                      Save
                    </motion.button>
                  </div>
                  <div className="wallet-address">Address: {wallet.address}</div>
                  {wallet.privateKey && wallet.showPrivateKey && (
                    <div className="wallet-private-key">Private Key: {wallet.privateKey}</div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {wallet.privateKey && (
                    <>
                      <motion.button 
                        className={`btn ${wallet.active ? 'btn-danger' : 'btn-success'} py-1 px-3 text-sm`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleWalletTrading(wallet.address)}
                      >
                        {wallet.active ? <Square size={16} className="mr-1" /> : <Play size={16} className="mr-1" />}
                        {wallet.active ? 'Stop Trading' : 'Start Trading'}
                      </motion.button>
                      
                      <motion.button 
                        className="btn btn-secondary py-1 px-3 text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => togglePrivateKey(wallet.address)}
                      >
                        {wallet.showPrivateKey ? <EyeOff size={16} className="mr-1" /> : <Eye size={16} className="mr-1" />}
                        {wallet.showPrivateKey ? 'Hide Key' : 'Show Key'}
                      </motion.button>
                      
                      <motion.button 
                        className="btn btn-primary py-1 px-3 text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openWalletConfigModal(wallet.address)}
                      >
                        Configure
                      </motion.button>
                      
                      <motion.button 
                        className="btn btn-warning py-1 px-3 text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openWithdrawModal(wallet.address)}
                      >
                        Withdraw
                      </motion.button>
                    </>
                  )}
                  
                  <motion.button 
                    className="btn btn-danger py-1 px-3 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => removeWallet(wallet.address)}
                  >
                    Remove
                  </motion.button>
                </div>
              </div>
              
              <div className="wallet-balances bg-slate-900 bg-opacity-50 rounded-lg p-3 mt-2">
                {/* Native token balance */}
                <div className="wallet-balance-item">
                  <span className="wallet-balance-label">{wallet.balances?.symbol || 'CORE'}:</span>
                  <span className="wallet-balance-value">
                    {parseFloat(wallet.balances?.native || '0').toFixed(6)}
                    <span className="usd-value">≈ ${(wallet.balances?.nativeUsdValue || 0).toFixed(2)}</span>
                  </span>
                </div>
                
                {/* Listed token balances */}
                {Object.entries(TOKEN_PAIRS[selectedNetwork] || {}).map(([symbol, data]) => {
                  const tokenBalance = wallet.balances?.tokens.find(t => t.address.toLowerCase() === data.address.toLowerCase());
                  return (
                    <div key={data.address} className="wallet-balance-item">
                      <span className="wallet-balance-label">{symbol}:</span>
                      <span className="wallet-balance-value">
                        {tokenBalance ? parseFloat(tokenBalance.balance).toFixed(6) : '0.000000'}
                        <span className="usd-value">≈ ${(tokenBalance?.usdValue || 0).toFixed(2)}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {wallet.active && (
                <div className="wallet-cycle-info mt-2 bg-slate-900 bg-opacity-50 rounded-lg p-3">
                  {walletCountdowns.has(wallet.address) ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-indigo-400" />
                        <strong className="text-gray-300">Next Operation:</strong>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center justify-between bg-slate-800 rounded p-2">
                          <span className="text-gray-400">Type:</span>
                          <span className={`font-bold ${walletCountdowns.get(wallet.address)?.nextOperation === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                            {walletCountdowns.get(wallet.address)?.nextOperation}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-800 rounded p-2">
                          <span className="text-gray-400">Time Remaining:</span>
                          <span className="font-mono text-white font-semibold text-right">
                            {walletCountdowns.get(wallet.address)?.timeRemaining || 'Ready now'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-800 rounded p-2">
                          <span className="text-gray-400">Cycle Status:</span>
                          <span className="text-gray-300 text-xs">
                            {walletCountdowns.get(wallet.address)?.operationsInfo}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div><strong>Current Cycle:</strong> <span className="current-cycle">Loading...</span></div>
                      <div><strong>Next Cycle:</strong> <span className="next-cycle">Loading...</span></div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {wallets.size === 0 && (
            <div className="text-center py-6 text-gray-400">
              No wallets imported. Import a wallet or generate new ones.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default WalletManager;