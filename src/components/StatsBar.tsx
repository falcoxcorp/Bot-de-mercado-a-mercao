import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBot } from '../context/BotContext';
import { useWallet } from '../context/WalletContext';

const StatsBar: React.FC = () => {
  const { botStats } = useBot();
  const { wallets } = useWallet();
  const [animate, setAnimate] = useState(false);
  const [totalVolume, setTotalVolume] = useState(0);

  useEffect(() => {
    const calculateTotalVolume = () => {
      let volume = 0;
      wallets.forEach(wallet => {
        volume += wallet.metrics.totalVolume;
      });
      setTotalVolume(volume);
    };

    // Calculate initial volume
    calculateTotalVolume();

    // Set up interval to recalculate volume
    const interval = setInterval(calculateTotalVolume, 5000);

    return () => clearInterval(interval);
  }, [wallets]);

  useEffect(() => {
    setAnimate(true);
    const timeout = setTimeout(() => setAnimate(false), 1000);
    return () => clearTimeout(timeout);
  }, [totalVolume, botStats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <motion.div 
        className="card"
        initial={{ scale: 0.95 }}
        animate={{ scale: animate ? 1.03 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-200">Total Swaps</h3>
          <TrendingUp className="text-indigo-500" size={20} />
        </div>
        <div className="mt-2">
          <span className="text-3xl font-bold text-white">{botStats.totalSwaps}</span>
        </div>
      </motion.div>
      
      <motion.div 
        className="card"
        initial={{ scale: 0.95 }}
        animate={{ scale: animate ? 1.03 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-200">Success Rate</h3>
          <PieChart className="text-emerald-500" size={20} />
        </div>
        <div className="mt-2">
          <span className="text-3xl font-bold text-white">{botStats.successRate}%</span>
        </div>
      </motion.div>
      
      <motion.div 
        className="card"
        initial={{ scale: 0.95 }}
        animate={{ scale: animate ? 1.03 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-200">Total Volume</h3>
          <BarChart className="text-purple-500" size={20} />
        </div>
        <div className="mt-2">
          <span className="text-3xl font-bold text-white">{totalVolume.toFixed(4)}</span>
          <span className="ml-2 text-gray-400">CORE</span>
        </div>
      </motion.div>
    </div>
  );
};

export default StatsBar;