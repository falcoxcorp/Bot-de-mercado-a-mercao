import { supabase } from '../lib/supabase';
import { Wallet, WalletConfig, WalletStrategy } from '../types/wallet';

export const walletService = {
  supabase,
  async loadUserWallets(userId: string): Promise<Wallet[]> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return data.map(w => ({
      address: w.address,
      privateKey: w.encrypted_private_key,
      name: w.name,
      metrics: {
        totalBuys: w.total_buys,
        totalSells: w.total_sells,
        totalVolume: w.total_volume,
        errors: w.errors
      },
      active: w.active,
      showPrivateKey: false,
      isImported: w.is_imported
    }));
  },

  async saveWallet(userId: string, wallet: Wallet): Promise<void> {
    const { error } = await supabase
      .from('wallets')
      .upsert({
        user_id: userId,
        address: wallet.address,
        encrypted_private_key: wallet.privateKey,
        name: wallet.name,
        active: wallet.active,
        is_imported: wallet.isImported || false,
        total_buys: wallet.metrics.totalBuys,
        total_sells: wallet.metrics.totalSells,
        total_volume: wallet.metrics.totalVolume,
        errors: wallet.metrics.errors
      }, {
        onConflict: 'user_id,address'
      });

    if (error) throw error;
  },

  async deleteWallet(userId: string, address: string): Promise<void> {
    const { error } = await supabase
      .from('wallets')
      .delete()
      .eq('user_id', userId)
      .eq('address', address);

    if (error) throw error;
  },

  async updateWalletMetrics(userId: string, address: string, metrics: any): Promise<void> {
    const { error } = await supabase
      .from('wallets')
      .update({
        total_buys: metrics.totalBuys,
        total_sells: metrics.totalSells,
        total_volume: metrics.totalVolume,
        errors: metrics.errors
      })
      .eq('user_id', userId)
      .eq('address', address);

    if (error) throw error;
  },

  async toggleWalletActive(userId: string, address: string, active: boolean): Promise<void> {
    const { error } = await supabase
      .from('wallets')
      .update({ active })
      .eq('user_id', userId)
      .eq('address', address);

    if (error) throw error;
  },

  async loadWalletConfig(walletId: string): Promise<WalletConfig | null> {
    const { data, error } = await supabase
      .from('wallet_configurations')
      .select('*')
      .eq('wallet_id', walletId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      minBuyAmount: Number(data.min_buy_amount),
      maxBuyAmount: Number(data.max_buy_amount),
      buySlippage: Number(data.buy_slippage),
      buyIntervalHours: data.buy_interval_hours,
      buyIntervalMinutes: data.buy_interval_minutes,
      buyIntervalSeconds: data.buy_interval_seconds,
      minSellAmount: Number(data.min_sell_amount),
      maxSellAmount: Number(data.max_sell_amount),
      sellSlippage: Number(data.sell_slippage),
      sellIntervalHours: data.sell_interval_hours,
      sellIntervalMinutes: data.sell_interval_minutes,
      sellIntervalSeconds: data.sell_interval_seconds,
      selectedToken: data.selected_token,
      selectedNetwork: data.selected_network,
      selectedDex: data.selected_dex
    };
  },

  async saveWalletConfig(userId: string, walletId: string, config: WalletConfig): Promise<void> {
    const { error } = await supabase
      .from('wallet_configurations')
      .upsert({
        wallet_id: walletId,
        user_id: userId,
        min_buy_amount: config.minBuyAmount,
        max_buy_amount: config.maxBuyAmount,
        buy_slippage: config.buySlippage,
        buy_interval_hours: config.buyIntervalHours,
        buy_interval_minutes: config.buyIntervalMinutes,
        buy_interval_seconds: config.buyIntervalSeconds,
        min_sell_amount: config.minSellAmount,
        max_sell_amount: config.maxSellAmount,
        sell_slippage: config.sellSlippage,
        sell_interval_hours: config.sellIntervalHours,
        sell_interval_minutes: config.sellIntervalMinutes,
        sell_interval_seconds: config.sellIntervalSeconds,
        selected_token: config.selectedToken,
        selected_network: config.selectedNetwork || 'core',
        selected_dex: config.selectedDex || ''
      }, {
        onConflict: 'wallet_id'
      });

    if (error) throw error;
  },

  async loadWalletStrategy(walletId: string): Promise<WalletStrategy | null> {
    const { data, error } = await supabase
      .from('wallet_strategies')
      .select('*')
      .eq('wallet_id', walletId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      currentCycle: {
        remainingBuys: data.remaining_buys,
        remainingSells: data.remaining_sells,
        operationsLeft: data.operations_left,
        operations: data.operations as string[]
      },
      consecutiveBuys: data.consecutive_buys,
      consecutiveSells: data.consecutive_sells,
      amountVariability: Number(data.amount_variability),
      timeVariability: Number(data.time_variability),
      baseSuccessProb: Number(data.base_success_prob),
      marketBias: Number(data.market_bias)
    };
  },

  async saveWalletStrategy(userId: string, walletId: string, strategy: WalletStrategy): Promise<void> {
    const { error } = await supabase
      .from('wallet_strategies')
      .upsert({
        wallet_id: walletId,
        user_id: userId,
        remaining_buys: strategy.currentCycle.remainingBuys,
        remaining_sells: strategy.currentCycle.remainingSells,
        operations_left: strategy.currentCycle.operationsLeft,
        operations: strategy.currentCycle.operations,
        consecutive_buys: strategy.consecutiveBuys,
        consecutive_sells: strategy.consecutiveSells,
        amount_variability: strategy.amountVariability,
        time_variability: strategy.timeVariability,
        base_success_prob: strategy.baseSuccessProb,
        market_bias: strategy.marketBias,
        last_operation_time: new Date().toISOString()
      }, {
        onConflict: 'wallet_id'
      });

    if (error) throw error;
  },

  async addLog(userId: string, walletId: string | null, message: string, logType: string): Promise<void> {
    const { error } = await supabase
      .from('bot_logs')
      .insert({
        user_id: userId,
        wallet_id: walletId,
        message,
        log_type: logType
      });

    if (error) console.error('Error adding log:', error);
  },

  async getLogs(userId: string, limit: number = 100): Promise<any[]> {
    const { data, error } = await supabase
      .from('bot_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getWalletIdByAddress(userId: string, address: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .eq('address', address)
      .maybeSingle();

    if (error) {
      console.error('Error getting wallet ID:', error);
      return null;
    }

    return data?.id || null;
  }
};
