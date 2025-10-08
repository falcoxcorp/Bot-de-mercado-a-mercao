import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useBot } from '../context/BotContext';

const WalletGenerator: React.FC = () => {
  const { generateWallets } = useWallet();
  const { addLog } = useBot();
  
  const [walletCount, setWalletCount] = useState(1);
  
  const handleGenerateWallets = async () => {
    try {
      if (walletCount < 1 || walletCount > 1000) {
        addLog('Please enter a number between 1 and 1000', 'error');
        return;
      }
      
      await generateWallets(walletCount);
    } catch (error: any) {
      addLog(`Error generating wallets: ${error.message}`, 'error');
    }
  };

  return (
    <motion.div 
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
    >
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <KeyRound size={20} className="text-indigo-400" />
        Wallet Generator
      </h2>
      
      <div className="form-group">
        <label className="form-label">Number of Wallets (max 1000)</label>
        <input 
          type="number" 
          className="form-input"
          value={walletCount}
          onChange={(e) => setWalletCount(parseInt(e.target.value))}
          min="1"
          max="1000"
        />
      </div>
      
      <motion.button 
        className="btn btn-primary w-full"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleGenerateWallets}
      >
        Generate Wallets
      </motion.button>
    </motion.div>
  );
};

export default WalletGenerator;