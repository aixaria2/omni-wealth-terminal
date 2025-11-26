/**
 * Technical Indicators Service
 * Provides calculations for RSI, MACD, and Bollinger Bands
 */

export interface IndicatorValues {
  rsi: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
}

/**
 * Calculate Relative Strength Index (RSI)
 * Measures momentum on a scale of 0-100
 * @param prices Array of prices
 * @param period Period for RSI calculation (default 14)
 * @returns RSI value (0-100)
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 0;

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? -c : 0);

  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

  if (avgLoss === 0) return avgGain > 0 ? 100 : 0;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return rsi;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param prices Array of prices
 * @returns MACD line, signal line, and histogram
 */
export function calculateMACD(prices: number[]): { line: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);

  const macdLine = ema12 - ema26;

  // Calculate signal line (9-period EMA of MACD line)
  // For simplicity, we'll use a simplified approach
  const signalLine = macdLine * 0.67; // Approximation

  const histogram = macdLine - signalLine;

  return {
    line: macdLine,
    signal: signalLine,
    histogram
  };
}

/**
 * Calculate Exponential Moving Average
 * @param prices Array of prices
 * @param period EMA period
 * @returns EMA value
 */
function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;

  const k = 2 / (period + 1);
  let ema = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
}

/**
 * Calculate Bollinger Bands
 * @param prices Array of prices
 * @param period Period for moving average (default 20)
 * @param stdDevMultiplier Standard deviation multiplier (default 2)
 * @returns Upper, middle, and lower bands
 */
export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): { upper: number; middle: number; lower: number } {
  if (prices.length < period) {
    return { upper: 0, middle: 0, lower: 0 };
  }

  const slice = prices.slice(-period);
  const sma = slice.reduce((a, b) => a + b, 0) / period;

  const variance = slice.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: sma + (stdDev * stdDevMultiplier),
    middle: sma,
    lower: sma - (stdDev * stdDevMultiplier)
  };
}

/**
 * Calculate all indicators at once
 * @param prices Array of prices
 * @returns All indicator values
 */
export function calculateAllIndicators(prices: number[]): IndicatorValues {
  return {
    rsi: calculateRSI(prices),
    macd: calculateMACD(prices),
    bollingerBands: calculateBollingerBands(prices)
  };
}

/**
 * Generate trading signals based on indicators
 */
export function generateIndicatorSignals(indicators: IndicatorValues): {
  rsiSignal: 'overbought' | 'oversold' | 'neutral';
  macdSignal: 'bullish' | 'bearish' | 'neutral';
  bbSignal: 'upper' | 'lower' | 'neutral';
} {
  // RSI signals
  let rsiSignal: 'overbought' | 'oversold' | 'neutral' = 'neutral';
  if (indicators.rsi > 70) rsiSignal = 'overbought';
  else if (indicators.rsi < 30) rsiSignal = 'oversold';

  // MACD signals
  let macdSignal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (indicators.macd.histogram > 0) macdSignal = 'bullish';
  else if (indicators.macd.histogram < 0) macdSignal = 'bearish';

  // Bollinger Bands signals (placeholder - would need current price)
  let bbSignal: 'upper' | 'lower' | 'neutral' = 'neutral';

  return { rsiSignal, macdSignal, bbSignal };
}
