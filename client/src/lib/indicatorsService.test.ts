import { describe, it, expect } from 'vitest';
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateAllIndicators,
  generateIndicatorSignals
} from './indicatorsService';

describe('Indicators Service', () => {
  describe('calculateRSI', () => {
    it('should return 0 for insufficient data', () => {
      const prices = [100, 101, 102];
      const rsi = calculateRSI(prices, 14);
      expect(rsi).toBe(0);
    });

    it('should return value between 0 and 100', () => {
      const prices = Array.from({ length: 20 }, (_, i) => 100 + Math.sin(i) * 5);
      const rsi = calculateRSI(prices);
      expect(rsi).toBeGreaterThanOrEqual(0);
      expect(rsi).toBeLessThanOrEqual(100);
    });

    it('should detect overbought conditions', () => {
      const prices = Array.from({ length: 20 }, (_, i) => 100 + i * 2);
      const rsi = calculateRSI(prices);
      expect(rsi).toBeGreaterThan(70);
    });

    it('should detect oversold conditions', () => {
      const prices = Array.from({ length: 20 }, (_, i) => 100 - i * 2);
      const rsi = calculateRSI(prices);
      expect(rsi).toBeLessThan(30);
    });
  });

  describe('calculateMACD', () => {
    it('should return MACD values', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 5);
      const macd = calculateMACD(prices);
      expect(macd).toHaveProperty('line');
      expect(macd).toHaveProperty('signal');
      expect(macd).toHaveProperty('histogram');
    });

    it('should calculate histogram as difference between line and signal', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + i * 0.5);
      const macd = calculateMACD(prices);
      expect(macd.histogram).toBe(macd.line - macd.signal);
    });

    it('should show positive histogram for uptrend', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + i * 2);
      const macd = calculateMACD(prices);
      expect(macd.histogram).toBeGreaterThan(0);
    });
  });

  describe('calculateBollingerBands', () => {
    it('should return bands with upper > middle > lower', () => {
      const prices = Array.from({ length: 25 }, (_, i) => 100 + Math.sin(i) * 5);
      const bands = calculateBollingerBands(prices);
      expect(bands.upper).toBeGreaterThan(bands.middle);
      expect(bands.middle).toBeGreaterThan(bands.lower);
    });

    it('should return 0 for insufficient data', () => {
      const prices = [100, 101, 102];
      const bands = calculateBollingerBands(prices, 20);
      expect(bands.upper).toBe(0);
      expect(bands.middle).toBe(0);
      expect(bands.lower).toBe(0);
    });

    it('should have middle band as SMA', () => {
      const prices = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124, 126, 128, 130, 132, 134, 136, 138];
      const bands = calculateBollingerBands(prices, 20);
      const sma = prices.reduce((a, b) => a + b, 0) / prices.length;
      expect(bands.middle).toBeCloseTo(sma, 1);
    });
  });

  describe('calculateAllIndicators', () => {
    it('should return all indicator values', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 5);
      const indicators = calculateAllIndicators(prices);
      expect(indicators).toHaveProperty('rsi');
      expect(indicators).toHaveProperty('macd');
      expect(indicators).toHaveProperty('bollingerBands');
    });

    it('should have valid RSI value', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + i * 0.5);
      const indicators = calculateAllIndicators(prices);
      expect(indicators.rsi).toBeGreaterThanOrEqual(0);
      expect(indicators.rsi).toBeLessThanOrEqual(100);
    });
  });

  describe('generateIndicatorSignals', () => {
    it('should identify overbought RSI', () => {
      const indicators = {
        rsi: 75,
        macd: { line: 0, signal: 0, histogram: 0 },
        bollingerBands: { upper: 100, middle: 95, lower: 90 }
      };
      const signals = generateIndicatorSignals(indicators);
      expect(signals.rsiSignal).toBe('overbought');
    });

    it('should identify oversold RSI', () => {
      const indicators = {
        rsi: 25,
        macd: { line: 0, signal: 0, histogram: 0 },
        bollingerBands: { upper: 100, middle: 95, lower: 90 }
      };
      const signals = generateIndicatorSignals(indicators);
      expect(signals.rsiSignal).toBe('oversold');
    });

    it('should identify bullish MACD', () => {
      const indicators = {
        rsi: 50,
        macd: { line: 1, signal: 0.5, histogram: 0.5 },
        bollingerBands: { upper: 100, middle: 95, lower: 90 }
      };
      const signals = generateIndicatorSignals(indicators);
      expect(signals.macdSignal).toBe('bullish');
    });

    it('should identify bearish MACD', () => {
      const indicators = {
        rsi: 50,
        macd: { line: 0.5, signal: 1, histogram: -0.5 },
        bollingerBands: { upper: 100, middle: 95, lower: 90 }
      };
      const signals = generateIndicatorSignals(indicators);
      expect(signals.macdSignal).toBe('bearish');
    });
  });
});
