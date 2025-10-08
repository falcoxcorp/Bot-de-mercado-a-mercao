import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Eye, EyeOff, Upload, Download, Play, Square } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useModal } from '../context/ModalContext';
import { useBot } from '../context/BotContext';
import { TOKEN_PAIRS } from '../constants/networks';
import { useWeb3 } from '../context/Web3Context';

const WalletManager: React.FC = () => {
  const { wallets, importWallet, exportWallets, togglePrivateKey, toggleWalletTrading, removeWallet, saveWalletName } = useWallet();
  const { openWithdrawModal, openWalletConfigModal } = useModal();
  const { addLog } = useBot();
  const { selectedNetwork } = useWeb3();
  
  const [importInput, setImportInput] = useState('');
  
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
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Wallet size={20} className="text-indigo-400" />
        Manual Wallet Management
      </h2>
      
      <div className="form-group">
        <label className="form-label">Import Wallet</label>
        <textarea 
          className="form-input min-h-[100px]"
          value={importInput}
          onChange={(e) => setImportInput(e.target.value)}
          placeholder="Enter wallet private key or address..."
        ></textarea>
      </div>
      
      <div className="flex gap-3 mb-6">
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
        
        <div className="max-h-[400px] overflow-y-auto pr-2">
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
                  <div><strong>Current Cycle:</strong> <span className="current-cycle">Running...</span></div>
                  <div><strong>Next Cycle:</strong> <span className="next-cycle">Preparing...</span></div>
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