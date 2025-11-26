import { Zap } from 'lucide-react';
import { TradingState } from '@/lib/tradingService';

interface ExecutionPanelProps {
  state: TradingState;
  onBuy: () => void;
  onSell: () => void;
  onToggleAuto: (enabled: boolean) => void;
}

export default function ExecutionPanel({ state, onBuy, onSell, onToggleAuto }: ExecutionPanelProps) {
  const unrealized = state.position.type !== 'NONE'
    ? state.position.type === 'LONG'
      ? (state.price - state.position.entryPrice) * state.position.size
      : (state.position.entryPrice - state.price) * state.position.size
    : 0;

  return (
    <div className="bg-card border border-border p-4 flex flex-col gap-4 shrink-0 rounded-lg">
      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 tracking-widest border-b border-border pb-2">
        <Zap className="w-3 h-3" /> EXECUTION ENGINE
      </div>

      {/* Position Info */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] text-gray-400">
          <span>CURRENT POSITION</span>
          <span className={`font-bold ${state.position.type === 'LONG' ? 'text-emerald-400' : state.position.type === 'SHORT' ? 'text-rose-400' : 'text-gray-600'}`}>
            {state.position.type}
          </span>
        </div>
        <div className="p-3 bg-black/50 rounded border border-gray-800 flex justify-between items-center">
          <div>
            <div className="text-[9px] text-gray-500 mb-0.5">SIZE (ETH)</div>
            <div className="font-mono font-bold text-gray-200">{state.position.size.toFixed(4)}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-gray-500 mb-0.5">PnL (Unrealized)</div>
            <div className={`font-mono font-bold text-lg ${unrealized >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(unrealized >= 0 ? '+' : '')}{unrealized.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Controls */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onBuy}
          className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] py-4 rounded font-bold flex flex-col items-center justify-center gap-1 transition-all text-xs"
        >
          BUY / LONG
          <span className="text-[9px] opacity-60 font-mono">{state.price.toFixed(2)}</span>
        </button>
        <button
          onClick={onSell}
          className="border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)] py-4 rounded font-bold flex flex-col items-center justify-center gap-1 transition-all text-xs"
        >
          SELL / SHORT
          <span className="text-[9px] opacity-60 font-mono">{state.price.toFixed(2)}</span>
        </button>
      </div>

      {/* Auto Pilot */}
      <div className="bg-gray-900/50 rounded border border-gray-800 p-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold text-gray-200 flex items-center gap-1.5">
            AUTO-PILOT {state.isAuto && <span className="text-[9px] px-1 bg-purple-500/20 text-purple-400 rounded">ACTIVE</span>}
          </div>
          <div className="text-[9px] text-gray-500 mt-0.5">Algorithm: Sharpe Maximizer</div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={state.isAuto}
            onChange={(e) => onToggleAuto(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white"></div>
        </label>
      </div>
    </div>
  );
}
