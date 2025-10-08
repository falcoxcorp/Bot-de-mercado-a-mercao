import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, Plus, Trash, TrendingUp, TrendingDown } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useBot } from '../context/BotContext';
import { TOKEN_PAIRS } from '../constants/networks';

interface TokenPrice {
  price: number;
  change24h: number;
  lastUpdate: number;
}

const TokenPairManager: React.FC = () => {
  const { selectedNetwork, getTokenUsdPrice } = useWeb3();
  const { tradingParameters, updateTradingParameter, addLog } = useBot();
  
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [newTokenName, setNewTokenName] = useState('');
  const [tokenPairs, setTokenPairs] = useState(TOKEN_PAIRS);
  const [tokenPrices, setTokenPrices] = useState<{[key: string]: TokenPrice}>({});

  useEffect(() => {
    const updatePrices = async () => {
      const network = selectedNetwork;
      const pairs = tokenPairs[network] || {};
      
      for (const [symbol, data] of Object.entries(pairs)) {
        try {
          const price = await getTokenUsdPrice(symbol);
          const oldPrice = tokenPrices[symbol]?.price || price;
          const change = ((price - oldPrice) / oldPrice) * 100;
          
          setTokenPrices(prev => ({
            ...prev,
            [symbol]: {
              price,
              change24h: change,
              lastUpdate: Date.now()
            }
          }));
        } catch (error) {
          console.error(`Error fetching price for ${symbol}:`, error);
        }
      }
    };

    updatePrices();
    const interval = setInterval(updatePrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedNetwork, tokenPairs, getTokenUsdPrice]);

  const handleAddTokenPair = () => {
    if (!newTokenAddress || !newTokenName) {
      addLog('Please enter both token address and name', 'error');
      return;
    }

    const updatedTokenPairs = { ...tokenPairs };
    if (!updatedTokenPairs[selectedNetwork]) {
      updatedTokenPairs[selectedNetwork] = {};
    }
    
    updatedTokenPairs[selectedNetwork][newTokenName] = {
      address: newTokenAddress,
      name: newTokenName
    };
    
    setTokenPairs(updatedTokenPairs);
    setNewTokenAddress('');
    setNewTokenName('');
    
    addLog(`Added trading pair ${newTokenName}`, 'success');
  };

  const handleRemoveTokenPair = () => {
    if (!tradingParameters.selectedToken) {
      addLog('Please select a trading pair to remove', 'error');
      return;
    }
    
    const updatedTokenPairs = { ...tokenPairs };
    const network = selectedNetwork;
    
    Object.keys(updatedTokenPairs[network]).forEach(symbol => {
      if (updatedTokenPairs[network][symbol].address === tradingParameters.selectedToken) {
        delete updatedTokenPairs[network][symbol];
      }
    });
    
    setTokenPairs(updatedTokenPairs);
    updateTradingParameter('selectedToken', '');
    
    addLog('Trading pair removed', 'success');
  };

  const formatPrice = (price: number) => {
    if (price < 0.00001) return price.toExponential(4);
    if (price < 0.001) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  return (
    <motion.div 
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Layers size={20} className="text-indigo-400" />
        Trading Pairs
      </h2>
      
      <div className="form-group">
        <label className="form-label">Select Trading Pair</label>
        <div className="space-y-2">
          {Object.entries(tokenPairs[selectedNetwork] || {}).map(([symbol, data]) => {
            const priceData = tokenPrices[symbol];
            const isSelected = data.address === tradingParameters.selectedToken;
            
            return (
              <motion.div
                key={data.address}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                  isSelected 
                    ? 'bg-indigo-600/20 border-indigo-500/50' 
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/30'
                }`}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    className="form-radio text-indigo-600 focus:ring-indigo-500"
                    checked={isSelected}
                    onChange={() => updateTradingParameter('selectedToken', data.address)}
                  />
                  <div>
                    <div className="font-medium text-white">{symbol}</div>
                    <div className="text-sm text-gray-400">{data.name}</div>
                  </div>
                </div>
                
                {priceData && (
                  <div className="text-right">
                    <div className="font-medium text-white">
                      ${formatPrice(priceData.price)}
                    </div>
                    <div className={`text-sm flex items-center gap-1 ${
                      priceData.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {priceData.change24h >= 0 ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                      {Math.abs(priceData.change24h).toFixed(2)}%
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label">New Token Contract Address</label>
        <input 
          type="text" 
          className="form-input"
          value={newTokenAddress}
          onChange={(e) => setNewTokenAddress(e.target.value)}
          placeholder="Enter token contract address"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Token Name</label>
        <input 
          type="text" 
          className="form-input"
          value={newTokenName}
          onChange={(e) => setNewTokenName(e.target.value)}
          placeholder="Enter token name"
        />
      </div>
      
      <div className="flex gap-3">
        <motion.button 
          className="btn btn-primary flex-1"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleAddTokenPair}
        >
          <Plus className="mr-2" size={18} />
          Add Trading Pair
        </motion.button>
        
        <motion.button 
          className="btn btn-danger flex-1"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleRemoveTokenPair}
          disabled={!tradingParameters.selectedToken}
        >
          <Trash className="mr-2" size={18} />
          Remove Selected Pair
        </motion.button>
      </div>
    </motion.div>
  );
};

export default TokenPairManager;