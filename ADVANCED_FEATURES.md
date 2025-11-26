# Advanced Features Documentation

This document describes the three advanced features added to the OMNI Wealth Terminal: Database Persistence API, Advanced Alerts, and Backtesting Engine.

## 1. Database Persistence API (tRPC)

### Overview
The Database Persistence API provides secure, type-safe access to trade history and performance metrics through tRPC procedures. All data is stored in MySQL and associated with the authenticated user.

### Database Schema

#### Trades Table
```sql
CREATE TABLE trades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  action VARCHAR(10),
  type VARCHAR(10),
  entryPrice DECIMAL(20, 8),
  exitPrice DECIMAL(20, 8),
  size DECIMAL(20, 8),
  pnl DECIMAL(20, 8),
  fee DECIMAL(20, 8),
  reason VARCHAR(255),
  sharpeRatio DECIMAL(10, 4),
  volatility DECIMAL(10, 4),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Performance Metrics Table
```sql
CREATE TABLE performanceMetrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  date DATE,
  totalTrades INT,
  winningTrades INT,
  losingTrades INT,
  totalPnl DECIMAL(20, 8),
  totalFees DECIMAL(20, 8),
  averageWin DECIMAL(20, 8),
  averageLoss DECIMAL(20, 8),
  winRate DECIMAL(10, 4),
  sharpeRatio DECIMAL(10, 4),
  maxDrawdown DECIMAL(10, 4),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### tRPC Procedures

#### Save Trade
```typescript
// Save a completed trade to database
trading.saveTrade.mutate({
  action: 'BUY',
  type: 'LONG',
  entryPrice: 2974.50,
  exitPrice: 2980.00,
  size: 1.5,
  pnl: 8.25,
  fee: 0.50,
  reason: 'MANUAL',
  sharpeRatio: 1.25,
  volatility: 0.015
});
```

#### Get Trades
```typescript
// Retrieve recent trades
const trades = await trading.getTrades.query({ limit: 100 });
```

#### Get Trades by Date Range
```typescript
// Retrieve trades within a specific date range
const trades = await trading.getTradesByDateRange.query({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
});
```

#### Save Performance Metrics
```typescript
// Save daily performance metrics
trading.saveMetrics.mutate({
  date: new Date(),
  totalTrades: 25,
  winningTrades: 15,
  losingTrades: 10,
  totalPnl: 1250.50,
  totalFees: 25.00,
  averageWin: 100.00,
  averageLoss: 50.00,
  winRate: 60.0,
  sharpeRatio: 1.45,
  maxDrawdown: 5.2
});
```

#### Get Performance Metrics
```typescript
// Retrieve performance metrics
const metrics = await trading.getMetrics.query({ limit: 30 });
```

#### Get Latest Metrics
```typescript
// Get the most recent performance metrics
const latestMetrics = await trading.getLatestMetrics.query();
```

### Database Query Helpers

All database operations are handled through helper functions in `server/db.ts`:

- `saveTrade(userId, trade)` - Insert a trade record
- `getUserTrades(userId, limit)` - Fetch recent trades
- `getTradesByDateRange(userId, startDate, endDate)` - Fetch trades in date range
- `savePerformanceMetrics(userId, metrics)` - Insert metrics
- `getUserPerformanceMetrics(userId, limit)` - Fetch recent metrics
- `getLatestPerformanceMetrics(userId)` - Get most recent metrics

---

## 2. Advanced Alerts System

### Overview
The Advanced Alerts system provides real-time notifications for:
- Technical indicator extremes (RSI overbought/oversold, MACD crossovers, Bollinger Band breakouts)
- Risk events (stop-loss triggered, take-profit triggered, large drawdowns)
- Performance milestones (win streaks ended, high volatility)

### Alert Types

#### Indicator Alerts
- **RSI Overbought**: RSI > 70 (potential reversal)
- **RSI Oversold**: RSI < 30 (potential bounce)
- **MACD Crossover**: MACD histogram changes sign (trend change)
- **Bollinger Band Breakout**: Price breaks upper or lower band (volatility spike)
- **High Volatility**: ATR exceeds threshold (market uncertainty)

#### Risk Alerts
- **Stop-Loss Triggered**: Position closed at stop-loss level (CRITICAL)
- **Take-Profit Triggered**: Position closed at profit target (INFO)
- **Large Drawdown**: Account drawdown exceeds threshold (CRITICAL)

#### Performance Alerts
- **Win Streak Ended**: Winning streak interrupted (WARNING)

### Alert Configuration

```typescript
const alertsManager = new AlertsManager({
  rsiOverbought: true,
  rsiOversold: true,
  macdCrossover: true,
  bbandBreakout: true,
  stopLossTriggered: true,
  takeProfitTriggered: true,
  largeDrawdown: true,
  winStreakEnded: true,
  highVolatility: true
});
```

### Alert Management

```typescript
// Create custom alert
alertsManager.createAlert('indicator', 'warning', 'Title', 'Message', { data });

// Get all alerts
const alerts = alertsManager.getAlerts();

// Get unread alerts
const unread = alertsManager.getUnreadAlerts();

// Mark as read
alertsManager.markAsRead(alertId);

// Clear all alerts
alertsManager.clearAlerts();

// Subscribe to changes
const unsubscribe = alertsManager.subscribe((alerts) => {
  console.log('Alerts updated:', alerts);
});
```

### Alert Severity Levels

- **CRITICAL**: Immediate action required (stop-loss, large drawdown)
- **WARNING**: Attention needed (overbought, oversold, win streak ended)
- **INFO**: Informational (take-profit, MACD crossover)

### Debouncing

Duplicate alerts are automatically debounced (1 second minimum between identical alerts) to prevent alert fatigue.

---

## 3. Backtesting Engine

### Overview
The Backtesting Engine allows you to test trading strategies on historical or synthetic data, providing comprehensive performance metrics and risk analysis.

### Supported Strategies

1. **Sharpe Maximizer**: Conservative strategy that only trades on significant price movements (>1.5%)
2. **Momentum**: Trades in the direction of recent price momentum (>1%)
3. **Mean Reversion**: Sells on large gains (>2%) and buys on large losses (<-2%)

### Running a Backtest

```typescript
const backtest = new BacktestEngine({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  initialCash: 10000,
  riskConfig: DEFAULT_RISK_CONFIG,
  strategy: 'sharpe-maximizer'
});

// Generate synthetic data (252 days = 1 year)
backtest.generateSyntheticData(100, 252);

// Run backtest
const results = await backtest.runBacktest();
```

### Loading Historical Data

```typescript
const historicalData = [
  { timestamp: new Date('2024-01-01'), price: 100, volume: 1000000 },
  { timestamp: new Date('2024-01-02'), price: 105, volume: 1200000 },
  // ... more data
];

backtest.loadHistoricalData(historicalData);
const results = await backtest.runBacktest();
```

### Backtest Results

The backtest returns comprehensive metrics:

```typescript
interface BacktestResult {
  totalTrades: number;           // Total number of trades executed
  winningTrades: number;         // Number of profitable trades
  losingTrades: number;          // Number of losing trades
  winRate: number;               // Percentage of winning trades
  totalPnL: number;              // Total profit/loss
  totalFees: number;             // Total trading fees
  maxDrawdown: number;           // Maximum peak-to-trough decline
  sharpeRatio: number;           // Risk-adjusted return metric
  profitFactor: number;          // Gross profit / Gross loss
  averageWin: number;            // Average profit per winning trade
  averageLoss: number;           // Average loss per losing trade
  largestWin: number;            // Largest single trade profit
  largestLoss: number;           // Largest single trade loss
  consecutiveWins: number;       // Longest winning streak
  consecutiveLosses: number;     // Longest losing streak
}
```

### Interpreting Results

- **Win Rate > 50%**: Strategy wins more than it loses
- **Sharpe Ratio > 1.0**: Good risk-adjusted returns
- **Profit Factor > 1.5**: Profitable strategy
- **Max Drawdown < 10%**: Acceptable risk level
- **Consecutive Wins/Losses**: Strategy consistency

### UI Integration

The Backtesting Panel in the UI allows you to:
1. Select a strategy (Sharpe Maximizer, Momentum, Mean Reversion)
2. Set the number of data points (days to simulate)
3. Run the backtest with one click
4. View detailed results including all metrics

---

## Integration with Trading Engine

All three features are integrated into the main trading engine:

### Automatic Alert Generation
Alerts are automatically created when:
- Price reaches overbought/oversold RSI levels
- MACD histogram crosses zero
- Volatility exceeds thresholds
- Stop-loss or take-profit is triggered

### Trade Persistence
Every trade executed can be saved to the database using:
```typescript
await trading.saveTrade.mutate({
  action: 'BUY',
  type: 'LONG',
  entryPrice: state.price,
  // ... other fields
});
```

### Performance Tracking
Daily metrics can be calculated and saved:
```typescript
await trading.saveMetrics.mutate({
  date: new Date(),
  totalTrades: stats.totalTrades,
  winningTrades: stats.winningTrades,
  // ... other metrics
});
```

---

## Testing

All features are covered by comprehensive unit tests:

```bash
# Run all tests
pnpm test

# Results:
# ✓ 24 Alerts Service tests
# ✓ 21 Backtesting Service tests
# ✓ 16 Indicators Service tests
# ✓ 16 Risk Management Service tests
# Total: 78 tests passed
```

---

## Best Practices

### Database Persistence
1. Save trades immediately after execution for accuracy
2. Calculate and save daily metrics at end of trading day
3. Use date range queries for performance analysis
4. Regularly backup trade history

### Alerts
1. Customize alert configuration based on your trading style
2. Review alerts regularly to identify patterns
3. Use alert data to refine trading rules
4. Disable non-relevant alerts to reduce noise

### Backtesting
1. Test strategies on at least 1 year of data
2. Compare multiple strategies to find the best fit
3. Use realistic fees and slippage in backtests
4. Validate backtest results on out-of-sample data
5. Don't over-optimize to historical data (avoid curve-fitting)

---

## API Reference

See `server/routers.ts` for complete tRPC procedure definitions and `client/src/lib/` for service implementations.
