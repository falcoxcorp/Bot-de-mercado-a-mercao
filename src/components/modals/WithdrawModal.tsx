import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, AlertTriangle } from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { useWeb3 } from '../../context/Web3Context';
import { TOKEN_PAIRS } from '../../constants/networks';
import Web3 from 'web3';
import { ERC20_ABI } from '../../constants/abis';

const WithdrawModal: React.FC = () => {
  const { isWithdrawModalOpen, withdrawModalData, closeWithdrawModal } = useModal();
  const { web3, selectedNetwork } = useWeb3();
  
  const [selectedToken, setSelectedToken] = useState('native');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (isWithdrawModalOpen) {
      setSelectedToken('native');
      setAmount('');
      setDestination('');
      setError('');
    }
  }, [isWithdrawModalOpen]);

  const getTokenBalance = (token: string) => {
    if (token === 'native') {
      return withdrawModalData.availableBalance;
    }
    const tokenData = withdrawModalData.tokens?.find(t => t.address.toLowerCase() === token.toLowerCase());
    return tokenData?.balance || '0';
  };

  const validateForm = () => {
    if (!amount || !destination) {
      setError('Please fill in all fields');
      return false;
    }

    if (!web3?.utils.isAddress(destination)) {
      setError('Invalid destination address');
      return false;
    }

    const balance = getTokenBalance(selectedToken);
    if (parseFloat(amount) > parseFloat(balance)) {
      setError('Insufficient balance');
      return false;
    }

    return true;
  };

  const executeWithdraw = async () => {
    if (!validateForm() || !web3) return;
    
    setIsProcessing(true);
    setError('');

    try {
      const account = web3.eth.accounts.privateKeyToAccount(withdrawModalData.privateKey);
      web3.eth.accounts.wallet.add(account);

      if (selectedToken === 'native') {
        // Native token transfer
        const amountWei = web3.utils.toWei(amount, 'ether');
        const gasPrice = await web3.eth.getGasPrice();
        const gasLimit = '21000';
        const gasCost = BigInt(gasPrice) * BigInt(gasLimit);
        const totalRequired = BigInt(amountWei) + gasCost;
        
        const balance = BigInt(web3.utils.toWei(withdrawModalData.availableBalance, 'ether'));
        if (balance < totalRequired) {
          throw new Error('Insufficient balance for transfer + gas fees');
        }

        const tx = {
          from: account.address,
          to: destination,
          value: amountWei,
          gas: gasLimit,
          gasPrice
        };

        const signedTx = await account.signTransaction(tx);
        await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      } else {
        // Token transfer
        const tokenContract = new web3.eth.Contract(ERC20_ABI, selectedToken);
        const amountWei = web3.utils.toWei(amount, 'ether');
        
        const gasPrice = await web3.eth.getGasPrice();
        const gasEstimate = await tokenContract.methods.transfer(destination, amountWei)
          .estimateGas({ from: account.address });

        const tx = {
          from: account.address,
          to: selectedToken,
          gas: Math.floor(gasEstimate * 1.1), // Add 10% buffer
          gasPrice,
          data: tokenContract.methods.transfer(destination, amountWei).encodeABI()
        };

        const signedTx = await account.signTransaction(tx);
        await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      }

      closeWithdrawModal();
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      setError(error.message || 'Failed to process withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isWithdrawModalOpen && (
        <motion.div 
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="modal-content max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Send size={20} className="text-indigo-400" />
                Withdraw Tokens
              </h2>
              <button 
                className="text-gray-400 hover:text-white transition-colors"
                onClick={closeWithdrawModal}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Select Token</label>
              <select 
                className="select-input"
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
              >
                <option value="native">{withdrawModalData.symbol}</option>
                {Object.entries(TOKEN_PAIRS[selectedNetwork] || {}).map(([symbol, data]) => (
                  <option key={data.address} value={data.address}>
                    {symbol}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Available Balance</label>
              <div className="text-lg font-medium text-indigo-300">
                {getTokenBalance(selectedToken)} {selectedToken === 'native' ? withdrawModalData.symbol : 
                  Object.entries(TOKEN_PAIRS[selectedNetwork] || {}).find(
                    ([, data]) => data.address === selectedToken
                  )?.[0]
                }
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input 
                type="number" 
                className="form-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.000001"
                min="0"
                max={getTokenBalance(selectedToken)}
                placeholder="Enter amount to withdraw"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Destination Address</label>
              <input 
                type="text" 
                className="form-input"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter destination wallet address"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2">
                <AlertTriangle size={20} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-rose-500 text-sm">{error}</p>
              </div>
            )}
            
            <div className="flex gap-3">
              <motion.button 
                className="btn btn-primary flex-1"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={executeWithdraw}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Withdraw'}
              </motion.button>
              
              <motion.button 
                className="btn btn-secondary flex-1"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={closeWithdrawModal}
                disabled={isProcessing}
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WithdrawModal;