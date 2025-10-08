import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { useWeb3 } from './Web3Context';
import { useBot } from './BotContext';
import { useAuth } from './AuthContext';
import { ERC20_ABI } from '../constants/abis';
import Web3 from 'web3';
import { walletService } from '../services/walletService';

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
  addWallet: (wallet: Wallet) => void;
  removeWallet: (address: string) => void;
  toggleWalletTrading: (address: string) => void;
  togglePrivateKey: (address: string) => void;
  importWallet: (input: string) => Promise<void>;
  updateWalletBalances: (address: string) => Promise<void>;
  generateWallets: (count: number) => Promise<void>;
  saveWalletName: (address: string, name: string) => void;
  getWalletConfig: (address: string) => WalletConfig;
  saveWalletConfig: (address: string, config: WalletConfig) => void;
  exportWallets: () => void;
}

export const WalletContext = createContext<WalletContextType>({
  wallets: new Map(),
  walletStrategies: new Map(),
  walletConfigs: new Map(),
  generateWallet: () => null,
  addWallet: () => {},
  removeWallet: () => {},
  toggleWalletTrading: () => {},
  togglePrivateKey: () => {},
  importWallet: async () => {},
  updateWalletBalances: async () => {},
  generateWallets: async () => {},
  saveWalletName: () => {},
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
    selectedToken: ''
  }),
  saveWalletConfig: () => {},
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
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);

  useEffect(() => {
    if (user) {
      loadWalletsFromSupabase();
    }
  }, [user]);

  // Update balances periodically
  useEffect(() => {
    if (wallets.size === 0) return;

    console.log('[WalletContext] Starting balance update interval for', wallets.size, 'wallet(s)');

    // Update immediately
    const updateAllBalances = async () => {
      try {
        const allWallets = Array.from(wallets.values());
        for (const wallet of allWallets) {
          await updateWalletBalances(wallet.address);
        }
      } catch (error) {
        console.error('[WalletContext] Error updating balances:', error);
      }
    };

    updateAllBalances();

    // Then update every 30 seconds
    const interval = setInterval(updateAllBalances, 30000);

    return () => {
      console.log('[WalletContext] Cleaning up balance update interval');
      clearInterval(interval);
    };
  }, [wallets.size]);

  // Save wallets whenever they change
  useEffect(() => {
    if (wallets.size > 0) {
      saveWalletsToLocalStorage();
    }
  }, [wallets]);

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
          
          // Save updated metrics to localStorage
          saveWalletsToLocalStorage();

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
      saveWalletsToLocalStorage();
    }
  };

  const generateWallet = (): Wallet | null => {
    try {
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

      // Save the generated wallet immediately
      const savedWallets = localStorage.getItem('savedWallets');
      const walletsData = savedWallets ? JSON.parse(savedWallets) : [];
      walletsData.push(wallet);
      localStorage.setItem('savedWallets', JSON.stringify(walletsData));
      
      return wallet;
    } catch (error: any) {
      console.error('Error generating wallet:', error);
      addLog('Failed to generate wallet: ' + error.message, 'error');
      return null;
    }
  };

  const addWallet = async (wallet: Wallet) => {
    setWallets(prev => {
      const newWallets = new Map(prev);
      newWallets.set(wallet.address, wallet);
      return newWallets;
    });

    const newStrategy = generateStrategyWeights();
    setWalletStrategies(prev => {
      const newStrategies = new Map(prev);
      newStrategies.set(wallet.address, newStrategy);
      return newStrategies;
    });

    if (!walletConfigs.has(wallet.address)) {
      setWalletConfigs(prev => {
        const newConfigs = new Map(prev);
        newConfigs.set(wallet.address, getDefaultWalletConfig());
        return newConfigs;
      });
    }

    if (user) {
      try {
        await walletService.saveWallet(user.id, wallet);
        const walletId = await walletService.getWalletIdByAddress(user.id, wallet.address);

        if (walletId) {
          await walletService.saveWalletStrategy(user.id, walletId, newStrategy);
          await walletService.saveWalletConfig(user.id, walletId, getDefaultWalletConfig());
        }

        console.log('[WalletContext] Wallet saved to Supabase:', wallet.address);
      } catch (error) {
        console.error('[WalletContext] Error saving wallet to Supabase:', error);
      }
    }

    saveWalletsToLocalStorage();
  };

  const removeWallet = (address: string) => {
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
    
    // Remove from localStorage
    const savedWallets = localStorage.getItem('savedWallets');
    if (savedWallets) {
      const walletsData = JSON.parse(savedWallets);
      const updatedWallets = walletsData.filter((w: Wallet) => w.address !== address);
      localStorage.setItem('savedWallets', JSON.stringify(updatedWallets));
    }
    
    addLog(`Removed wallet ${address.substr(0, 8)}...`, 'success');
  };

  const toggleWalletTrading = async (address: string) => {
    let newActiveState = false;

    setWallets(prev => {
      const newWallets = new Map(prev);
      const wallet = newWallets.get(address);

      if (wallet) {
        wallet.active = !wallet.active;
        newActiveState = wallet.active;
        newWallets.set(address, wallet);

        if (wallet.active) {
          setWalletStrategies(prev => {
            const newStrategies = new Map(prev);
            newStrategies.set(address, generateStrategyWeights());
            return newStrategies;
          });

          addLog(`Wallet ${address.substring(0, 8)}... trading enabled`, 'info');
        } else {
          addLog(`Wallet ${address.substring(0, 8)}... trading disabled`, 'info');
        }
      }

      return newWallets;
    });

    if (user) {
      try {
        await walletService.toggleWalletActive(user.id, address, newActiveState);
        console.log('[WalletContext] Wallet active state saved to Supabase:', newActiveState);
      } catch (error) {
        console.error('[WalletContext] Error saving wallet active state:', error);
      }
    }

    saveWalletsToLocalStorage();
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

      // Save imported wallet to localStorage
      const savedWallets = localStorage.getItem('savedWallets');
      const walletsData = savedWallets ? JSON.parse(savedWallets) : [];
      walletsData.push(wallet);
      localStorage.setItem('savedWallets', JSON.stringify(walletsData));

      addWallet(wallet);
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
      if (!wallet) {
        console.log(`[WalletContext] Wallet ${address} not found in map`);
        return;
      }

      // Ensure web3 is initialized
      if (!web3) {
        console.log('[WalletContext] Web3 not initialized, initializing now...');
        await initializeWeb3();
      }

      console.log(`[WalletContext] Fetching balances for ${address.substring(0, 8)}...`);
      const balances = await getWalletBalances(address);

      console.log(`[WalletContext] Balances fetched for ${address.substring(0, 8)}:`, {
        native: balances.native,
        tokens: balances.tokens.length
      });

      setWallets(prev => {
        const newWallets = new Map(prev);
        const updatedWallet = newWallets.get(address);

        if (updatedWallet) {
          updatedWallet.balances = balances;
          newWallets.set(address, updatedWallet);
        }

        return newWallets;
      });

      // Update balances in localStorage
      const savedWallets = localStorage.getItem('savedWallets');
      if (savedWallets) {
        const walletsData = JSON.parse(savedWallets);
        const updatedWallets = walletsData.map((w: Wallet) => {
          if (w.address === address) {
            return { ...w, balances };
          }
          return w;
        });
        localStorage.setItem('savedWallets', JSON.stringify(updatedWallets));
      }
    } catch (error) {
      console.error(`[WalletContext] Error updating balances for wallet ${address}:`, error);
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

  const saveWalletName = (address: string, name: string) => {
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
    
    saveWalletsToLocalStorage();
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
      selectedToken: ''
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
    try {
      console.log('[WalletContext] Saving config for', address, config);

      setWalletConfigs(prev => {
        const newConfigs = new Map(prev);
        newConfigs.set(address, config);
        return newConfigs;
      });

      if (user) {
        const walletId = await walletService.getWalletIdByAddress(user.id, address);

        if (walletId) {
          await walletService.saveWalletConfig(user.id, walletId, config);
          console.log('[WalletContext] Config saved to Supabase');
          addLog(`Configuration saved for wallet ${address.substring(0, 8)}...`, 'success');
        } else {
          console.warn('[WalletContext] Wallet ID not found for address:', address);
          addLog(`Warning: Could not find wallet ID for ${address.substring(0, 8)}...`, 'warning');
        }
      }

      saveWalletConfigsToLocalStorage();
    } catch (error) {
      console.error('[WalletContext] Error saving wallet config:', error);
      addLog(`Error saving configuration for wallet ${address.substring(0, 8)}...`, 'error');
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

  const saveWalletsToLocalStorage = () => {
    try {
      const walletsData = Array.from(wallets.values()).map(wallet => ({
        address: wallet.address,
        privateKey: wallet.privateKey,
        name: wallet.name,
        metrics: wallet.metrics,
        active: wallet.active,
        showPrivateKey: wallet.showPrivateKey,
        isImported: wallet.isImported || false,
        balances: wallet.balances
      }));
      
      localStorage.setItem('savedWallets', JSON.stringify(walletsData));
    } catch (error) {
      console.error('Error saving wallets:', error);
      addLog('Error saving wallets to storage', 'error');
    }
  };

  const getDefaultWalletConfig = (): WalletConfig => {
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

  const loadWalletsFromSupabase = async () => {
    if (!user) return;

    try {
      setIsLoadingWallets(true);
      console.log('[WalletContext] Loading wallets from Supabase...');

      const walletsData = await walletService.loadUserWallets(user.id);
      console.log('[WalletContext] Loaded wallets:', walletsData.length);

      const newWallets = new Map<string, Wallet>();
      const newStrategies = new Map<string, WalletStrategy>();
      const newConfigs = new Map<string, WalletConfig>();

      for (const walletData of walletsData) {
        newWallets.set(walletData.address, {
          address: walletData.address,
          privateKey: walletData.privateKey,
          name: walletData.name,
          metrics: walletData.metrics,
          active: walletData.active,
          showPrivateKey: false,
          isImported: walletData.isImported
        });

        const walletId = await walletService.getWalletIdByAddress(user.id, walletData.address);

        if (walletId) {
          const strategy = await walletService.loadWalletStrategy(walletId);
          if (strategy) {
            newStrategies.set(walletData.address, strategy);
          } else {
            newStrategies.set(walletData.address, generateStrategyWeights());
          }

          const config = await walletService.loadWalletConfig(walletId);
          if (config) {
            newConfigs.set(walletData.address, config);
            console.log('[WalletContext] Loaded config for', walletData.address, config);
          } else {
            const defaultConfig = getDefaultWalletConfig();
            newConfigs.set(walletData.address, defaultConfig);
          }
        }
      }

      setWallets(newWallets);
      setWalletStrategies(newStrategies);
      setWalletConfigs(newConfigs);

      addLog(`Loaded ${walletsData.length} wallet(s) from cloud`, 'success');
      console.log('[WalletContext] Loaded configs:', newConfigs.size);
    } catch (error) {
      console.error('[WalletContext] Error loading wallets from Supabase:', error);
      addLog('Error loading wallets from cloud', 'error');
    } finally {
      setIsLoadingWallets(false);
    }
  };

  const saveWalletConfigsToLocalStorage = () => {
    try {
      const configsData: Record<string, WalletConfig> = {};
      walletConfigs.forEach((value, key) => {
        configsData[key] = value;
      });

      localStorage.setItem('walletConfigs', JSON.stringify(configsData));
    } catch (error) {
      console.error('Error saving wallet configs:', error);
      addLog('Error saving wallet configurations', 'error');
    }
  };

  const loadWalletsFromLocalStorage = () => {
    try {
      const savedWallets = localStorage.getItem('savedWallets');
      if (savedWallets) {
        const walletsData = JSON.parse(savedWallets);
        
        const newWallets = new Map<string, Wallet>();
        walletsData.forEach((walletData: any) => {
          newWallets.set(walletData.address, {
            ...walletData,
            metrics: walletData.metrics || {
              totalBuys: 0,
              totalSells: 0,
              totalVolume: 0,
              errors: 0
            },
            active: false, // Always start with trading disabled
            showPrivateKey: false
          });
        });
        
        setWallets(newWallets);
        
        const newStrategies = new Map<string, WalletStrategy>();
        newWallets.forEach((_, address) => {
          newStrategies.set(address, generateStrategyWeights());
        });
        
        setWalletStrategies(newStrategies);
      }

      const savedConfigs = localStorage.getItem('walletConfigs');
      if (savedConfigs) {
        const configsData = JSON.parse(savedConfigs);
        
        const newConfigs = new Map<string, WalletConfig>();
        Object.entries(configsData).forEach(([address, config]: [string, any]) => {
          newConfigs.set(address, config);
        });
        
        setWalletConfigs(newConfigs);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
      addLog('Error loading saved wallets', 'error');
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