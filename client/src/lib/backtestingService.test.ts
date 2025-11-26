import { describe, it, expect, beforeEach } from 'vitest';
import { BacktestEngine, BacktestConfig } from './backtestingService';
import { DEFAULT_RISK_CONFIG } from './riskManagementService';

describe('Backtesting Service', () => {
  let config: BacktestConfig;
  let backtest: BacktestEngine;

  beforeEach(() => {
    config = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      initialCash: 10000,
      riskConfig: DEFAULT_RISK_CONFIG,
      strategy: 'sharpe-maximizer'
    };
    backtest = new BacktestEngine(config);
  });

  describe('Initialization', () => {
    it('should create backtest engine with config', () => {
      expect(backtest).toBeDefined();
    });

    it('should have empty results initially', () => {
      const results = backtest.getResults();
      expect(results.totalTrades).toBe(0);
    });
  });

  describe('Synthetic Data Generation', () => {
    it('should generate synthetic data', () => {
      backtest.generateSyntheticData(100, 100);
      const data = backtest.getHistoricalData();
      
      expect(data.length).toBe(100);
      expect(data[0].price).toBeGreaterThan(0);
    });

    it('should generate data with correct timestamps', () => {
      backtest.generateSyntheticData(100, 10);
      const data = backtest.getHistoricalData();
      
      for (let i = 1; i < data.length; i++) {
        expect(data[i].timestamp.getTime()).toBeGreaterThan(data[i - 1].timestamp.getTime());
      }
    });

    it('should prevent negative prices', () => {
      backtest.generateSyntheticData(50, 100);
      const data = backtest.getHistoricalData();
      
      for (const point of data) {
        expect(point.price).toBeGreaterThan(0);
      }
    });
  });

  describe('Backtest Execution', () => {
    it('should run backtest successfully', async () => {
      backtest.generateSyntheticData(100, 100);
      const results = await backtest.runBacktest();
      
      expect(results).toBeDefined();
      expect(results.totalTrades).toBeGreaterThanOrEqual(0);
    });

    it('should throw error without data', async () => {
      await expect(backtest.runBacktest()).rejects.toThrow('No historical data loaded');
    });

    it('should calculate win rate correctly', async () => {
      backtest.generateSyntheticData(100, 100);
      const results = await backtest.runBacktest();
      
      if (results.totalTrades > 0) {
        const expectedWinRate = (results.winningTrades / results.totalTrades) * 100;
        expect(results.winRate).toBeCloseTo(expectedWinRate, 1);
      }
    });

    it('should calculate max drawdown', async () => {
      backtest.generateSyntheticData(100, 100);
      const results = await backtest.runBacktest();
      
      expect(results.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(results.maxDrawdown).toBeLessThanOrEqual(100);
    });

    it('should calculate Sharpe ratio', async () => {
      backtest.generateSyntheticData(100, 100);
      const results = await backtest.runBacktest();
      
      expect(typeof results.sharpeRatio).toBe('number');
    });

    it('should calculate profit factor', async () => {
      backtest.generateSyntheticData(100, 100);
      const results = await backtest.runBacktest();
      
      expect(results.profitFactor).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Strategy Signals', () => {
    it('should generate momentum signals', async () => {
      const momentumBacktest = new BacktestEngine({
        ...config,
        strategy: 'momentum'
      });
      momentumBacktest.generateSyntheticData(100, 100);
      const results = await momentumBacktest.runBacktest();
      
      expect(results).toBeDefined();
    });

    it('should generate mean-reversion signals', async () => {
      const meanReversionBacktest = new BacktestEngine({
        ...config,
        strategy: 'mean-reversion'
      });
      meanReversionBacktest.generateSyntheticData(100, 100);
      const results = await meanReversionBacktest.runBacktest();
      
      expect(results).toBeDefined();
    });

    it('should generate sharpe-maximizer signals', async () => {
      const sharpeBacktest = new BacktestEngine({
        ...config,
        strategy: 'sharpe-maximizer'
      });
      sharpeBacktest.generateSyntheticData(100, 100);
      const results = await sharpeBacktest.runBacktest();
      
      expect(results).toBeDefined();
    });
  });

  describe('Results Calculation', () => {
    it('should have correct trade counts', async () => {
      backtest.generateSyntheticData(100, 100);
      const results = await backtest.runBacktest();
      
      expect(results.totalTrades).toBe(results.winningTrades + results.losingTrades);
    });

    it('should calculate average win/loss', async () => {
      backtest.generateSyntheticData(100, 100);
      const results = await backtest.runBacktest();
      
      if (results.winningTrades > 0) {
        expect(results.averageWin).toBeGreaterThan(0);
      }
      if (results.losingTrades > 0) {
        expect(results.averageLoss).toBeLessThanOrEqual(0);
      }
    });

    it('should track consecutive wins/losses', async () => {
      backtest.generateSyntheticData(100, 100);
      const results = await backtest.runBacktest();
      
      expect(results.consecutiveWins).toBeGreaterThanOrEqual(0);
      expect(results.consecutiveLosses).toBeGreaterThanOrEqual(0);
    });

    it('should calculate largest win/loss', async () => {
      backtest.generateSyntheticData(100, 100);
      const results = await backtest.runBacktest();
      
      if (results.winningTrades > 0) {
        expect(results.largestWin).toBeGreaterThanOrEqual(0);
      }
      if (results.losingTrades > 0) {
        expect(results.largestLoss).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('Data Loading', () => {
    it('should load historical data', () => {
      const data = [
        { timestamp: new Date('2024-01-01'), price: 100 },
        { timestamp: new Date('2024-01-02'), price: 105 },
        { timestamp: new Date('2024-01-03'), price: 103 }
      ];
      
      backtest.loadHistoricalData(data);
      const loaded = backtest.getHistoricalData();
      
      expect(loaded.length).toBe(3);
    });

    it('should filter data by date range', () => {
      const data = [
        { timestamp: new Date('2023-12-31'), price: 100 },
        { timestamp: new Date('2024-01-02'), price: 105 },
        { timestamp: new Date('2024-01-03'), price: 103 },
        { timestamp: new Date('2025-01-01'), price: 110 }
      ];
      
      backtest.loadHistoricalData(data);
      const loaded = backtest.getHistoricalData();
      
      // Should only include data within startDate and endDate
      expect(loaded.length).toBeLessThanOrEqual(2);
    });

    it('should sort data by timestamp', () => {
      const data = [
        { timestamp: new Date('2024-01-03'), price: 103 },
        { timestamp: new Date('2024-01-01'), price: 100 },
        { timestamp: new Date('2024-01-02'), price: 105 }
      ];
      
      backtest.loadHistoricalData(data);
      const loaded = backtest.getHistoricalData();
      
      for (let i = 1; i < loaded.length; i++) {
        expect(loaded[i].timestamp.getTime()).toBeGreaterThanOrEqual(loaded[i - 1].timestamp.getTime());
      }
    });
  });
});
