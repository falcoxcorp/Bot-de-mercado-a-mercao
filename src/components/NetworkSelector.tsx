import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { NETWORK_CONFIG } from '../constants/networks';

const NetworkSelector: React.FC = () => {
  const { selectedNetwork, setSelectedNetwork } = useWeb3();

  return (
    <motion.div 
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Globe size={20} className="text-indigo-400" />
        Network Selection
      </h2>
      
      <div className="form-group">
        <label className="form-label">Select Network</label>
        <select 
          className="select-input"
          value={selectedNetwork}
          onChange={(e) => setSelectedNetwork(e.target.value)}
        >
          {Object.entries(NETWORK_CONFIG).map(([key, network]) => (
            <option key={key} value={key}>
              {network.name}
            </option>
          ))}
        </select>
      </div>
    </motion.div>
  );
};

export default NetworkSelector;