/**
 * Backtesting Engine
 * Replays historical data to test trading strategies
 */

import { TradingEngine, TradingState, DEFAULT_STATE } from './tradingService';
import { RiskManagementConfig } from './riskManagementService';

export interface BacktestConfig {
  startDate: Date;
  endDate: Date;
  initialCash: number;
  riskConfig: RiskManagementConfig;
  strategy: 'sharpe-maximizer' | 'mean-reversion' | 'momentum' | 'custom';
}

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  totalFees: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export interface HistoricalPrice {
  timestamp: Date;
  price: number;
  volume?: number;
}

export class BacktestEngine {
  private config: BacktestConfig;
  private historicalData: HistoricalPrice[] = [];
  private results: BacktestResult = {
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalPnL: 0,
    totalFees: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    profitFactor: 0,
    averageWin: 0,
    averageLoss: 0,
    largestWin: 0,
    largestLoss: 0,
    consecutiveWins: 0,
    consecutiveLosses: 0
  };

  constructor(config: BacktestConfig) {
    this.config = config;
  }

  /**
   * Load historical price data
   */
  loadHistoricalData(data: HistoricalPrice[]): void {
    this.historicalData = data
      .filter(d => d.timestamp >= this.config.startDate && d.timestamp <= this.config.endDate)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Generate synthetic historical data for testing
   */
  generateSyntheticData(startPrice: number = 100, dataPoints: number = 252): void {
    const data: HistoricalPrice[] = [];
    let price = startPrice;

    for (let i = 0; i < dataPoints; i++) {
      // Random walk with drift
      const drift = 0.0005;
      const volatility = 0.02;
      const change = drift + volatility * (Math.random() - 0.5);
      price = price * (1 + change);

      const timestamp = new Date(this.config.startDate);
      timestamp.setDate(timestamp.getDate() + i);

      data.push({
        timestamp,
        price: Math.max(price, startPrice * 0.5), // Prevent negative prices
        volume: Math.floor(Math.random() * 1000000) + 100000
      });
    }

    this.loadHistoricalData(data);
  }

  /**
   * Run backtest with strategy
   */
  async runBacktest(): Promise<BacktestResult> {
    if (this.historicalData.length === 0) {
      throw new Error('No historical data loaded');
    }

    let cash = this.config.initialCash;
    let position: { size: number; entryPrice: number; type: 'NONE' | 'LONG' } = { size: 0, entryPrice: 0, type: 'NONE' };
    let trades: Array<{ entryPrice: number; exitPrice: number; pnl: number; fee: number }> = [];
    let equity = [this.config.initialCash];
    let previousPrice = this.historicalData[0].price;

    // Simulate trading through historical data
    for (let i = 1; i < this.historicalData.length; i++) {
      const currentPrice = this.historicalData[i].price;
      const priceChange = (currentPrice - previousPrice) / previousPrice;

      // Generate trading signals based on strategy
      const signal = this.generateSignal(i, priceChange);

      // Execute trades
      if (signal === 'BUY' && position.type === 'NONE') {
        const positionSize = Math.floor(cash * 0.1 / currentPrice); // 10% of cash
        position = { size: positionSize, entryPrice: currentPrice, type: 'LONG' };
        cash -= positionSize * currentPrice;
      } else if (signal === 'SELL' && position.type === 'LONG') {
        const pnl = position.size * (currentPrice - position.entryPrice);
        const fee = position.size * currentPrice * 0.001; // 0.1% fee
        cash += position.size * currentPrice - fee;
        trades.push({
          entryPrice: position.entryPrice,
          exitPrice: currentPrice,
          pnl,
          fee
        });
        position = { size: 0, entryPrice: 0, type: 'NONE' };
      }

      // Update equity
      let currentEquity = cash;
      if (position.type === 'LONG') {
        currentEquity += position.size * currentPrice;
      }
      equity.push(currentEquity);

      previousPrice = currentPrice;
    }

    // Close any open position at end
    if (position.type === 'LONG') {
      const finalPrice = this.historicalData[this.historicalData.length - 1].price;
      const pnl = position.size * (finalPrice - position.entryPrice);
      const fee = position.size * finalPrice * 0.001;
      cash += position.size * finalPrice - fee;
      trades.push({
        entryPrice: position.entryPrice,
        exitPrice: finalPrice,
        pnl,
        fee
      });
    }

    // Calculate results
    this.results = this.calculateResults(trades, equity);
    return this.results;
  }

  /**
   * Generate trading signal based on strategy
   */
  private generateSignal(index: number, priceChange: number): 'BUY' | 'SELL' | 'HOLD' {
    switch (this.config.strategy) {
      case 'momentum':
        // Buy on positive momentum, sell on negative
        return priceChange > 0.01 ? 'BUY' : priceChange < -0.01 ? 'SELL' : 'HOLD';

      case 'mean-reversion':
        // Sell on large gains, buy on large losses
        return priceChange > 0.02 ? 'SELL' : priceChange < -0.02 ? 'BUY' : 'HOLD';

      case 'sharpe-maximizer':
        // More conservative, only trade on significant moves
        return Math.abs(priceChange) > 0.015 ? (priceChange > 0 ? 'BUY' : 'SELL') : 'HOLD';

      default:
        return 'HOLD';
    }
  }

  /**
   * Calculate backtest results
   */
  private calculateResults(trades: any[], equity: number[]): BacktestResult {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalPnL: 0,
        totalFees: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        profitFactor: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0
      };
    }

    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl <= 0);
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const totalFees = trades.reduce((sum, t) => sum + t.fee, 0);

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = equity[0];
    for (let i = 1; i < equity.length; i++) {
      if (equity[i] > peak) peak = equity[i];
      const drawdown = (peak - equity[i]) / peak * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Calculate Sharpe ratio
    const returns = [];
    for (let i = 1; i < equity.length; i++) {
      returns.push((equity[i] - equity[i - 1]) / equity[i - 1]);
    }
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(252);

    // Calculate profit factor
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss === 0 ? 0 : grossProfit / grossLoss;

    // Calculate consecutive wins/losses
    let consecutiveWins = 0;
    let maxConsecutiveWins = 0;
    let consecutiveLosses = 0;
    let maxConsecutiveLosses = 0;

    for (const trade of trades) {
      if (trade.pnl > 0) {
        consecutiveWins++;
        consecutiveLosses = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins);
      } else {
        consecutiveLosses++;
        consecutiveWins = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);
      }
    }

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / trades.length) * 100,
      totalPnL,
      totalFees,
      maxDrawdown,
      sharpeRatio,
      profitFactor,
      averageWin: winningTrades.length > 0 ? grossProfit / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? grossLoss / losingTrades.length : 0,
      largestWin: Math.max(...trades.map(t => t.pnl), 0),
      largestLoss: Math.min(...trades.map(t => t.pnl), 0),
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses
    };
  }

  /**
   * Get backtest results
   */
  getResults(): BacktestResult {
    return this.results;
  }

  /**
   * Get historical data
   */
  getHistoricalData(): HistoricalPrice[] {
    return [...this.historicalData];
  }
}
