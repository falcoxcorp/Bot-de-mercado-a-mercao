/*
  # Add Service Role Policies for Edge Functions

  1. Changes
    - Add policies to allow service role (Edge Functions) to read/write data
    - These policies are needed for the trading bot Edge Function to operate

  2. Security
    - Service role can access all data (needed for bot operations)
    - User policies remain unchanged
*/

-- Wallets table: Service role can read and update
CREATE POLICY "Service role can read all wallets"
  ON wallets FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update all wallets"
  ON wallets FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Wallet Configurations: Service role can read
CREATE POLICY "Service role can read all wallet configs"
  ON wallet_configurations FOR SELECT
  TO service_role
  USING (true);

-- Trading History: Service role can insert
CREATE POLICY "Service role can insert trading history"
  ON trading_history FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Bot Logs: Service role can insert
CREATE POLICY "Service role can insert bot logs"
  ON bot_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Wallet Strategies: Service role can read and update
CREATE POLICY "Service role can read all wallet strategies"
  ON wallet_strategies FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update all wallet strategies"
  ON wallet_strategies FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);