import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { useWeb3 } from './Web3Context';
import { useBot } from './BotContext';
import { ERC20_ABI } from '../constants/abis';
import Web3 from 'web3';
import { useAuth } from './AuthContext';
import { walletService } from '../services/walletService';
import { encryptPrivateKey, decryptPrivateKey } from '../lib/encryption';

interface WalletMetrics {
  totalBuys: number;
  totalSells: number;
  totalVolume: number;
  errors: number;
}

export interface Wallet {
  address: string;
  privateKey: string | null;
  name: string;
  metrics: WalletMetrics;
  active: boolean;
  showPrivateKey: boolean;
  isImported?: boolean;
  balances?: {
    native: string;
    nativeUsdValue: number;
    tokens: Array<{
      symbol: string;
      address: string;
      balance: string;
      usdValue: number;
    }>;
    symbol: string;
  };
}

interface WalletStrategy {
  currentCycle: {
    remainingBuys: number;
    remainingSells: number;
    operationsLeft: number;
    operations: string[];
  };
  consecutiveBuys: number;
  consecutiveSells: number;
  amountVariability: number;
  timeVariability: number;
  baseSuccessProb: number;
  marketBias: number;
}

interface WalletConfig {
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
}

interface WalletContextType {
  wallets: Map<string, Wallet>;
  walletStrategies: Map<string, WalletStrategy>;
  walletConfigs: Map<string, WalletConfig>;
  generateWallet: () => Wallet | null;
  addWallet: (wallet: Wallet) => Promise<void>;
  removeWallet: (address: string) => Promise<void>;
  toggleWalletTrading: (address: string) => Promise<void>;
  togglePrivateKey: (address: string) => void;
  importWallet: (input: string) => Promise<void>;
  updateWalletBalances: (address: string) => Promise<void>;
  generateWallets: (count: number) => Promise<void>;
  saveWalletName: (address: string, name: string) => Promise<void>;
  getWalletConfig: (address: string) => WalletConfig;
  saveWalletConfig: (address: string, config: WalletConfig) => Promise<void>;
  exportWallets: () => void;
}

export const WalletContext = createContext<WalletContextType>({
  wallets: new Map(),
  walletStrategies: new Map(),
  walletConfigs: new Map(),
  generateWallet: () => null,
  addWallet: async () => {},
  removeWallet: async () => {},
  toggleWalletTrading: async () => {},
  togglePrivateKey: () => {},
  importWallet: async () => {},
  updateWalletBalances: async () => {},
  generateWallets: async () => {},
  saveWalletName: async () => {},
  getWalletConfig: () => ({
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
    selectedToken: '',
    selectedNetwork: 'core',
    selectedDex: ''
  }),
  saveWalletConfig: async () => {},
  exportWallets: () => {}
});

export const WalletProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { web3, initializeWeb3, getWalletBalances, executeBuyTrade, executeSellTrade } = useWeb3();
  const { addLog } = useBot();
  const { user } = useAuth();
  
  const [wallets, setWallets] = useState<Map<string, Wallet>>(new Map());
  const [walletStrategies, setWalletStrategies] = useState<Map<string, WalletStrategy>>(new Map());
  const [walletConfigs, setWalletConfigs] = useState<Map<string, WalletConfig>>(new Map());
  const [lastOperationTime] = useState<Map<string, number>>(new Map());

  // Load saved wallets on component mount
  useEffect(() => {
    if (user) {
      loadWalletsFromDatabase();
      startBalanceUpdateInterval();
    }
  }, [user]);

  // Auto-save is now handled by individual operations

  const startBalanceUpdateInterval = () => {
    const interval = setInterval(async () => {
      try {
        const activeWallets = Array.from(wallets.values()).filter(w => w.active);
        for (const wallet of activeWallets) {
          await updateWalletBalances(wallet.address);
        }
      } catch (error) {
        console.error('Error in balance update interval:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  };

  const executeWalletTrading = async (address: string) => {
    const wallet = wallets.get(address);
    if (!wallet || !wallet.active || !wallet.privateKey) return;

    try {
      const web3Instance = await initializeWeb3();
      const account = web3Instance.eth.accounts.privateKeyToAccount(wallet.privateKey);
      web3Instance.eth.accounts.wallet.add(account);
      web3Instance.eth.defaultAccount = account.address;

      while (wallet.active) {
        try {
          const now = Date.now();
          const lastTime = lastOperationTime.get(address) || 0;
          const strategy = walletStrategies.get(address);
          
          if (!strategy) {
            throw new Error('Trading strategy not found');
          }

          const shouldBuy = determineTradeDirection(strategy);
          const config = getWalletConfig(address);

          if (!config.selectedToken) {
            addLog(`No token pair selected for wallet ${address.substr(0, 8)}...`, 'error');
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
          }

          // Get current balances before attempting trade
          const balances = await getWalletBalances(address);
          
          // Check if we have enough balance for the operation
          if (shouldBuy) {
            const buyAmount = getOrganicTradeAmount(config.minBuyAmount, config.maxBuyAmount, strategy);
            const requiredBalance = web3Instance.utils.toWei(buyAmount.toString(), 'ether');
            const currentBalance = web3Instance.utils.toWei(balances.native, 'ether');
            
            if (BigInt(currentBalance) < BigInt(requiredBalance)) {
              addLog(`Insufficient balance for buy operation in wallet ${address.substr(0, 8)}... (${balances.native} ${balances.symbol})`, 'warning');
              strategy.currentCycle.operationsLeft--; // Skip this operation
              await new Promise(resolve => setTimeout(resolve, 5000));
              continue;
            }
          } else {
            // For sell operations, check token balance
            const tokenContract = new web3Instance.eth.Contract(ERC20_ABI, config.selectedToken);
            const tokenBalance = await tokenContract.methods.balanceOf(address).call();
            const sellAmount = getOrganicTradeAmount(config.minSellAmount, config.maxSellAmount, strategy);
            const requiredBalance = web3Instance.utils.toWei(sellAmount.toString(), 'ether');
            
            if (BigInt(tokenBalance) < BigInt(requiredBalance)) {
              addLog(`Insufficient token balance for sell operation in wallet ${address.substr(0, 8)}...`, 'warning');
              strategy.currentCycle.operationsLeft--; // Skip this operation
              await new Promise(resolve => setTimeout(resolve, 5000));
              continue;
            }
          }

          const intervalHours = shouldBuy ? config.buyIntervalHours : config.sellIntervalHours;
          const intervalMinutes = shouldBuy ? config.buyIntervalMinutes : config.sellIntervalMinutes;
          const intervalSeconds = shouldBuy ? config.buyIntervalSeconds : config.sellIntervalSeconds;
          
          // Calculate base interval in milliseconds
          const baseInterval = (intervalHours * 3600 + intervalMinutes * 60 + intervalSeconds) * 1000;
          
          // Add random variation within 20% of the interval
          const variation = Math.random() * 0.2 * baseInterval;
          const intervalTime = baseInterval + variation;

          if (now - lastTime < intervalTime) {
            const remainingTime = intervalTime - (now - lastTime);
            addLog(`Next operation in ${Math.round(remainingTime/1000)}s for wallet ${address.substr(0, 8)}...`, 'info');
            await new Promise(resolve => setTimeout(resolve, remainingTime));
            continue;
          }

          if (shouldBuy) {
            const amount = getOrganicTradeAmount(config.minBuyAmount, config.maxBuyAmount, strategy);
            await executeBuyTrade(account, amount, config.buySlippage, config.selectedToken);
            wallet.metrics.totalBuys++;
            wallet.metrics.totalVolume += amount;
          } else {
            const amount = getOrganicTradeAmount(config.minSellAmount, config.maxSellAmount, strategy);
            await executeSellTrade(account, amount, config.sellSlippage, config.selectedToken);
            wallet.metrics.totalSells++;
            wallet.metrics.totalVolume += amount;
          }

          lastOperationTime.set(address, now);
          await updateWalletBalances(address);
          await updateCycleInfo(wallet, strategy);

          // Save updated metrics and strategy to database
          if (user) {
            try {
              await walletService.updateWalletMetrics(user.id, address, wallet.metrics);

              const walletId = await walletService.getWalletIdByAddress(user.id, address);
              if (walletId) {
                await walletService.saveWalletStrategy(user.id, walletId, strategy);
              }
            } catch (error: any) {
              console.error('Error saving metrics:', error);
            }
          }

        } catch (error: any) {
          console.error('Trading error:', error);
          addLog(`Operation failed for wallet ${address.substr(0, 8)}...: ${error.message}`, 'error');
          wallet.metrics.errors++;
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    } catch (error: any) {
      console.error('Wallet trading error:', error);
      addLog(`Wallet ${address.substr(0, 8)}... trading error: ${error.message}`, 'error');
      wallet.active = false;
      if (user) {
        try {
          await walletService.toggleWalletActive(user.id, address, false);
        } catch (err) {
          console.error('Error updating wallet status:', err);
        }
      }
    }
  };

  const generateWallet = (): Wallet | null => {
    try {
      if (!user) {
        addLog('Please sign in to generate wallets', 'error');
        return null;
      }

      if (!web3) {
        initializeWeb3();
      }

      const w3 = web3 || new Web3();
      const account = w3.eth.accounts.create();

      const wallet = {
        address: account.address,
        privateKey: account.privateKey,
        name: `Wallet ${Math.floor(Math.random() * 10000)}`,
        metrics: {
          totalBuys: 0,
          totalSells: 0,
          totalVolume: 0,
          errors: 0
        },
        active: false,
        showPrivateKey: false,
        isImported: false
      };

      return wallet;
    } catch (error: any) {
      console.error('Error generating wallet:', error);
      addLog('Failed to generate wallet: ' + error.message, 'error');
      return null;
    }
  };

  const addWallet = async (wallet: Wallet) => {
    if (!user) {
      addLog('Please sign in to add wallets', 'error');
      return;
    }

    try {
      const encryptedKey = wallet.privateKey ? encryptPrivateKey(wallet.privateKey, user.id) : null;
      const walletToSave = { ...wallet, privateKey: encryptedKey };

      await walletService.saveWallet(user.id, walletToSave);

      setWallets(prev => {
        const newWallets = new Map(prev);
        newWallets.set(wallet.address, wallet);
        return newWallets;
      });

      setWalletStrategies(prev => {
        const newStrategies = new Map(prev);
        newStrategies.set(wallet.address, generateStrategyWeights());
        return newStrategies;
      });

      if (!walletConfigs.has(wallet.address)) {
        setWalletConfigs(prev => {
          const newConfigs = new Map(prev);
          newConfigs.set(wallet.address, getDefaultConfig());
          return newConfigs;
        });
      }

      addLog(`Wallet ${wallet.address.substr(0, 8)}... saved to database`, 'success');
    } catch (error: any) {
      console.error('Error adding wallet:', error);
      addLog('Failed to save wallet: ' + error.message, 'error');
    }
  };

  const removeWallet = async (address: string) => {
    if (!user) {
      addLog('Please sign in to remove wallets', 'error');
      return;
    }

    try {
      await walletService.deleteWallet(user.id, address);

      setWallets(prev => {
        const newWallets = new Map(prev);
        newWallets.delete(address);
        return newWallets;
      });

      setWalletStrategies(prev => {
        const newStrategies = new Map(prev);
        newStrategies.delete(address);
        return newStrategies;
      });

      setWalletConfigs(prev => {
        const newConfigs = new Map(prev);
        newConfigs.delete(address);
        return newConfigs;
      });

      addLog(`Removed wallet ${address.substr(0, 8)}... from database`, 'success');
    } catch (error: any) {
      console.error('Error removing wallet:', error);
      addLog('Failed to remove wallet: ' + error.message, 'error');
    }
  };

  const toggleWalletTrading = async (address: string) => {
    if (!user) {
      addLog('Please sign in to toggle wallet trading', 'error');
      return;
    }

    const wallet = wallets.get(address);
    if (!wallet) return;

    const newActive = !wallet.active;

    setWallets(prev => {
      const newWallets = new Map(prev);
      const w = newWallets.get(address);

      if (w) {
        w.active = newActive;
        newWallets.set(address, w);

        if (w.active) {
          setWalletStrategies(prev => {
            const newStrategies = new Map(prev);
            newStrategies.set(address, generateStrategyWeights());
            return newStrategies;
          });

          addLog(`Wallet ${address.substr(0, 8)}... trading enabled`, 'info');
          executeWalletTrading(address);
        } else {
          addLog(`Wallet ${address.substr(0, 8)}... trading disabled`, 'info');
        }
      }

      return newWallets;
    });

    try {
      await walletService.toggleWalletActive(user.id, address, newActive);
    } catch (error: any) {
      console.error('Error updating wallet status:', error);
      addLog('Failed to update wallet status: ' + error.message, 'error');
    }
  };

  const togglePrivateKey = (address: string) => {
    setWallets(prev => {
      const newWallets = new Map(prev);
      const wallet = newWallets.get(address);
      
      if (wallet) {
        const updatedWallet = {
          ...wallet,
          showPrivateKey: !wallet.showPrivateKey
        };
        newWallets.set(address, updatedWallet);
      }
      
      return newWallets;
    });
  };

  const importWallet = async (input: string) => {
    if (!user) {
      addLog('Please sign in to import wallets', 'error');
      toast.error('Please sign in to import wallets');
      return;
    }

    try {
      const trimmedInput = input.trim();
      if (!trimmedInput) {
        addLog('Please enter a wallet private key or address', 'error');
        return;
      }

      if (!web3) {
        await initializeWeb3();
      }
      const w3 = web3 || new Web3();

      let wallet: Wallet;
      if (trimmedInput.startsWith('0x') && trimmedInput.length === 42) {
        wallet = {
          address: trimmedInput,
          privateKey: null,
          name: `Wallet ${trimmedInput.substr(0, 8)}`,
          metrics: {
            totalBuys: 0,
            totalSells: 0,
            totalVolume: 0,
            errors: 0
          },
          active: false,
          showPrivateKey: false,
          isImported: true
        };
        addLog('Importing view-only wallet: ' + wallet.address.substr(0, 8) + '...', 'info');
      } else {
        try {
          const cleanPrivateKey = trimmedInput.replace(/\s+/g, '');
          const privateKey = cleanPrivateKey.startsWith('0x') ? cleanPrivateKey : '0x' + cleanPrivateKey;

          const account = w3.eth.accounts.privateKeyToAccount(privateKey);
          wallet = {
            address: account.address,
            privateKey: account.privateKey,
            name: `Wallet ${account.address.substr(0, 8)}`,
            metrics: {
              totalBuys: 0,
              totalSells: 0,
              totalVolume: 0,
              errors: 0
            },
            active: false,
            showPrivateKey: false,
            isImported: true
          };
          addLog('Importing wallet with private key: ' + wallet.address.substr(0, 8) + '...', 'info');
        } catch (error: any) {
          addLog('Invalid private key format: ' + error.message, 'error');
          return;
        }
      }

      if (wallets.has(wallet.address)) {
        addLog('Wallet already exists', 'error');
        return;
      }

      await addWallet(wallet);
      await updateWalletBalances(wallet.address);

      addLog('Wallet imported successfully', 'success');
      toast.success('Wallet imported successfully');
    } catch (error: any) {
      console.error('Error importing wallet:', error);
      addLog('Failed to import wallet: ' + error.message, 'error');
      toast.error('Failed to import wallet');
    }
  };

  const updateWalletBalances = async (address: string) => {
    try {
      const wallet = wallets.get(address);
      if (!wallet) return;

      const balances = await getWalletBalances(address);

      setWallets(prev => {
        const newWallets = new Map(prev);
        const updatedWallet = newWallets.get(address);

        if (updatedWallet) {
          updatedWallet.balances = balances;
          newWallets.set(address, updatedWallet);
        }

        return newWallets;
      });
    } catch (error) {
      console.error(`Error updating balances for wallet ${address}:`, error);
    }
  };

  const generateWallets = async (count: number) => {
    try {
      if (count < 1 || count > 1000) {
        addLog('Please enter a number between 1 and 1000', 'error');
        return;
      }
      
      for (let i = 0; i < count; i++) {
        const wallet = generateWallet();
        if (wallet) {
          addWallet(wallet);
          await updateWalletBalances(wallet.address);
        }
      }
      
      addLog(`Generated ${count} new wallets`, 'success');
      toast.success(`Generated ${count} new wallets`);
    } catch (error: any) {
      console.error('Error in wallet generation:', error);
      addLog('Error generating wallets: ' + error.message, 'error');
      toast.error('Error generating wallets');
    }
  };

  const saveWalletName = async (address: string, name: string) => {
    if (!user) {
      addLog('Please sign in to update wallet name', 'error');
      return;
    }

    try {
      setWallets(prev => {
        const newWallets = new Map(prev);
        const wallet = newWallets.get(address);

        if (wallet && name.trim()) {
          wallet.name = name.trim();
          newWallets.set(address, wallet);
          addLog(`Wallet name updated to: ${wallet.name}`, 'success');
        }

        return newWallets;
      });

      const wallet = wallets.get(address);
      if (wallet) {
        const encryptedKey = wallet.privateKey ? encryptPrivateKey(wallet.privateKey, user.id) : null;
        await walletService.saveWallet(user.id, { ...wallet, name: name.trim(), privateKey: encryptedKey });
      }
    } catch (error: any) {
      console.error('Error saving wallet name:', error);
      addLog('Failed to save wallet name: ' + error.message, 'error');
    }
  };

  const getDefaultConfig = (): WalletConfig => {
    return {
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
      selectedToken: '',
      selectedNetwork: 'core',
      selectedDex: ''
    };
  };

  const getWalletConfig = (address: string): WalletConfig => {
    let config = walletConfigs.get(address);
    if (!config) {
      config = getDefaultConfig();
      setWalletConfigs(prev => {
        const newConfigs = new Map(prev);
        newConfigs.set(address, config!);
        return newConfigs;
      });
    }
    return config;
  };

  const saveWalletConfig = async (address: string, config: WalletConfig) => {
    if (!user) {
      addLog('Please sign in to save configuration', 'error');
      return;
    }

    try {
      setWalletConfigs(prev => {
        const newConfigs = new Map(prev);
        newConfigs.set(address, config);
        return newConfigs;
      });

      const walletId = await walletService.getWalletIdByAddress(user.id, address);
      if (walletId) {
        await walletService.saveWalletConfig(user.id, walletId, config);
        addLog(`Configuration saved for wallet ${address.substr(0, 8)}...`, 'success');
      }
    } catch (error: any) {
      console.error('Error saving wallet config:', error);
      addLog('Failed to save configuration: ' + error.message, 'error');
    }
  };

  const exportWallets = () => {
    try {
      const data = Array.from(wallets.entries()).map(([address, wallet]) => ({
        address: wallet.address,
        privateKey: wallet.privateKey,
        name: wallet.name,
        metrics: wallet.metrics,
        active: wallet.active,
        showPrivateKey: wallet.showPrivateKey,
        isImported: wallet.isImported || false
      }));
      
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wallets.json';
      a.click();
      
      addLog('Wallets exported successfully', 'success');
      toast.success('Wallets exported successfully');
    } catch (error) {
      console.error('Error exporting wallets:', error);
      addLog('Error exporting wallets to file', 'error');
      toast.error('Error exporting wallets');
    }
  };

  const loadWalletsFromDatabase = async () => {
    if (!user) return;

    try {
      const walletsData = await walletService.loadUserWallets(user.id);

      const newWallets = new Map<string, Wallet>();
      const newStrategies = new Map<string, WalletStrategy>();
      const newConfigs = new Map<string, WalletConfig>();

      for (const walletData of walletsData) {
        let decryptedPrivateKey: string | null = null;

        if (walletData.privateKey) {
          try {
            decryptedPrivateKey = decryptPrivateKey(walletData.privateKey, user.id);
          } catch (error) {
            console.error('Error decrypting private key for wallet:', walletData.address);
            decryptedPrivateKey = null;
          }
        }

        const wallet: Wallet = {
          address: walletData.address,
          privateKey: decryptedPrivateKey,
          name: walletData.name,
          metrics: walletData.metrics,
          active: false,
          showPrivateKey: false,
          isImported: walletData.isImported || false
        };

        newWallets.set(wallet.address, wallet);
        newStrategies.set(wallet.address, generateStrategyWeights());

        const walletId = await walletService.getWalletIdByAddress(user.id, wallet.address);
        if (walletId) {
          const config = await walletService.loadWalletConfig(walletId);
          if (config) {
            newConfigs.set(wallet.address, config);
          } else {
            newConfigs.set(wallet.address, getDefaultConfig());
          }

          const strategy = await walletService.loadWalletStrategy(walletId);
          if (strategy) {
            newStrategies.set(wallet.address, strategy);
          }
        }
      }

      setWallets(newWallets);
      setWalletStrategies(newStrategies);
      setWalletConfigs(newConfigs);

      addLog(`Loaded ${walletsData.length} wallets from database`, 'success');
    } catch (error: any) {
      console.error('Error loading wallets:', error);
      addLog('Error loading wallets from database: ' + error.message, 'error');
    }
  };

  const generateStrategyWeights = (): WalletStrategy => {
    return {
      currentCycle: {
        remainingBuys: 5,
        remainingSells: 5,
        operationsLeft: 10,
        operations: generateRandomOperations()
      },
      consecutiveBuys: 0,
      consecutiveSells: 0,
      amountVariability: 0.3 + Math.random() * 0.4,
      timeVariability: 0.2 + Math.random() * 0.3,
      baseSuccessProb: 0.85 + Math.random() * 0.1,
      marketBias: -0.3 + Math.random() * 0.6
    };
  };

  const generateRandomOperations = () => {
    const operations = Array(5).fill('buy').concat(Array(5).fill('sell'));
    
    for (let i = operations.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [operations[i], operations[j]] = [operations[j], operations[i]];
    }
    
    return operations;
  };

  const determineTradeDirection = (strategy: WalletStrategy): boolean => {
    if (strategy.currentCycle.operationsLeft <= 0) {
      strategy.currentCycle = {
        remainingBuys: 5,
        remainingSells: 5,
        operationsLeft: 10,
        operations: generateRandomOperations()
      };
      addLog('Starting new trading cycle', 'info');
    }

    const operationIndex = 10 - strategy.currentCycle.operationsLeft;
    const nextOperation = strategy.currentCycle.operations[operationIndex];
    strategy.currentCycle.operationsLeft--;

    if (nextOperation === 'buy') {
      strategy.currentCycle.remainingBuys--;
      strategy.consecutiveBuys++;
      strategy.consecutiveSells = 0;
      return true;
    } else {
      strategy.currentCycle.remainingSells--;
      strategy.consecutiveSells++;
      strategy.consecutiveBuys = 0;
      return false;
    }
  };

  const getOrganicTradeAmount = (min: number, max: number, strategy: WalletStrategy): number => {
    const minAmount = parseFloat(min.toString());
    const maxAmount = parseFloat(max.toString());
    
    if (isNaN(minAmount) || isNaN(maxAmount) || minAmount <= 0 || maxAmount <= 0 || minAmount > maxAmount) {
      throw new Error('Invalid trade amount parameters');
    }

    const meanFactor = 0.9 + Math.random() * 0.2;
    const mean = ((maxAmount + minAmount) / 2) * meanFactor;
    const stdDev = (maxAmount - minAmount) / 6;

    let amount;
    do {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      amount = mean + z * stdDev * strategy.amountVariability;
    } while (amount < minAmount || amount > maxAmount);

    return parseFloat(amount.toFixed(6));
  };

  const updateCycleInfo = async (wallet: Wallet, strategy: WalletStrategy) => {
    const operationIndex = 10 - strategy.currentCycle.operationsLeft;
    const nextOperation = strategy.currentCycle.operations[operationIndex];
    
    if (nextOperation) {
      addLog(`Wallet ${wallet.address.substr(0, 8)}... - Operation ${operationIndex + 1}/10 (${nextOperation.toUpperCase()})`, 'info');
      addLog(`Remaining: ${strategy.currentCycle.remainingBuys} buys, ${strategy.currentCycle.remainingSells} sells`, 'info');
    } else {
      addLog(`Wallet ${wallet.address.substr(0, 8)}... - Cycle completed`, 'info');
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallets,
        walletStrategies,
        walletConfigs,
        generateWallet,
        addWallet,
        removeWallet,
        toggleWalletTrading,
        togglePrivateKey,
        importWallet,
        updateWalletBalances,
        generateWallets,
        saveWalletName,
        getWalletConfig,
        saveWalletConfig,
        exportWallets
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);