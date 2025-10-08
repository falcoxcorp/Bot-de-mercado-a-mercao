import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, Clock } from 'lucide-react';
import { useBot } from '../context/BotContext';

const SellingParameters: React.FC = () => {
  const { tradingParameters, updateTradingParameter } = useBot();
  
  return (
    <motion.div 
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <ArrowDownRight size={20} className="text-red-400" />
        Selling Parameters
      </h2>
      
      <div className="form-group">
        <label className="form-label">Minimum Sell Amount (Token)</label>
        <input 
          type="number" 
          className="form-input"
          value={tradingParameters.minSellAmount}
          onChange={(e) => updateTradingParameter('minSellAmount', parseFloat(e.target.value))}
          step="0.001"
          min="0.001"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Maximum Sell Amount (Token)</label>
        <input 
          type="number" 
          className="form-input"
          value={tradingParameters.maxSellAmount}
          onChange={(e) => updateTradingParameter('maxSellAmount', parseFloat(e.target.value))}
          step="0.001"
          min="0.001"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Sell Slippage (%)</label>
        <input 
          type="number" 
          className="form-input"
          value={tradingParameters.sellSlippage}
          onChange={(e) => updateTradingParameter('sellSlippage', parseFloat(e.target.value))}
          step="0.1"
          min="0.1"
          max="100"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label flex items-center gap-2">
          <Clock size={16} className="text-indigo-400" />
          Sell Interval
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Hours</label>
            <input 
              type="number" 
              className="form-input"
              value={tradingParameters.sellIntervalHours}
              onChange={(e) => updateTradingParameter('sellIntervalHours', parseInt(e.target.value))}
              min="0"
              placeholder="Hours"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Minutes</label>
            <input 
              type="number" 
              className="form-input"
              value={tradingParameters.sellIntervalMinutes}
              onChange={(e) => updateTradingParameter('sellIntervalMinutes', parseInt(e.target.value))}
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
              value={tradingParameters.sellIntervalSeconds}
              onChange={(e) => updateTradingParameter('sellIntervalSeconds', parseInt(e.target.value))}
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

export default SellingParameters;