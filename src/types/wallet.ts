export interface WalletMetrics {
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

export interface WalletStrategy {
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
  lastOperationTime?: string | null;
}

export interface WalletConfig {
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
  selectedNetwork?: string;
  selectedDex?: string;
}
