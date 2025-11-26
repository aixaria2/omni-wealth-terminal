# OMNI Wealth Terminal - Refactored

A modern, production-ready refactoring of the OMNI Wealth Terminal trading application. Built with **React 19**, **TypeScript**, and **Tailwind CSS 4**, this application provides a real-time cryptocurrency trading terminal with quantitative analysis capabilities.

## Features

### Core Trading Engine
- **Real-time Data Connections**: WebSocket support for Binance with automatic HTTP fallback to CoinGecko
- **Simulation Mode**: Brownian motion simulation when live feeds are unavailable
- **Position Management**: Long/Short position tracking with entry price and unrealized P&L
- **Automated Trading**: Sharpe ratio-based algorithm for entry/exit decisions
- **Manual Controls**: Buy/Sell buttons for manual trading execution

### Quantitative Analysis
- **Sharpe Ratio Calculation**: Efficiency metric for trade quality (60-period window)
- **Simple Moving Averages**: 10-period fast and 30-period slow for trend detection
- **Volatility Analysis**: ATR-style volatility indicator
- **Predictive Visualization**: Projection cone showing statistical future price bounds

### User Interface
- **Terminal Aesthetic**: Dark theme with emerald accents matching the original design
- **Real-time Chart**: Canvas-based price visualization with Bézier curve smoothing
- **Live Metrics**: HUD overlay with Sharpe ratio and volatility indicators
- **Algorithm Logs**: Timestamped log stream of all trading actions and system events
- **Connection Status**: Visual indicator of data source (Live Stream, HTTP Pulse, or Offline Sim)

## Project Structure

```
omni-wealth-terminal/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx              # Top bar with connection status & net worth
│   │   │   ├── MarketTicker.tsx        # Asset price and momentum display
│   │   │   ├── Chart.tsx               # Canvas-based price chart with projections
│   │   │   ├── ExecutionPanel.tsx      # Trading controls and position info
│   │   │   └── LogsPanel.tsx           # Algorithm logs display
│   │   ├── lib/
│   │   │   └── tradingService.ts       # Core trading engine (TradingEngine class)
│   │   ├── pages/
│   │   │   └── Home.tsx                # Main application page
│   │   ├── App.tsx                     # Router and theme setup
│   │   ├── main.tsx                    # React entry point
│   │   └── index.css                   # Global styles with terminal theme
│   ├── public/                         # Static assets
│   └── index.html                      # HTML template
├── package.json
└── README.md
```

## Architecture

### TradingEngine Class (`lib/tradingService.ts`)

The core business logic is encapsulated in a **TradingEngine** class that manages:

- **State Management**: Centralized trading state with immutable updates
- **Event Subscriptions**: Observer pattern for UI updates and log streaming
- **Connection Management**: Automatic failover between WebSocket → HTTP → Simulation
- **Trade Execution**: Buy/Sell/Close operations with fee calculations
- **Metrics Calculation**: Real-time Sharpe, SMA, and volatility computation
- **Auto-Pilot Algorithm**: Sharpe-based entry/exit logic with 3-second cooldown

### React Components

Each component is a pure function receiving state and callbacks:

- **Header**: Displays connection status, projected assets (equity), and quantum sim badge
- **MarketTicker**: Shows current ETH/USDT price, momentum, and volatility status
- **Chart**: Renders price history with projection cone and entry line overlay
- **ExecutionPanel**: Buy/Sell buttons, position details, auto-pilot toggle
- **LogsPanel**: Scrollable log history with color-coded message types

### State Flow

```
TradingEngine
  ├── subscribe() → UI State Updates
  ├── subscribeToLogs() → Log Messages
  └── executeTrade() / setAutoMode() ← User Actions
```

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

```bash
pnpm build
pnpm start
```

## Configuration

Edit `client/src/lib/tradingService.ts` to customize:

```typescript
const DEFAULT_CONFIG: TradingConfig = {
  endpoints: [
    { type: 'WS_SECURE', url: 'wss://stream.binance.com:9443/ws/ethusdt@kline_1s' },
    { type: 'WS_STANDARD', url: 'wss://stream.binance.com/ws/ethusdt@kline_1s' },
    { type: 'HTTP_CG', url: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd' }
  ],
  initialCash: 10000,
  makerFee: 0.0005,
  takerFee: 0.0005,
  maxHistory: 200,
  sharpeWindow: 60,
  projectionWindow: 20
};
```

## Trading Algorithm

### Auto-Pilot Logic

The Sharpe Maximizer algorithm executes trades based on:

1. **Entry Conditions**:
   - **Long**: Sharpe > 2.5 AND fast SMA > slow SMA
   - **Short**: Sharpe < -2.5 AND fast SMA < slow SMA

2. **Exit Conditions**:
   - **From Long**: Trend reversal OR Sharpe < -0.5
   - **From Short**: Trend reversal OR Sharpe > 0.5

3. **Cooldown**: 3-second minimum between trades to prevent overtrading

### Manual Trading

Click **BUY / LONG** or **SELL / SHORT** buttons to execute trades at current price. Each trade uses 50% of available cash as margin.

## Key Differences from Original

| Aspect | Original | Refactored |
|--------|----------|-----------|
| **Framework** | Vanilla HTML/JS | React 19 + TypeScript |
| **Styling** | Inline CSS | Tailwind CSS 4 |
| **State Management** | Global object mutation | Immutable React state |
| **Architecture** | Monolithic | Component-based + Service layer |
| **Type Safety** | None | Full TypeScript |
| **Maintainability** | Single 700+ line file | Modular, 6 focused files |
| **Testing** | Not testable | Service layer easily testable |

## Data Sources

The application attempts connections in this order:

1. **Binance WebSocket** (wss://stream.binance.com:9443/ws/ethusdt@kline_1s)
   - Real-time 1-second candles
   - Best for live trading

2. **Binance WebSocket Alt** (wss://stream.binance.com/ws/ethusdt@kline_1s)
   - Port 443 fallback if 9443 blocked
   - Same data as primary

3. **CoinGecko REST API** (5-second polling)
   - Public API, no authentication
   - Fallback for restricted networks

4. **Local Simulation** (Brownian motion)
   - Offline mode when all external feeds fail
   - Useful for testing and demo purposes

## Styling & Theme

The application uses a **terminal-style dark theme** with:

- **Primary Color**: Emerald (#10b981) for gains and active states
- **Destructive Color**: Rose (#f43f5e) for losses and sell signals
- **Background**: Near-black (#030303) for reduced eye strain
- **Text**: Gray (#9ca3af) for secondary information

Colors are defined as CSS variables in `client/src/index.css` and can be customized globally.

## Performance Considerations

- **Canvas Rendering**: Optimized for 200-point history with Bézier curves
- **Event Debouncing**: 3-second trade cooldown prevents rapid-fire orders
- **Memory**: History limited to 200 points; logs capped at 50 entries
- **Network**: HTTP polling uses 5-second intervals to respect API rate limits

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires WebSocket support for optimal performance

## Troubleshooting

### No Price Updates
- Check browser console for connection errors
- Verify network connectivity
- Application will fallback to simulation mode if all feeds fail

### Chart Not Rendering
- Ensure canvas element is visible (not hidden by CSS)
- Check browser console for canvas context errors
- Verify sufficient price history (needs 2+ data points)

### Auto-Pilot Not Trading
- Verify Sharpe ratio exceeds thresholds (>2.5 or <-2.5)
- Check trend alignment (fast SMA vs slow SMA)
- Ensure 3-second cooldown has passed since last trade
- Review algorithm logs for entry/exit conditions

## Future Enhancements

- [ ] Additional trading pairs (BTC/USDT, etc.)
- [ ] Custom indicator library (RSI, MACD, Bollinger Bands)
- [ ] Trade history export (CSV/JSON)
- [ ] Performance analytics dashboard
- [ ] Risk management (stop-loss, take-profit)
- [ ] Multi-timeframe analysis
- [ ] WebSocket reconnection with exponential backoff

## License

MIT

## Credits

Refactored from the original OMNI Wealth Terminal single-file application into a modern, maintainable React architecture.
