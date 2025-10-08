import React, { createContext, useState, useEffect, useContext } from 'react';
import Web3 from 'web3';
import { toast } from 'react-toastify';
import { NETWORK_CONFIG, RPC_CONFIG, DEX_CONFIG, TOKEN_PAIRS } from '../constants/networks';
import { ROUTER_ABI, ERC20_ABI } from '../constants/abis';

interface Web3ContextType {
  web3: Web3 | null;
  selectedNetwork: string;
  selectedDex: string;
  initializeWeb3: () => Promise<Web3>;
  getTokenUsdPrice: (symbol: string) => Promise<number>;
  getWalletBalances: (walletAddress: string) => Promise<any>;
  executeBuyTrade: (account: any, amount: number, slippage: number, tokenAddress: string) => Promise<any>;
  executeSellTrade: (account: any, amount: number, slippage: number, tokenAddress: string) => Promise<any>;
  getNextNonce: (address: string) => Promise<number>;
  getOptimizedGasPrice: () => Promise<string>;
  setSelectedNetwork: (network: string) => void;
  setSelectedDex: (dex: string) => void;
}

export const Web3Context = createContext<Web3ContextType>({
  web3: null,
  selectedNetwork: 'core',
  selectedDex: '',
  initializeWeb3: async () => new Web3(),
  getTokenUsdPrice: async () => 0,
  getWalletBalances: async () => ({}),
  executeBuyTrade: async () => ({}),
  executeSellTrade: async () => ({}),
  getNextNonce: async () => 0,
  getOptimizedGasPrice: async () => '0',
  setSelectedNetwork: () => {},
  setSelectedDex: () => {}
});

export const Web3Provider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('core');
  const [selectedDex, setSelectedDex] = useState<string>('');
  const [priceCache, setPriceCache] = useState<{[key: string]: {price: number; timestamp: number}}>({});
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeWeb3();
        
        if (DEX_CONFIG[selectedNetwork] && DEX_CONFIG[selectedNetwork].length > 0) {
          setSelectedDex(DEX_CONFIG[selectedNetwork][0].router);
        }
      } catch (error) {
        console.error('Failed to initialize Web3:', error);
        toast.error('Failed to connect to blockchain network');
      }
    };
    
    init();

    // Set up connection monitoring
    const checkConnection = async () => {
      if (web3) {
        try {
          await web3.eth.net.isListening();
        } catch (error) {
          console.warn('Connection lost, attempting to reconnect...');
          await initializeWeb3();
        }
      }
    };

    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [selectedNetwork]);

  const initializeWeb3 = async (): Promise<Web3> => {
    try {
      const nodes = RPC_CONFIG.nodes[selectedNetwork];
      let lastError;

      for (const node of nodes) {
        try {
          const provider = new Web3.providers.HttpProvider(node, {
            timeout: RPC_CONFIG.timeout,
            keepAlive: true,
            withCredentials: false,
          });

          const web3Instance = new Web3(provider);
          const isListening = await web3Instance.eth.net.isListening();
          
          if (isListening) {
            setWeb3(web3Instance);
            setReconnectAttempts(0);
            return web3Instance;
          }
        } catch (error) {
          lastError = error;
          console.warn(`Failed to connect to ${node}:`, error);
          continue;
        }
      }

      // If all nodes fail, implement exponential backoff
      const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      setReconnectAttempts(prev => prev + 1);
      
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      throw lastError || new Error(`Could not connect to any nodes for ${selectedNetwork}`);
    } catch (error) {
      console.error('Failed to initialize web3:', error);
      throw error;
    }
  };

  const getTokenUsdPrice = async (symbol: string): Promise<number> => {
    try {
      const cached = priceCache[symbol];
      if (cached && Date.now() - cached.timestamp < 30000) {
        return cached.price;
      }

      if (symbol.toLowerCase() === 'core') {
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/0x40375C92d9FAf44d2f9db9Bd9ba41a3317a2404f');
        const data = await response.json();
        if (data.pairs && data.pairs[0]) {
          const price = parseFloat(data.pairs[0].priceUsd);
          setPriceCache(prev => ({
            ...prev,
            [symbol]: { price, timestamp: Date.now() }
          }));
          return price;
        }
      }

      const tokenData = Object.entries(TOKEN_PAIRS[selectedNetwork]).find(
        ([key]) => key.toLowerCase() === symbol.toLowerCase()
      );

      if (tokenData) {
        const [, token] = tokenData;
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token.address}`);
        const data = await response.json();
        if (data.pairs && data.pairs[0]) {
          const price = parseFloat(data.pairs[0].priceUsd);
          setPriceCache(prev => ({
            ...prev,
            [symbol]: { price, timestamp: Date.now() }
          }));
          return price;
        }
      }

      return 0;
    } catch (error) {
      console.warn(`Error fetching price for ${symbol}:`, error);
      return priceCache[symbol]?.price || 0;
    }
  };

  const getWalletBalances = async (walletAddress: string) => {
    if (!web3) {
      throw new Error('Web3 not initialized');
    }

    try {
      const balance = await web3.eth.getBalance(walletAddress);
      const amount = web3.utils.fromWei(balance, 'ether');
      const usdPrice = await getTokenUsdPrice(NETWORK_CONFIG[selectedNetwork].symbol.toLowerCase());
      const usdValue = parseFloat(amount) * usdPrice;

      const tokens = [];
      const networkTokens = TOKEN_PAIRS[selectedNetwork] || {};

      for (const [symbol, data] of Object.entries(networkTokens)) {
        try {
          const tokenContract = new web3.eth.Contract(ERC20_ABI, data.address);
          const tokenBalance = await tokenContract.methods.balanceOf(walletAddress).call();
          const tokenAmount = web3.utils.fromWei(tokenBalance, 'ether');
          const tokenUsdPrice = await getTokenUsdPrice(symbol);
          
          tokens.push({
            symbol,
            address: data.address,
            balance: tokenAmount,
            usdValue: parseFloat(tokenAmount) * tokenUsdPrice
          });
        } catch (error) {
          console.warn(`Error fetching balance for token ${symbol}:`, error);
          tokens.push({
            symbol,
            address: data.address,
            balance: '0',
            usdValue: 0
          });
        }
      }

      return {
        native: amount,
        nativeUsdValue: usdValue,
        tokens,
        symbol: NETWORK_CONFIG[selectedNetwork].symbol
      };
    } catch (error) {
      console.error('Error getting wallet balances:', error);
      return {
        native: '0',
        nativeUsdValue: 0,
        tokens: Object.entries(TOKEN_PAIRS[selectedNetwork] || {}).map(([symbol, data]) => ({
          symbol,
          address: data.address,
          balance: '0',
          usdValue: 0
        })),
        symbol: NETWORK_CONFIG[selectedNetwork].symbol
      };
    }
  };

  const executeBuyTrade = async (account: any, amount: number, slippage: number, tokenAddress: string) => {
    try {
      if (!web3) {
        throw new Error('Web3 not initialized');
      }
      
      const wrappedNative = NETWORK_CONFIG[selectedNetwork].wrappedNative;
      const path = [wrappedNative, tokenAddress];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const amountWei = web3.utils.toWei(amount.toString(), 'ether');
      
      const routerContract = new web3.eth.Contract(ROUTER_ABI, selectedDex);
      
      const amounts = await routerContract.methods.getAmountsOut(amountWei, path).call();
      const expectedTokenAmount = amounts[1];
      
      const minOutputAmount = web3.utils.toBN(expectedTokenAmount)
        .mul(web3.utils.toBN(100 - slippage))
        .div(web3.utils.toBN(100));
      
      const gasPrice = await getOptimizedGasPrice();
      const nonce = await getNextNonce(account.address);
      
      const tx = {
        from: account.address,
        to: selectedDex,
        value: amountWei,
        gas: 700000,
        gasPrice,
        nonce,
        data: routerContract.methods.swapExactETHForTokens(
          minOutputAmount.toString(),
          path,
          account.address,
          deadline
        ).encodeABI()
      };

      console.log('Buy Trade Transaction Details:', {
        gasPrice: web3.utils.fromWei(gasPrice, 'gwei') + ' gwei',
        nonce,
        to: tx.to,
        value: web3.utils.fromWei(tx.value, 'ether') + ' ETH',
        expectedTokenAmount: web3.utils.fromWei(expectedTokenAmount, 'ether') + ' tokens',
        minOutputAmount: web3.utils.fromWei(minOutputAmount, 'ether') + ' tokens',
        data: tx.data
      });
      
      const signedTx = await account.signTransaction(tx);
      return await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    } catch (error) {
      console.error('Buy trade error:', error);
      throw error;
    }
  };

  const executeSellTrade = async (account: any, amount: number, slippage: number, tokenAddress: string) => {
    try {
      if (!web3) {
        throw new Error('Web3 not initialized');
      }
      
      const wrappedNative = NETWORK_CONFIG[selectedNetwork].wrappedNative;
      const path = [tokenAddress, wrappedNative];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      
      const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
      const amountWei = web3.utils.toWei(amount.toString(), 'ether');
      
      // First check token balance
      const tokenBalance = await tokenContract.methods.balanceOf(account.address).call();
      if (BigInt(tokenBalance) < BigInt(amountWei)) {
        throw new Error('Insufficient token balance for sell operation');
      }
      
      // Check current allowance
      const allowance = await tokenContract.methods.allowance(account.address, selectedDex).call();
      
      // If allowance is insufficient, approve tokens first
      if (BigInt(allowance) < BigInt(amountWei)) {
        console.log('Insufficient allowance, approving tokens...');
        const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
        
        const gasPrice = await getOptimizedGasPrice();
        const nonce = await getNextNonce(account.address);
        
        const approveTx = {
          from: account.address,
          to: tokenAddress,
          gas: 100000,
          gasPrice,
          nonce,
          data: tokenContract.methods.approve(selectedDex, maxUint256).encodeABI()
        };

        console.log('Token Approval Transaction Details:', {
          from: account.address,
          to: tokenAddress,
          gasPrice: web3.utils.fromWei(gasPrice, 'gwei') + ' gwei',
          nonce
        });
        
        const signedApproveTx = await account.signTransaction(approveTx);
        const approvalReceipt = await web3.eth.sendSignedTransaction(signedApproveTx.rawTransaction);
        console.log('Approval transaction successful:', approvalReceipt.transactionHash);
        
        // Wait for approval to be mined and confirmed
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verify the new allowance
        const newAllowance = await tokenContract.methods.allowance(account.address, selectedDex).call();
        if (BigInt(newAllowance) < BigInt(amountWei)) {
          throw new Error('Token approval failed - insufficient allowance after approval');
        }
      }
      
      // Now proceed with the sell transaction
      const routerContract = new web3.eth.Contract(ROUTER_ABI, selectedDex);
      
      // Check if there's enough liquidity
      const amounts = await routerContract.methods.getAmountsOut(amountWei, path).call();
      if (!amounts || amounts.length < 2 || BigInt(amounts[1]) === BigInt(0)) {
        throw new Error('Insufficient liquidity for this trade');
      }
      
      const minOutputAmount = web3.utils.toBN(amounts[1])
        .mul(web3.utils.toBN(100 - slippage))
        .div(web3.utils.toBN(100));

      const gasPrice = await getOptimizedGasPrice();
      const nonce = await getNextNonce(account.address);
      
      // Create transaction object
      const tx = {
        from: account.address,
        to: selectedDex,
        gas: 700000,
        gasPrice,
        nonce,
        data: routerContract.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
          amountWei,
          minOutputAmount,
          path,
          account.address,
          deadline
        ).encodeABI()
      };

      // Estimate gas before sending
      try {
        tx.gas = await web3.eth.estimateGas(tx);
      } catch (error) {
        console.warn('Gas estimation failed, using default gas limit:', error);
      }

      console.log('Sell Trade Transaction Details:', {
        from: account.address,
        to: selectedDex,
        gasPrice: web3.utils.fromWei(gasPrice, 'gwei') + ' gwei',
        nonce,
        amountIn: web3.utils.fromWei(amountWei, 'ether'),
        minOutputAmount: web3.utils.fromWei(minOutputAmount, 'ether'),
        estimatedGas: tx.gas
      });
      
      const signedTx = await account.signTransaction(tx);
      return await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    } catch (error) {
      console.error('Sell trade error:', error);
      throw error;
    }
  };

  const getNextNonce = async (address: string): Promise<number> => {
    if (!web3) {
      throw new Error('Web3 not initialized');
    }
    return await web3.eth.getTransactionCount(address, 'pending');
  };

  const getOptimizedGasPrice = async (): Promise<string> => {
    try {
      if (!web3) {
        throw new Error('Web3 not initialized');
      }

      const gasPrice = await web3.eth.getGasPrice();
      const gasPriceNum = Number(gasPrice);

      const adjustedGasPrice = Math.floor(gasPriceNum * 1.1);

      const minGasPrice = web3.utils.toWei('1', 'gwei');
      const maxGasPrice = web3.utils.toWei('500', 'gwei');

      const finalGasPrice = Math.min(Math.max(adjustedGasPrice, parseInt(minGasPrice)), parseInt(maxGasPrice)).toString();
      
      console.log('Gas Price Details:', {
        baseGasPrice: web3.utils.fromWei(gasPrice, 'gwei') + ' gwei',
        adjustedGasPrice: web3.utils.fromWei(finalGasPrice, 'gwei') + ' gwei'
      });

      return finalGasPrice;
    } catch (error) {
      console.error('Error getting gas price:', error);
      if (web3) {
        return web3.utils.toWei('5', 'gwei');
      }
      throw error;
    }
  };

  return (
    <Web3Context.Provider
      value={{
        web3,
        selectedNetwork,
        selectedDex,
        initializeWeb3,
        getTokenUsdPrice,
        getWalletBalances,
        executeBuyTrade,
        executeSellTrade,
        getNextNonce,
        getOptimizedGasPrice,
        setSelectedNetwork,
        setSelectedDex
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);