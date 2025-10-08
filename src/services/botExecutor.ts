import { supabase } from '../lib/supabase';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trading-bot-executor`;
const EXECUTION_INTERVAL = 30000;

class BotExecutor {
  private intervalId: number | null = null;
  private isRunning = false;
  private lastExecution: Date | null = null;
  private executionCount = 0;
  private errorCount = 0;

  async executeBot(): Promise<void> {
    try {
      console.log('[BotExecutor] Executing trading bot...');

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.warn('[BotExecutor] No active session, skipping execution');
        return;
      }

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Edge function failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      this.lastExecution = new Date();
      this.executionCount++;

      console.log('[BotExecutor] Execution successful:', result);

      if (result.processed > 0) {
        console.log(`[BotExecutor] Processed ${result.processed} active wallet(s)`);
      }
    } catch (error) {
      this.errorCount++;
      console.error('[BotExecutor] Execution failed:', error);

      if (this.errorCount >= 5) {
        console.error('[BotExecutor] Too many consecutive errors, stopping executor');
        this.stop();
      }
    }
  }

  start(): void {
    if (this.isRunning) {
      console.warn('[BotExecutor] Already running');
      return;
    }

    console.log('[BotExecutor] Starting bot executor (30s interval)...');
    this.isRunning = true;
    this.errorCount = 0;

    this.executeBot();

    this.intervalId = window.setInterval(() => {
      this.executeBot();
    }, EXECUTION_INTERVAL);
  }

  stop(): void {
    if (!this.isRunning) {
      console.warn('[BotExecutor] Not running');
      return;
    }

    console.log('[BotExecutor] Stopping bot executor...');

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastExecution: this.lastExecution,
      executionCount: this.executionCount,
      errorCount: this.errorCount,
    };
  }
}

export const botExecutor = new BotExecutor();
