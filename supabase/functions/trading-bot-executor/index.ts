import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Web3 from "npm:web3@1.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ROUTER_ABI = [
  {"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETHSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"}
];

const ERC20_ABI = [
  {"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"type":"function"},
  {"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"type":"function"},
  {"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"type":"function"}
];

const RPC_ENDPOINTS: Record<string, string[]> = {
  core: ["https://rpc.coredao.org", "https://rpc-core.icecreamswap.com"]
};

const NETWORK_CONFIG: Record<string, any> = {
  core: {
    wrappedNative: "0x40375C92d9FAf44d2f9db9Bd9ba41a3317a2404f",
    symbol: "CORE"
  }
};

interface WalletData {
  id: string;
  address: string;
  encrypted_private_key: string;
  user_id: string;
}

interface ConfigData {
  min_buy_amount: number;
  max_buy_amount: number;
  buy_slippage: number;
  buy_interval_hours: number;
  buy_interval_minutes: number;
  buy_interval_seconds: number;
  min_sell_amount: number;
  max_sell_amount: number;
  sell_slippage: number;
  sell_interval_hours: number;
  sell_interval_minutes: number;
  sell_interval_seconds: number;
  selected_token: string;
  selected_network: string;
  selected_dex: string;
}

interface StrategyData {
  remaining_buys: number;
  remaining_sells: number;
  operations_left: number;
  operations: string[];
  consecutive_buys: number;
  consecutive_sells: number;
  amount_variability: number;
  last_operation_time: string | null;
}

function decryptPrivateKey(encryptedKey: string): string {
  try {
    return atob(encryptedKey).split('::')
[0];
  } catch (error) {
    throw new Error('Failed to decrypt private key');
  }
}

function getRandomOperations(): string[] {
  const operations = Array(5).fill('buy').concat(Array(5).fill('sell'));
  for (let i = operations.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [operations[i], operations[j]] = [operations[j], operations[i]];
  }
  return operations;
}

function getOrganicTradeAmount(min: number, max: number, variability: number): number {
  const meanFactor = 0.9 + Math.random() * 0.2;
  const mean = ((max + min) / 2) * meanFactor;
  const stdDev = (max - min) / 6;
  let amount;
  do {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    amount = mean + z * stdDev * variability;
  } while (amount < min || amount > max);
  return parseFloat(amount.toFixed(6));
}

async function initializeWeb3(network: string): Promise<Web3> {
  const nodes = RPC_ENDPOINTS[network] || RPC_ENDPOINTS.core;
  for (const node of nodes) {
    try {
      const web3 = new Web3(node);
      const isListening = await web3.eth.net.isListening();
      if (isListening) {
        return web3;
      }
    } catch (error) {
      console.warn(`Failed to connect to ${node}:`, error);
      continue;
    }
  }
  throw new Error(`Could not connect to any nodes for ${network}`);
}

async function executeBuyTrade(
  web3: Web3,
  account: any,
  amount: number,
  slippage: number,
  tokenAddress: string,
  routerAddress: string,
  network: string
): Promise<any> {
  const wrappedNative = NETWORK_CONFIG[network].wrappedNative;
  const path = [wrappedNative, tokenAddress];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const amountWei = web3.utils.toWei(amount.toString(), 'ether');
  const routerContract = new web3.eth.Contract(ROUTER_ABI as any, routerAddress);
  const amounts = await routerContract.methods.getAmountsOut(amountWei, path).call();
  const expectedTokenAmount = amounts[1];
  const minOutputAmount = web3.utils.toBN(expectedTokenAmount)
    .mul(web3.utils.toBN(100 - slippage))
    .div(web3.utils.toBN(100));
  const gasPrice = await web3.eth.getGasPrice();
  const nonce = await web3.eth.getTransactionCount(account.address, 'pending');
  const tx = {
    from: account.address,
    to: routerAddress,
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
  const signedTx = await account.signTransaction(tx);
  return await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
}

async function executeSellTrade(
  web3: Web3,
  account: any,
  amount: number,
  slippage: number,
  tokenAddress: string,
  routerAddress: string,
  network: string
): Promise<any> {
  const wrappedNative = NETWORK_CONFIG[network].wrappedNative;
  const path = [tokenAddress, wrappedNative];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const tokenContract = new web3.eth.Contract(ERC20_ABI as any, tokenAddress);
  const amountWei = web3.utils.toWei(amount.toString(), 'ether');
  const tokenBalance = await tokenContract.methods.balanceOf(account.address).call();
  if (BigInt(tokenBalance) < BigInt(amountWei)) {
    throw new Error('Insufficient token balance');
  }
  const allowance = await tokenContract.methods.allowance(account.address, routerAddress).call();
  if (BigInt(allowance) < BigInt(amountWei)) {
    const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
    const gasPrice = await web3.eth.getGasPrice();
    const nonce = await web3.eth.getTransactionCount(account.address, 'pending');
    const approveTx = {
      from: account.address,
      to: tokenAddress,
      gas: 100000,
      gasPrice,
      nonce,
      data: tokenContract.methods.approve(routerAddress, maxUint256).encodeABI()
    };
    const signedApproveTx = await account.signTransaction(approveTx);
    await web3.eth.sendSignedTransaction(signedApproveTx.rawTransaction);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  const routerContract = new web3.eth.Contract(ROUTER_ABI as any, routerAddress);
  const amounts = await routerContract.methods.getAmountsOut(amountWei, path).call();
  const minOutputAmount = web3.utils.toBN(amounts[1])
    .mul(web3.utils.toBN(100 - slippage))
    .div(web3.utils.toBN(100));
  const gasPrice = await web3.eth.getGasPrice();
  const nonce = await web3.eth.getTransactionCount(account.address, 'pending');
  const tx = {
    from: account.address,
    to: routerAddress,
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
  const signedTx = await account.signTransaction(tx);
  return await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
}

async function processWallet(
  supabase: any,
  wallet: WalletData,
  config: ConfigData,
  strategy: StrategyData
): Promise<void> {
  try {
    const now = Date.now();
    const lastTime = strategy.last_operation_time ? new Date(strategy.last_operation_time).getTime() : 0;
    if (strategy.operations_left <= 0) {
      strategy.operations = getRandomOperations();
      strategy.operations_left = 10;
      strategy.remaining_buys = 5;
      strategy.remaining_sells = 5;
      await supabase.from('bot_logs').insert({
        user_id: wallet.user_id,
        wallet_id: wallet.id,
        message: `Starting new cycle for wallet ${wallet.address.substring(0, 8)}...`,
        log_type: 'info'
      });
    }
    const operationIndex = 10 - strategy.operations_left;
    const operation = strategy.operations[operationIndex];
    const isBuy = operation === 'buy';
    const intervalHours = isBuy ? config.buy_interval_hours : config.sell_interval_hours;
    const intervalMinutes = isBuy ? config.buy_interval_minutes : config.sell_interval_minutes;
    const intervalSeconds = isBuy ? config.buy_interval_seconds : config.sell_interval_seconds;
    const baseInterval = (intervalHours * 3600 + intervalMinutes * 60 + intervalSeconds) * 1000;
    const variation = Math.random() * 0.2 * baseInterval;
    const intervalTime = baseInterval + variation;
    if (now - lastTime < intervalTime) {
      console.log(`Wallet ${wallet.address.substring(0, 8)} - waiting for next operation`);
      return;
    }
    const web3 = await initializeWeb3(config.selected_network);
    const privateKey = decryptPrivateKey(wallet.encrypted_private_key);
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    const amount = getOrganicTradeAmount(
      isBuy ? config.min_buy_amount : config.min_sell_amount,
      isBuy ? config.max_buy_amount : config.max_sell_amount,
      strategy.amount_variability
    );
    let receipt;
    if (isBuy) {
      receipt = await executeBuyTrade(
        web3,
        account,
        amount,
        config.buy_slippage,
        config.selected_token,
        config.selected_dex,
        config.selected_network
      );
      await supabase.from('wallets').update({
        total_buys: (await supabase.from('wallets').select('total_buys').eq('id', wallet.id).single()).data.total_buys + 1,
        total_volume: (await supabase.from('wallets').select('total_volume').eq('id', wallet.id).single()).data.total_volume + amount
      }).eq('id', wallet.id);
      strategy.remaining_buys--;
      strategy.consecutive_buys++;
      strategy.consecutive_sells = 0;
    } else {
      receipt = await executeSellTrade(
        web3,
        account,
        amount,
        config.sell_slippage,
        config.selected_token,
        config.selected_dex,
        config.selected_network
      );
      await supabase.from('wallets').update({
        total_sells: (await supabase.from('wallets').select('total_sells').eq('id', wallet.id).single()).data.total_sells + 1,
        total_volume: (await supabase.from('wallets').select('total_volume').eq('id', wallet.id).single()).data.total_volume + amount
      }).eq('id', wallet.id);
      strategy.remaining_sells--;
      strategy.consecutive_sells++;
      strategy.consecutive_buys = 0;
    }
    strategy.operations_left--;
    strategy.last_operation_time = new Date().toISOString();
    await supabase.from('wallet_strategies').update({
      remaining_buys: strategy.remaining_buys,
      remaining_sells: strategy.remaining_sells,
      operations_left: strategy.operations_left,
      operations: strategy.operations,
      consecutive_buys: strategy.consecutive_buys,
      consecutive_sells: strategy.consecutive_sells,
      last_operation_time: strategy.last_operation_time
    }).eq('wallet_id', wallet.id);
    await supabase.from('trading_history').insert({
      wallet_id: wallet.id,
      user_id: wallet.user_id,
      operation_type: isBuy ? 'buy' : 'sell',
      amount,
      token_address: config.selected_token,
      transaction_hash: receipt.transactionHash,
      success: true
    });
    await supabase.from('bot_logs').insert({
      user_id: wallet.user_id,
      wallet_id: wallet.id,
      message: `${isBuy ? 'BUY' : 'SELL'} ${amount} - TX: ${receipt.transactionHash}`,
      log_type: 'success'
    });
    console.log(`Wallet ${wallet.address.substring(0, 8)} - ${isBuy ? 'BUY' : 'SELL'} completed`);
  } catch (error: any) {
    console.error(`Error processing wallet ${wallet.address}:`, error);
    await supabase.from('wallets').update({
      errors: (await supabase.from('wallets').select('errors').eq('id', wallet.id).single()).data.errors + 1
    }).eq('id', wallet.id);
    await supabase.from('bot_logs').insert({
      user_id: wallet.user_id,
      wallet_id: wallet.id,
      message: `Error: ${error.message}`,
      log_type: 'error'
    });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: activeWallets, error: walletsError } = await supabase
      .from('wallets')
      .select('*')
      .eq('active', true);
    if (walletsError) throw walletsError;
    if (!activeWallets || activeWallets.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active wallets found', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const results = [];
    for (const wallet of activeWallets) {
      const { data: config } = await supabase
        .from('wallet_configurations')
        .select('*')
        .eq('wallet_id', wallet.id)
        .single();
      if (!config || !config.selected_token) {
        console.log(`Skipping wallet ${wallet.address} - no config or token`);
        continue;
      }
      let { data: strategy } = await supabase
        .from('wallet_strategies')
        .select('*')
        .eq('wallet_id', wallet.id)
        .single();
      if (!strategy) {
        const newStrategy = {
          wallet_id: wallet.id,
          user_id: wallet.user_id,
          remaining_buys: 5,
          remaining_sells: 5,
          operations_left: 10,
          operations: getRandomOperations(),
          consecutive_buys: 0,
          consecutive_sells: 0,
          amount_variability: 0.3 + Math.random() * 0.4,
          time_variability: 0.2 + Math.random() * 0.3,
          base_success_prob: 0.85 + Math.random() * 0.1,
          market_bias: -0.3 + Math.random() * 0.6,
          last_operation_time: null
        };
        await supabase.from('wallet_strategies').insert(newStrategy);
        strategy = newStrategy;
      }
      await processWallet(supabase, wallet, config, strategy);
      results.push({ wallet: wallet.address.substring(0, 8), status: 'processed' });
    }
    return new Response(
      JSON.stringify({ message: 'Trading bot executed', processed: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});