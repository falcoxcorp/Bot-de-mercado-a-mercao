import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Wallet, AlertTriangle } from 'lucide-react';
import { useBot } from '../context/BotContext';

const BotConfiguration: React.FC = () => {
  const { 
    botCredentials, 
    setPrivateKey, 
    setWalletAddress, 
    saveCredentials,
    startBot,
    stopBot,
    isTrading
  } = useBot();

  return (
    <motion.div 
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <Lock size={20} className="text-indigo-400" />
        Bot Configuration
      </h2>

      {/* Connection Warning */}
      <motion.div 
        className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-start gap-2">
          <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-amber-500 font-medium mb-1">Important Notice:</p>
            <p className="text-gray-300">
              Your bot configuration and wallet data are stored locally in your browser. To ensure uninterrupted trading:
            </p>
            <ul className="list-disc list-inside mt-2 text-gray-300 space-y-1">
              <li>Keep your browser window open</li>
              <li>Maintain an active internet connection</li>
              <li>Avoid clearing browser data</li>
              <li>Consider using a dedicated device for trading</li>
            </ul>
          </div>
        </div>
      </motion.div>
      
      <div className="form-group">
        <label className="form-label">Private Key</label>
        <input 
          type="password" 
          className="form-input"
          value={botCredentials.privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          placeholder="Enter your wallet private key"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Wallet Address</label>
        <div className="flex gap-3">
          <input 
            type="text" 
            className="form-input"
            value={botCredentials.walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter your wallet address"
          />
          <motion.button 
            className="btn btn-primary whitespace-nowrap"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={saveCredentials}
          >
            Save Credentials
          </motion.button>
        </div>
      </div>
      
      <div className="flex gap-3 mt-6">
        <motion.button 
          className="btn btn-primary flex-1"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={startBot}
          disabled={isTrading}
        >
          <Wallet className="mr-2" size={18} />
          Start Bot
        </motion.button>
        
        <motion.button 
          className="btn btn-danger flex-1"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={stopBot}
          disabled={!isTrading}
        >
          <Wallet className="mr-2" size={18} />
          Stop Bot
        </motion.button>
      </div>
    </motion.div>
  );
};

export default BotConfiguration;