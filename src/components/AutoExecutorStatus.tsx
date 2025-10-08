import React, { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { botExecutor } from '../services/botExecutor';

export const AutoExecutorStatus: React.FC = () => {
  const [status, setStatus] = useState(botExecutor.getStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(botExecutor.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  const getStatusColor = () => {
    if (!status.isRunning) return 'text-gray-400';
    if (status.errorCount > 0) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className={`${getStatusColor()} transition-colors`} size={20} />
          <h3 className="text-white font-semibold">Auto-Executor Status</h3>
        </div>
        <div className="flex items-center gap-2">
          {status.isRunning ? (
            <span className="flex items-center gap-1 text-green-400 text-sm">
              <CheckCircle size={16} />
              Running
            </span>
          ) : (
            <span className="flex items-center gap-1 text-gray-400 text-sm">
              <AlertCircle size={16} />
              Stopped
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded p-3">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Clock size={14} />
            Last Execution
          </div>
          <div className="text-white font-medium">{formatTime(status.lastExecution)}</div>
        </div>

        <div className="bg-gray-900 rounded p-3">
          <div className="text-gray-400 text-sm mb-1">Total Executions</div>
          <div className="text-white font-medium">{status.executionCount}</div>
        </div>

        <div className="bg-gray-900 rounded p-3">
          <div className="text-gray-400 text-sm mb-1">Error Count</div>
          <div className={`font-medium ${status.errorCount > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
            {status.errorCount}
          </div>
        </div>

        <div className="bg-gray-900 rounded p-3">
          <div className="text-gray-400 text-sm mb-1">Interval</div>
          <div className="text-white font-medium">30 seconds</div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded">
        <div className="flex items-start gap-2">
          <Activity className="text-blue-400 mt-0.5" size={16} />
          <div className="text-sm text-blue-300">
            <strong>24/7 Auto-Execution:</strong> The bot automatically executes trades every 30 seconds for all active wallets.
            No external CRON needed - just activate your wallets and let it run!
          </div>
        </div>
      </div>
    </div>
  );
};
