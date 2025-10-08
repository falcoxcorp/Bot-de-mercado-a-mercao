import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useWeb3 } from './Web3Context';
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
      checkActiveBots();
    }
  }, [user]);

  const checkActiveBots = async () => {
    if (!user) return;

    try {
      const { data: activeWallets, error } = await walletService.supabase
        .from('wallets')
        .select('id, address')
        .eq('user_id', user.id)
        .eq('active', true);

      if (error) throw error;

      if (activeWallets && activeWallets.length > 0) {
        setIsTrading(true);
        addLog(`${activeWallets.length} wallet(s) are actively trading`, 'info');
        simulateCycles();
      } else {
        setIsTrading(false);
      }
    } catch (error: any) {
      console.error('Error checking active bots:', error);
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
      
      // Keep only the last 100 logs
      if (newLogs.length > 100) {
        return newLogs.slice(0, 100);
      }
      return newLogs;
    });
  };

  const startBot = async () => {
    if (!user) {
      toast.error('Please login first');
      addLog('Please login first', 'error');
      return;
    }

    try {
      if (!tradingParameters.selectedToken) {
        toast.error('Please select a trading pair first');
        addLog('Please select a trading pair first', 'error');
        return;
      }

      // Get all wallets from database
      const { data: wallets, error } = await walletService.supabase
        .from('wallets')
        .select('id, address, encrypted_private_key')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!wallets || wallets.length === 0) {
        toast.error('No wallets found. Import or generate a wallet first.');
        addLog('No wallets found. Import or generate a wallet first.', 'error');
        return;
      }

      // Check if wallets have configuration
      const { data: configs } = await walletService.supabase
        .from('wallet_configurations')
        .select('wallet_id')
        .eq('user_id', user.id);

      if (!configs || configs.length === 0) {
        toast.warning('Please save trading parameters first');
        addLog('Please save trading parameters first', 'warning');
        return;
      }

      // Activate all wallets
      const { error: updateError } = await walletService.supabase
        .from('wallets')
        .update({ active: true })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setIsTrading(true);
      addLog(`Bot started for ${wallets.length} wallet(s)`, 'success');
      toast.success(`Bot started for ${wallets.length} wallet(s)`);

      // Simulate cycle updates
      simulateCycles();

    } catch (error: any) {
      addLog(`Failed to start bot: ${error.message}`, 'error');
      toast.error('Failed to start bot');
    }
  };

  const simulateCycles = () => {
    let cycleCount = 1;
    let operationsLeft = 10;
    
    const interval = setInterval(() => {
      if (!isTrading) {
        clearInterval(interval);
        return;
      }
      
      setCurrentCycle(`Operation ${11 - operationsLeft}/10 (${Math.random() > 0.5 ? 'BUY' : 'SELL'})`);
      setNextCycle(`Remaining: ${Math.floor(operationsLeft/2)} buys, ${Math.ceil(operationsLeft/2)} sells`);
      
      operationsLeft--;
      
      if (operationsLeft <= 0) {
        cycleCount++;
        operationsLeft = 10;
        addLog(`Starting cycle ${cycleCount}`, 'info');
      }
      
    }, 5000);
  };

  const stopBot = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    try {
      // Deactivate all wallets
      const { error } = await walletService.supabase
        .from('wallets')
        .update({ active: false })
        .eq('user_id', user.id);

      if (error) throw error;

      setIsTrading(false);
      setCurrentCycle('Not running');
      setNextCycle('Not running');
      addLog('Bot stopped for all wallets', 'info');
      toast.info('Bot stopped for all wallets');
    } catch (error: any) {
      addLog(`Failed to stop bot: ${error.message}`, 'error');
      toast.error('Failed to stop bot');
    }
  };

  const saveCredentials = async () => {
    if (!botCredentials.privateKey || !botCredentials.walletAddress) {
      toast.error('Please enter both private key and wallet address');
      addLog('Please enter both private key and wallet address', 'error');
      return;
    }

    if (!user) {
      toast.error('Please login first');
      addLog('Please login first', 'error');
      return;
    }

    toast.info('Use the Wallet Manager to import wallets with private keys');
    addLog('Use the Wallet Manager to import wallets with private keys', 'info');
  };

  const updateTradingParameter = (param: string, value: any) => {
    setTradingParameters(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const saveParameters = async () => {
    if (!user) {
      toast.error('Please login first');
      addLog('Please login first', 'error');
      return;
    }

    try {
      const { data: activeWallets, error } = await walletService.supabase
        .from('wallets')
        .select('id, address')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!activeWallets || activeWallets.length === 0) {
        toast.warning('No wallets found. Import or generate a wallet first.');
        addLog('No wallets found to save parameters', 'warning');
        return;
      }

      let savedCount = 0;
      for (const wallet of activeWallets) {
        await walletService.saveWalletConfig(user.id, wallet.id, {
          minBuyAmount: tradingParameters.minBuyAmount,
          maxBuyAmount: tradingParameters.maxBuyAmount,
          buySlippage: tradingParameters.buySlippage,
          buyIntervalHours: tradingParameters.buyIntervalHours,
          buyIntervalMinutes: tradingParameters.buyIntervalMinutes,
          buyIntervalSeconds: tradingParameters.buyIntervalSeconds,
          minSellAmount: tradingParameters.minSellAmount,
          maxSellAmount: tradingParameters.maxSellAmount,
          sellSlippage: tradingParameters.sellSlippage,
          sellIntervalHours: tradingParameters.sellIntervalHours,
          sellIntervalMinutes: tradingParameters.sellIntervalMinutes,
          sellIntervalSeconds: tradingParameters.sellIntervalSeconds,
          selectedToken: tradingParameters.selectedToken,
          selectedNetwork: 'core',
          selectedDex: ''
        });
        savedCount++;
      }

      toast.success(`Trading parameters saved for ${savedCount} wallet(s)`);
      addLog(`Trading parameters saved for ${savedCount} wallet(s)`, 'success');
    } catch (error: any) {
      console.error('Error saving parameters:', error);
      toast.error('Failed to save parameters');
      addLog('Failed to save parameters: ' + error.message, 'error');
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