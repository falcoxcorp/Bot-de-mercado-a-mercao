import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GanttChart } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { DEX_CONFIG } from '../constants/networks';

const DexSelector: React.FC = () => {
  const { selectedNetwork, selectedDex, setSelectedDex } = useWeb3();

  useEffect(() => {
    // Set default DEX when network changes
    if (DEX_CONFIG[selectedNetwork] && DEX_CONFIG[selectedNetwork].length > 0) {
      setSelectedDex(DEX_CONFIG[selectedNetwork][0].router);
    }
  }, [selectedNetwork, setSelectedDex]);

  return (
    <motion.div 
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <GanttChart size={20} className="text-indigo-400" />
        DEX Selection
      </h2>
      
      <div className="form-group">
        <label className="form-label">Select DEX</label>
        <select 
          className="select-input"
          value={selectedDex}
          onChange={(e) => setSelectedDex(e.target.value)}
        >
          {DEX_CONFIG[selectedNetwork]?.map((dex) => (
            <option key={dex.router} value={dex.router}>
              {dex.name}
            </option>
          ))}
        </select>
      </div>
    </motion.div>
  );
};

export default DexSelector;