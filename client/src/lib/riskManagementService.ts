/**
 * Risk Management Service
 * Handles stop-loss and take-profit order management
 */

export interface RiskManagementConfig {
  stopLossPercent: number; // e.g., 2 for 2% stop loss
  takeProfitPercent: number; // e.g., 5 for 5% take profit
  enabled: boolean;
}

export interface RiskLevel {
  stopLossPrice: number;
  takeProfitPrice: number;
  riskReward: number; // Ratio of potential profit to potential loss
}

export const DEFAULT_RISK_CONFIG: RiskManagementConfig = {
  stopLossPercent: 2,
  takeProfitPercent: 5,
  enabled: true
};

/**
 * Calculate stop-loss and take-profit prices for a position
 * @param entryPrice Entry price of the position
 * @param positionType 'LONG' or 'SHORT'
 * @param config Risk management configuration
 * @returns Stop-loss price, take-profit price, and risk/reward ratio
 */
export function calculateRiskLevels(
  entryPrice: number,
  positionType: 'LONG' | 'SHORT',
  config: RiskManagementConfig
): RiskLevel {
  if (positionType === 'LONG') {
    const stopLossPrice = entryPrice * (1 - config.stopLossPercent / 100);
    const takeProfitPrice = entryPrice * (1 + config.takeProfitPercent / 100);
    const riskReward = config.takeProfitPercent / config.stopLossPercent;

    return { stopLossPrice, takeProfitPrice, riskReward };
  } else {
    // SHORT position
    const stopLossPrice = entryPrice * (1 + config.stopLossPercent / 100);
    const takeProfitPrice = entryPrice * (1 - config.takeProfitPercent / 100);
    const riskReward = config.takeProfitPercent / config.stopLossPercent;

    return { stopLossPrice, takeProfitPrice, riskReward };
  }
}

/**
 * Check if stop-loss or take-profit has been triggered
 * @param currentPrice Current market price
 * @param riskLevels Risk levels for the position
 * @param positionType 'LONG' or 'SHORT'
 * @returns 'stop-loss', 'take-profit', or null if neither triggered
 */
export function checkRiskTriggers(
  currentPrice: number,
  riskLevels: RiskLevel,
  positionType: 'LONG' | 'SHORT'
): 'stop-loss' | 'take-profit' | null {
  if (positionType === 'LONG') {
    if (currentPrice <= riskLevels.stopLossPrice) {
      return 'stop-loss';
    }
    if (currentPrice >= riskLevels.takeProfitPrice) {
      return 'take-profit';
    }
  } else {
    // SHORT position
    if (currentPrice >= riskLevels.stopLossPrice) {
      return 'stop-loss';
    }
    if (currentPrice <= riskLevels.takeProfitPrice) {
      return 'take-profit';
    }
  }

  return null;
}

/**
 * Calculate position size based on risk management
 * @param accountSize Total account size
 param riskPercent Percentage of account to risk per trade
 * @param entryPrice Entry price
 * @param stopLossPrice Stop-loss price
 * @returns Recommended position size
 */
export function calculatePositionSize(
  accountSize: number,
  riskPercent: number,
  entryPrice: number,
  stopLossPrice: number
): number {
  const riskAmount = accountSize * (riskPercent / 100);
  const priceRisk = Math.abs(entryPrice - stopLossPrice);

  if (priceRisk === 0) return 0;

  return riskAmount / priceRisk;
}

/**
 * Calculate maximum loss for a position
 * @param positionSize Size of the position
 * @param entryPrice Entry price
 * @param stopLossPrice Stop-loss price
 * @returns Maximum loss in currency units
 */
export function calculateMaxLoss(
  positionSize: number,
  entryPrice: number,
  stopLossPrice: number
): number {
  return positionSize * Math.abs(entryPrice - stopLossPrice);
}

/**
 * Calculate maximum profit for a position
 * @param positionSize Size of the position
 * @param entryPrice Entry price
 * @param takeProfitPrice Take-profit price
 * @returns Maximum profit in currency units
 */
export function calculateMaxProfit(
  positionSize: number,
  entryPrice: number,
  takeProfitPrice: number
): number {
  return positionSize * Math.abs(takeProfitPrice - entryPrice);
}
