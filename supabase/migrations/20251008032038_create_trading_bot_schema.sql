/*
  # Trading Bot Schema - Complete Database Structure

  ## Overview
  This migration creates the complete database schema for a 24/7 automated trading bot
  that continues running even when users are offline.

  ## Tables Created

  ### 1. `user_profiles`
  - Extends auth.users with trading-specific profile data
  - Stores user preferences and settings
  - Links to auth.users via user_id

  ### 2. `wallets`
  - Stores wallet addresses and encrypted private keys
  - Each wallet belongs to a user
  - Tracks wallet status (active/inactive)
  - Stores wallet metrics (total buys, sells, volume, errors)

  ### 3. `wallet_configurations`
  - Trading parameters per wallet (buy/sell amounts, slippage, intervals)
  - Each wallet can have custom configuration
  - Stores selected token pairs for trading

  ### 4. `trading_history`
  - Complete log of all trading operations
  - Tracks buy/sell operations, amounts, prices
  - Links to specific wallets
  - Records success/failure status

  ### 5. `bot_logs`
  - System logs for monitoring and debugging
  - Categorized by type (info, warning, error, success)
  - Timestamps for all events
  - User-specific and global logs

  ### 6. `wallet_strategies`
  - AI-driven trading strategies per wallet
  - Stores cycle information and operation sequences
  - Tracks consecutive buy/sell patterns
  - Market bias and success probability factors

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Private keys are stored encrypted
  - Policies enforce data isolation per user

  ## Important Notes
  - Private keys should be encrypted before storage
  - All timestamps use timestamptz for consistency
  - Indexes added for performance on frequent queries
  - Foreign keys ensure data integrity
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address text NOT NULL,
  encrypted_private_key text,
  name text NOT NULL DEFAULT '',
  active boolean DEFAULT false NOT NULL,
  is_imported boolean DEFAULT false NOT NULL,
  total_buys integer DEFAULT 0 NOT NULL,
  total_sells integer DEFAULT 0 NOT NULL,
  total_volume numeric DEFAULT 0 NOT NULL,
  errors integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, address)
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets"
  ON wallets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wallets"
  ON wallets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for active wallets (used by Edge Function)
CREATE INDEX IF NOT EXISTS idx_wallets_active ON wallets(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- Wallet Configurations Table
CREATE TABLE IF NOT EXISTS wallet_configurations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id uuid REFERENCES wallets(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  min_buy_amount numeric DEFAULT 0.01 NOT NULL,
  max_buy_amount numeric DEFAULT 0.1 NOT NULL,
  buy_slippage numeric DEFAULT 1 NOT NULL,
  buy_interval_hours integer DEFAULT 0 NOT NULL,
  buy_interval_minutes integer DEFAULT 1 NOT NULL,
  buy_interval_seconds integer DEFAULT 0 NOT NULL,
  min_sell_amount numeric DEFAULT 0.01 NOT NULL,
  max_sell_amount numeric DEFAULT 0.1 NOT NULL,
  sell_slippage numeric DEFAULT 1 NOT NULL,
  sell_interval_hours integer DEFAULT 0 NOT NULL,
  sell_interval_minutes integer DEFAULT 1 NOT NULL,
  sell_interval_seconds integer DEFAULT 0 NOT NULL,
  selected_token text DEFAULT '' NOT NULL,
  selected_network text DEFAULT 'core' NOT NULL,
  selected_dex text DEFAULT '' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE wallet_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet configs"
  ON wallet_configurations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet configs"
  ON wallet_configurations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet configs"
  ON wallet_configurations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wallet configs"
  ON wallet_configurations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wallet_configs_wallet_id ON wallet_configurations(wallet_id);

-- Trading History Table
CREATE TABLE IF NOT EXISTS trading_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id uuid REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  operation_type text NOT NULL CHECK (operation_type IN ('buy', 'sell')),
  amount numeric NOT NULL,
  token_address text NOT NULL,
  transaction_hash text,
  success boolean DEFAULT false NOT NULL,
  error_message text,
  gas_used numeric,
  gas_price numeric,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE trading_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trading history"
  ON trading_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trading history"
  ON trading_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trading_history_wallet_id ON trading_history(wallet_id);
CREATE INDEX IF NOT EXISTS idx_trading_history_created_at ON trading_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_history_user_id ON trading_history(user_id);

-- Bot Logs Table
CREATE TABLE IF NOT EXISTS bot_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid REFERENCES wallets(id) ON DELETE CASCADE,
  message text NOT NULL,
  log_type text NOT NULL CHECK (log_type IN ('info', 'warning', 'error', 'success')),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE bot_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
  ON bot_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON bot_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bot_logs_user_id ON bot_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_logs_created_at ON bot_logs(created_at DESC);

-- Wallet Strategies Table
CREATE TABLE IF NOT EXISTS wallet_strategies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id uuid REFERENCES wallets(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  remaining_buys integer DEFAULT 5 NOT NULL,
  remaining_sells integer DEFAULT 5 NOT NULL,
  operations_left integer DEFAULT 10 NOT NULL,
  operations jsonb DEFAULT '["buy","buy","buy","buy","buy","sell","sell","sell","sell","sell"]'::jsonb NOT NULL,
  consecutive_buys integer DEFAULT 0 NOT NULL,
  consecutive_sells integer DEFAULT 0 NOT NULL,
  amount_variability numeric DEFAULT 0.3 NOT NULL,
  time_variability numeric DEFAULT 0.2 NOT NULL,
  base_success_prob numeric DEFAULT 0.85 NOT NULL,
  market_bias numeric DEFAULT 0 NOT NULL,
  last_operation_time timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE wallet_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own strategies"
  ON wallet_strategies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategies"
  ON wallet_strategies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategies"
  ON wallet_strategies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategies"
  ON wallet_strategies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wallet_strategies_wallet_id ON wallet_strategies(wallet_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_configurations_updated_at BEFORE UPDATE ON wallet_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_strategies_updated_at BEFORE UPDATE ON wallet_strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();