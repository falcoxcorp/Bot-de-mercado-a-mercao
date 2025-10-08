import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useWeb3 } from './Web3Context';
import { botExecutor } from '../services/botExecutor';
import { useAuth } from './AuthContext';
import { walletService } from '../services/walletService';

interface BotContextType {
  isTrading: boolean;
  botStats: {
    totalSwaps: number;
    successRate: number;
    totalVolume: number;
  };
  tradingParameters: {
    minBuyAmount: number;
    maxBuyAmount: number;
    buySlippage: number;
    buyIntervalHours: number;
    buyIntervalMinutes: number;
    buyIntervalSeconds: number;
    minSellAmount: number;
    maxSellAmount: number;
    sellSlippage: number;
    sellIntervalHours: number;
    sellIntervalMinutes: number;
    sellIntervalSeconds: number;
    selectedToken: string;
  };
  botCredentials: {
    privateKey: string;
    walletAddress: string;
  };
  logs: Array<{
    message: string;
    type: string;
    timestamp: Date;
  }>;
  currentCycle: string;
  nextCycle: string;
  addLog: (message: string, type: string) => void;
  startBot: () => Promise<void>;
  stopBot: () => void;
  saveCredentials: () => void;
  updateTradingParameter: (param: string, value: any) => void;
  saveParameters: () => void;
  loadParameters: () => void;
  setPrivateKey: (key: string) => void;
  setWalletAddress: (address: string) => void;
}

const defaultTradingParameters = {
  minBuyAmount: 0.01,
  maxBuyAmount: 0.1,
  buySlippage: 1,
  buyIntervalHours: 0,
  buyIntervalMinutes: 1,
  buyIntervalSeconds: 0,
  minSellAmount: 0.01,
  maxSellAmount: 0.1,
  sellSlippage: 1,
  sellIntervalHours: 0,
  sellIntervalMinutes: 1,
  sellIntervalSeconds: 0,
  selectedToken: ''
};

export const BotContext = createContext<BotContextType>({
  isTrading: false,
  botStats: {
    totalSwaps: 0,
    successRate: 0,
    totalVolume: 0
  },
  tradingParameters: defaultTradingParameters,
  botCredentials: {
    privateKey: '',
    walletAddress: ''
  },
  logs: [],
  currentCycle: 'Not running',
  nextCycle: 'Not running',
  addLog: () => {},
  startBot: async () => {},
  stopBot: () => {},
  saveCredentials: () => {},
  updateTradingParameter: () => {},
  saveParameters: () => {},
  loadParameters: () => {},
  setPrivateKey: () => {},
  setWalletAddress: () => {}
});

export const BotProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { web3, initializeWeb3 } = useWeb3();
  const { user } = useAuth();

  const [isTrading, setIsTrading] = useState(false);
  const [botStats, setBotStats] = useState({
    totalSwaps: 0,
    successRate: 0,
    totalVolume: 0
  });
  const [tradingParameters, setTradingParameters] = useState(defaultTradingParameters);
  const [botCredentials, setBotCredentials] = useState({
    privateKey: '',
    walletAddress: ''
  });
  const [logs, setLogs] = useState<Array<{message: string; type: string; timestamp: Date}>>([]);
  const [currentCycle, setCurrentCycle] = useState('Not running');
  const [nextCycle, setNextCycle] = useState('Not running');

  useEffect(() => {
    loadParameters();
  }, []);

  useEffect(() => {
    if (user) {
      addLog('Auto-executor started - Bot will run automatically for active wallets', 'success');
      botExecutor.start();
      updateCycleInfo();

      return () => {
        botExecutor.stop();
      };
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        updateCycleInfo();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const updateCycleInfo = async () => {
    if (!user) {
      setCurrentCycle('Not logged in');
      setNextCycle('Not logged in');
      return;
    }

    try {
      const wallets = await walletService.loadUserWallets(user.id);
      const activeWallets = wallets.filter(w => w.active);

      if (activeWallets.length === 0) {
        setCurrentCycle('No active wallets');
        setNextCycle('Activate a wallet to start trading');
        return;
      }

      let totalBuys = 0;
      let totalSells = 0;
      let totalOperations = 0;

      for (const wallet of activeWallets) {
        const walletId = await walletService.getWalletIdByAddress(user.id, wallet.address);
        if (walletId) {
          const strategy = await walletService.loadWalletStrategy(walletId);
          if (strategy) {
            totalBuys += strategy.currentCycle.remainingBuys;
            totalSells += strategy.currentCycle.remainingSells;
            totalOperations += strategy.currentCycle.operationsLeft;
          }
        }
      }

      const activeCount = activeWallets.length;
      setCurrentCycle(`${activeCount} active wallet${activeCount > 1 ? 's' : ''} - Running...`);
      setNextCycle(`Remaining: ${totalBuys} buys, ${totalSells} sells (${totalOperations} ops total)`);
    } catch (error) {
      console.error('[BotContext] Error updating cycle info:', error);
      setCurrentCycle('Error loading wallet info');
      setNextCycle('Check console for details');
    }
  };

  const addLog = (message: string, type: string = 'info') => {
    setLogs(prevLogs => {
      const newLogs = [
        {
          message,
          type,
          timestamp: new Date()
        },
        ...prevLogs
      ];

      if (newLogs.length > 100) {
        return newLogs.slice(0, 100);
      }
      return newLogs;
    });
  };

  const startBot = async () => {
    try {
      if (!tradingParameters.selectedToken) {
        toast.error('Please select a trading pair first');
        addLog('Please select a trading pair first', 'error');
        return;
      }
      
      if (!botCredentials.privateKey || !botCredentials.walletAddress) {
        toast.error('Please enter wallet credentials first');
        addLog('Please enter wallet credentials first', 'error');
        return;
      }
      
      const web3Instance = await initializeWeb3();
      
      try {
        const account = web3Instance.eth.accounts.privateKeyToAccount(botCredentials.privateKey);
        web3Instance.eth.accounts.wallet.add(account);
        web3Instance.eth.defaultAccount = account.address;
      } catch (error) {
        toast.error('Invalid private key');
        addLog('Invalid private key', 'error');
        return;
      }
      
      setIsTrading(true);
      addLog(`Starting trading for wallet ${botCredentials.walletAddress}`, 'info');
      toast.success('Bot started successfully');
      updateCycleInfo();

    } catch (error: any) {
      addLog(`Failed to initialize bot: ${error.message}`, 'error');
      toast.error('Failed to start bot');
    }
  };

  const stopBot = () => {
    setIsTrading(false);
    updateCycleInfo();
    addLog('Bot stopped');
    toast.info('Bot stopped');
  };

  const saveCredentials = () => {
    if (!botCredentials.privateKey || !botCredentials.walletAddress) {
      toast.error('Please enter both private key and wallet address');
      addLog('Please enter both private key and wallet address', 'error');
      return;
    }
    
    localStorage.setItem('botCredentials', JSON.stringify(botCredentials));
    toast.success('Credentials saved successfully');
    addLog('Credentials saved successfully', 'success');
  };

  const updateTradingParameter = (param: string, value: any) => {
    setTradingParameters(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const saveParameters = () => {
    try {
      localStorage.setItem('tradingParameters', JSON.stringify(tradingParameters));
      toast.success('Trading parameters saved successfully');
      addLog('Trading parameters saved successfully', 'success');
    } catch (error) {
      console.error('Error saving parameters:', error);
      toast.error('Failed to save parameters');
      addLog('Failed to save parameters', 'error');
    }
  };

  const loadParameters = () => {
    try {
      const storedParameters = localStorage.getItem('tradingParameters');
      if (storedParameters) {
        setTradingParameters(JSON.parse(storedParameters));
        addLog('Trading parameters loaded successfully', 'success');
      }
      
      const storedCredentials = localStorage.getItem('botCredentials');
      if (storedCredentials) {
        setBotCredentials(JSON.parse(storedCredentials));
      }
    } catch (error) {
      console.error('Error loading parameters:', error);
      addLog('Failed to load parameters', 'error');
    }
  };

  const setPrivateKey = (key: string) => {
    setBotCredentials(prev => ({
      ...prev,
      privateKey: key
    }));
  };

  const setWalletAddress = (address: string) => {
    setBotCredentials(prev => ({
      ...prev,
      walletAddress: address
    }));
  };

  return (
    <BotContext.Provider
      value={{
        isTrading,
        botStats,
        tradingParameters,
        botCredentials,
        logs,
        currentCycle,
        nextCycle,
        addLog,
        startBot,
        stopBot,
        saveCredentials,
        updateTradingParameter,
        saveParameters,
        loadParameters,
        setPrivateKey,
        setWalletAddress
      }}
    >
      {children}
    </BotContext.Provider>
  );
};

export const useBot = () => useContext(BotContext);