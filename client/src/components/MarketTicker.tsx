import { TradingState } from '@/lib/tradingService';

interface MarketTickerProps {
  state: TradingState;
}

export default function MarketTicker({ state }: MarketTickerProps) {
  const isUp = state.history.length > 1 && state.price >= state.history[state.history.length - 2].price;
  const volatilityHigh = state.stats.atr > 50;

  return (
    <div className="bg-card border border-border h-20 flex items-center px-6 justify-between shrink-0 rounded-lg">
      <div>
        <div className="text-[10px] text-gray-500 font-bold mb-1 tracking-wider">ASSET</div>
        <div className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
          ETH / USDT
          <span className="text-[9px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">PERP</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-[10px] text-gray-500 font-bold mb-1 tracking-wider">REAL-TIME PRICE</div>
        <div className={`text-3xl font-mono tracking-tighter transition-colors duration-300 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
          {state.price.toFixed(2)}
        </div>
      </div>
      <div className="text-right hidden sm:block pl-6 border-l border-gray-800">
        <div className="text-[10px] text-gray-500 font-bold mb-1 tracking-wider">MOMENTUM</div>
        <div className={`text-sm font-mono ${volatilityHigh ? 'text-indigo-400 animate-pulse' : 'text-gray-500'}`}>
          {volatilityHigh ? 'HIGH VOLATILITY' : 'STABLE'}
        </div>
      </div>
    </div>
  );
}
