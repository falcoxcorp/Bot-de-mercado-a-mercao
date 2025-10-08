import React from 'react';
import { motion } from 'framer-motion';
import { Save, Download } from 'lucide-react';
import { useBot } from '../context/BotContext';

const ParameterControls: React.FC = () => {
  const { saveParameters, loadParameters } = useBot();

  return (
    <motion.div 
      className="flex gap-4 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      <motion.button 
        className="btn btn-primary flex-1 flex items-center justify-center"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={saveParameters}
      >
        <Save className="mr-2" size={18} />
        Save Trading Parameters
      </motion.button>
      
      <motion.button 
        className="btn btn-secondary flex-1 flex items-center justify-center"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={loadParameters}
      >
        <Download className="mr-2" size={18} />
        Load Saved Parameters
      </motion.button>
    </motion.div>
  );
};

export default ParameterControls;