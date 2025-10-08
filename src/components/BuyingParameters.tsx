import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock } from 'lucide-react';
import { useBot } from '../context/BotContext';
import { useWeb3 } from '../context/Web3Context';
import { NETWORK_CONFIG } from '../constants/networks';

const BuyingParameters: React.FC = () => {
  const { tradingParameters, updateTradingParameter } = useBot();
  const { selectedNetwork } = useWeb3();
  
  return (
    <motion.div 
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <ArrowUpRight size={20} className="text-green-400" />
        Buying Parameters ({NETWORK_CONFIG[selectedNetwork].symbol})
      </h2>
      
      <div className="form-group">
        <label className="form-label">
          Minimum Buy Amount ({NETWORK_CONFIG[selectedNetwork].symbol})
        </label>
        <input 
          type="number" 
          className="form-input"
          value={tradingParameters.minBuyAmount}
          onChange={(e) => updateTradingParameter('minBuyAmount', parseFloat(e.target.value))}
          step="0.001"
          min="0.001"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">
          Maximum Buy Amount ({NETWORK_CONFIG[selectedNetwork].symbol})
        </label>
        <input 
          type="number" 
          className="form-input"
          value={tradingParameters.maxBuyAmount}
          onChange={(e) => updateTradingParameter('maxBuyAmount', parseFloat(e.target.value))}
          step="0.001"
          min="0.001"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Buy Slippage (%)</label>
        <input 
          type="number" 
          className="form-input"
          value={tradingParameters.buySlippage}
          onChange={(e) => updateTradingParameter('buySlippage', parseFloat(e.target.value))}
          step="0.1"
          min="0.1"
          max="100"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label flex items-center gap-2">
          <Clock size={16} className="text-indigo-400" />
          Buy Interval
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Hours</label>
            <input 
              type="number" 
              className="form-input"
              value={tradingParameters.buyIntervalHours}
              onChange={(e) => updateTradingParameter('buyIntervalHours', parseInt(e.target.value))}
              min="0"
              placeholder="Hours"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Minutes</label>
            <input 
              type="number" 
              className="form-input"
              value={tradingParameters.buyIntervalMinutes}
              onChange={(e) => updateTradingParameter('buyIntervalMinutes', parseInt(e.target.value))}
              min="0"
              max="59"
              placeholder="Minutes"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Seconds</label>
            <input 
              type="number" 
              className="form-input"
              value={tradingParameters.buyIntervalSeconds}
              onChange={(e) => updateTradingParameter('buyIntervalSeconds', parseInt(e.target.value))}
              min="0"
              max="59"
              placeholder="Seconds"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BuyingParameters;