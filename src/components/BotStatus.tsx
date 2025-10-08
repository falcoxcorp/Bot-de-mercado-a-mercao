import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Clock } from 'lucide-react';
import { useBot } from '../context/BotContext';

const BotStatus: React.FC = () => {
  const { isTrading, logs, currentCycle, nextCycle } = useBot();
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Improved log scrolling behavior
  useEffect(() => {
    if (logContainerRef.current) {
      const container = logContainerRef.current;
      const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 1;
      
      if (isScrolledToBottom) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 100);
      }
    }
  }, [logs]);

  const getLogTypeClass = (type: string) => {
    switch (type) {
      case 'success': return 'log-success';
      case 'error': return 'log-error';
      case 'warning': return 'log-warning';
      default: return 'log-info';
    }
  };

  return (
    <motion.div 
      className="card mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span className={`status-indicator ${isTrading ? 'status-active' : 'status-inactive'}`} />
        <Bot size={20} className="text-indigo-400" />
        Bot Status
      </h2>
      
      <div className="mb-3 bg-slate-900 p-3 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={16} className="text-indigo-400" />
          <span className="text-gray-300 font-medium">Cycle Information</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-gray-400 text-sm">Current Cycle:</span>
            <span className="ml-2 text-white">{currentCycle}</span>
          </div>
          
          <div>
            <span className="text-gray-400 text-sm">Next Cycle:</span>
            <span className="ml-2 text-white">{nextCycle}</span>
          </div>
        </div>
      </div>
      
      <div 
        className="log-container overflow-auto" 
        ref={logContainerRef}
        style={{ maxHeight: '250px' }}
      >
        {logs.map((log, index) => (
          <div 
            key={`${index}-${log.timestamp.getTime()}`} 
            className={`log-entry ${getLogTypeClass(log.type)} py-1`}
          >
            <span className="text-gray-500 inline-block w-24">
              {log.timestamp.toLocaleTimeString()}
            </span>
            <span className="break-words">{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-center py-4 text-gray-400">
            No logs available. Start the bot to see activity.
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BotStatus;