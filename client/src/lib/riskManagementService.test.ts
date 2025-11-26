import { describe, it, expect } from 'vitest';
import {
  calculateRiskLevels,
  checkRiskTriggers,
  calculatePositionSize,
  calculateMaxLoss,
  calculateMaxProfit,
  DEFAULT_RISK_CONFIG
} from './riskManagementService';

describe('Risk Management Service', () => {
  describe('calculateRiskLevels', () => {
    it('should calculate correct stop-loss and take-profit for LONG position', () => {
      const entryPrice = 100;
      const levels = calculateRiskLevels(entryPrice, 'LONG', DEFAULT_RISK_CONFIG);
      
      expect(levels.stopLossPrice).toBe(100 * (1 - DEFAULT_RISK_CONFIG.stopLossPercent / 100));
      expect(levels.takeProfitPrice).toBe(100 * (1 + DEFAULT_RISK_CONFIG.takeProfitPercent / 100));
    });

    it('should calculate correct stop-loss and take-profit for SHORT position', () => {
      const entryPrice = 100;
      const levels = calculateRiskLevels(entryPrice, 'SHORT', DEFAULT_RISK_CONFIG);
      
      expect(levels.stopLossPrice).toBe(100 * (1 + DEFAULT_RISK_CONFIG.stopLossPercent / 100));
      expect(levels.takeProfitPrice).toBe(100 * (1 - DEFAULT_RISK_CONFIG.takeProfitPercent / 100));
    });

    it('should calculate risk/reward ratio', () => {
      const levels = calculateRiskLevels(100, 'LONG', DEFAULT_RISK_CONFIG);
      const expectedRatio = DEFAULT_RISK_CONFIG.takeProfitPercent / DEFAULT_RISK_CONFIG.stopLossPercent;
      expect(levels.riskReward).toBe(expectedRatio);
    });

    it('should handle custom risk config', () => {
      const customConfig = { stopLossPercent: 5, takeProfitPercent: 10, enabled: true };
      const levels = calculateRiskLevels(100, 'LONG', customConfig);
      
      expect(levels.stopLossPrice).toBeCloseTo(95, 5);
      expect(levels.takeProfitPrice).toBeCloseTo(110, 5);
      expect(levels.riskReward).toBeCloseTo(2, 5);
    });
  });

  describe('checkRiskTriggers', () => {
    it('should trigger stop-loss for LONG position when price falls below stop', () => {
      const riskLevels = { stopLossPrice: 95, takeProfitPrice: 105, riskReward: 2.5 };
      const trigger = checkRiskTriggers(94, riskLevels, 'LONG');
      expect(trigger).toBe('stop-loss');
    });

    it('should trigger take-profit for LONG position when price rises above target', () => {
      const riskLevels = { stopLossPrice: 95, takeProfitPrice: 105, riskReward: 2.5 };
      const trigger = checkRiskTriggers(106, riskLevels, 'LONG');
      expect(trigger).toBe('take-profit');
    });

    it('should not trigger for LONG position when price is between levels', () => {
      const riskLevels = { stopLossPrice: 95, takeProfitPrice: 105, riskReward: 2.5 };
      const trigger = checkRiskTriggers(100, riskLevels, 'LONG');
      expect(trigger).toBeNull();
    });

    it('should trigger stop-loss for SHORT position when price rises above stop', () => {
      const riskLevels = { stopLossPrice: 105, takeProfitPrice: 95, riskReward: 2.5 };
      const trigger = checkRiskTriggers(106, riskLevels, 'SHORT');
      expect(trigger).toBe('stop-loss');
    });

    it('should trigger take-profit for SHORT position when price falls below target', () => {
      const riskLevels = { stopLossPrice: 105, takeProfitPrice: 95, riskReward: 2.5 };
      const trigger = checkRiskTriggers(94, riskLevels, 'SHORT');
      expect(trigger).toBe('take-profit');
    });
  });

  describe('calculatePositionSize', () => {
    it('should calculate position size based on risk parameters', () => {
      const accountSize = 10000;
      const riskPercent = 2;
      const entryPrice = 100;
      const stopLossPrice = 95;
      
      const size = calculatePositionSize(accountSize, riskPercent, entryPrice, stopLossPrice);
      
      const expectedRisk = accountSize * (riskPercent / 100);
      const expectedSize = expectedRisk / (entryPrice - stopLossPrice);
      expect(size).toBe(expectedSize);
    });

    it('should return 0 when price risk is 0', () => {
      const size = calculatePositionSize(10000, 2, 100, 100);
      expect(size).toBe(0);
    });

    it('should scale position size with account size', () => {
      const size1 = calculatePositionSize(10000, 2, 100, 95);
      const size2 = calculatePositionSize(20000, 2, 100, 95);
      expect(size2).toBe(size1 * 2);
    });
  });

  describe('calculateMaxLoss', () => {
    it('should calculate maximum loss correctly', () => {
      const positionSize = 10;
      const entryPrice = 100;
      const stopLossPrice = 95;
      
      const maxLoss = calculateMaxLoss(positionSize, entryPrice, stopLossPrice);
      expect(maxLoss).toBe(50); // 10 * (100 - 95)
    });

    it('should handle SHORT positions', () => {
      const positionSize = 10;
      const entryPrice = 100;
      const stopLossPrice = 105;
      
      const maxLoss = calculateMaxLoss(positionSize, entryPrice, stopLossPrice);
      expect(maxLoss).toBe(50); // 10 * (105 - 100)
    });
  });

  describe('calculateMaxProfit', () => {
    it('should calculate maximum profit correctly', () => {
      const positionSize = 10;
      const entryPrice = 100;
      const takeProfitPrice = 110;
      
      const maxProfit = calculateMaxProfit(positionSize, entryPrice, takeProfitPrice);
      expect(maxProfit).toBe(100); // 10 * (110 - 100)
    });

    it('should handle SHORT positions', () => {
      const positionSize = 10;
      const entryPrice = 100;
      const takeProfitPrice = 90;
      
      const maxProfit = calculateMaxProfit(positionSize, entryPrice, takeProfitPrice);
      expect(maxProfit).toBe(100); // 10 * (100 - 90)
    });
  });
});
