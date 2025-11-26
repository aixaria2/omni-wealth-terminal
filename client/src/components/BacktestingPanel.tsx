import { useState } from 'react';
import { Play, BarChart3 } from 'lucide-react';
import { BacktestResult } from '@/lib/backtestingService';

interface BacktestingPanelProps {
  isRunning: boolean;
  results: BacktestResult | null;
  onRunBacktest: (strategy: string, dataPoints: number) => void;
}

export default function BacktestingPanel({ isRunning, results, onRunBacktest }: BacktestingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [strategy, setStrategy] = useState('sharpe-maximizer');
  const [dataPoints, setDataPoints] = useState(252);

  const handleRunBacktest = () => {
    onRunBacktest(strategy, dataPoints);
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-muted border-b border-border px-3 py-2 flex items-center justify-between hover:bg-muted/80 transition-colors"
      >
        <span className="flex items-center gap-2 text-[10px] font-bold text-gray-500 tracking-widest">
          <BarChart3 className="w-3 h-3" /> BACKTESTING
        </span>
        <span className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Strategy Selection */}
          <div>
            <label className="text-[9px] font-bold text-gray-400 block mb-1">STRATEGY</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              disabled={isRunning}
              className="w-full bg-black/50 border border-gray-800 rounded px-2 py-1 text-[10px] text-gray-200 disabled:opacity-50"
            >
              <option value="sharpe-maximizer">Sharpe Maximizer</option>
              <option value="momentum">Momentum</option>
              <option value="mean-reversion">Mean Reversion</option>
            </select>
          </div>

          {/* Data Points */}
          <div>
            <label className="text-[9px] font-bold text-gray-400 block mb-1">DATA POINTS (days)</label>
            <input
              type="number"
              value={dataPoints}
              onChange={(e) => setDataPoints(parseInt(e.target.value) || 252)}
              disabled={isRunning}
              className="w-full bg-black/50 border border-gray-800 rounded px-2 py-1 text-[10px] text-gray-200 disabled:opacity-50"
              min="50"
              max="1000"
            />
          </div>

          {/* Run Button */}
          <button
            onClick={handleRunBacktest}
            disabled={isRunning}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:opacity-50 text-white text-[9px] font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-3 h-3" />
            {isRunning ? 'RUNNING...' : 'RUN BACKTEST'}
          </button>

          {/* Results */}
          {results && (
            <div className="bg-black/30 rounded p-2 border border-gray-800 space-y-2">
              <div className="text-[9px] font-bold text-gray-400 mb-2">RESULTS</div>

              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div>
                  <div className="text-gray-600">Total Trades</div>
                  <div className="font-mono text-gray-300">{results.totalTrades}</div>
                </div>
                <div>
                  <div className="text-gray-600">Win Rate</div>
                  <div className="font-mono text-emerald-400">{results.winRate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-gray-600">Total P&L</div>
                  <div className={`font-mono font-bold ${results.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${results.totalPnL.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Sharpe Ratio</div>
                  <div className="font-mono text-gray-300">{results.sharpeRatio.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Max Drawdown</div>
                  <div className="font-mono text-rose-400">{results.maxDrawdown.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-gray-600">Profit Factor</div>
                  <div className="font-mono text-gray-300">{results.profitFactor.toFixed(2)}</div>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-2 mt-2">
                <div className="text-[8px] text-gray-600 space-y-1">
                  <div>Avg Win: ${results.averageWin.toFixed(2)} | Avg Loss: ${results.averageLoss.toFixed(2)}</div>
                  <div>Largest Win: ${results.largestWin.toFixed(2)} | Largest Loss: ${results.largestLoss.toFixed(2)}</div>
                  <div>Consecutive Wins: {results.consecutiveWins} | Consecutive Losses: {results.consecutiveLosses}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
