import { BarChart3, TrendingUp } from 'lucide-react';

export interface TradeRecord {
  id: string;
  action: 'BUY' | 'SELL' | 'CLOSE';
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice?: number;
  size: number;
  pnl?: number;
  fee: number;
  reason: string;
  createdAt: Date;
  closedAt?: Date;
}

export interface PerformanceStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnL: number;
  totalFees: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

interface AnalyticsDashboardProps {
  trades: TradeRecord[];
  stats: PerformanceStats;
}

export default function AnalyticsDashboard({ trades, stats }: AnalyticsDashboardProps) {
  const recentTrades = trades.slice(0, 5);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="bg-muted border-b border-border px-3 py-2 flex items-center gap-2">
        <BarChart3 className="w-3 h-3" />
        <span className="text-[10px] font-bold text-gray-500 tracking-widest">PERFORMANCE ANALYTICS</span>
      </div>

      <div className="p-3 space-y-3">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Total P&L */}
          <div className="bg-black/30 rounded p-2 border border-gray-800">
            <div className="text-[8px] text-gray-500 mb-1">TOTAL P&L</div>
            <div className={`text-sm font-mono font-bold ${stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${stats.totalPnL.toFixed(2)}
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-black/30 rounded p-2 border border-gray-800">
            <div className="text-[8px] text-gray-500 mb-1">WIN RATE</div>
            <div className="text-sm font-mono font-bold text-gray-300">
              {stats.winRate.toFixed(1)}%
            </div>
          </div>

          {/* Total Trades */}
          <div className="bg-black/30 rounded p-2 border border-gray-800">
            <div className="text-[8px] text-gray-500 mb-1">TOTAL TRADES</div>
            <div className="text-sm font-mono font-bold text-gray-300">
              {stats.totalTrades}
            </div>
          </div>

          {/* Sharpe Ratio */}
          <div className="bg-black/30 rounded p-2 border border-gray-800">
            <div className="text-[8px] text-gray-500 mb-1">SHARPE RATIO</div>
            <div className={`text-sm font-mono font-bold ${stats.sharpeRatio > 1 ? 'text-emerald-400' : 'text-gray-400'}`}>
              {stats.sharpeRatio.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Trade Breakdown */}
        <div className="bg-black/30 rounded p-2 border border-gray-800">
          <div className="text-[9px] font-bold text-gray-400 mb-2">TRADE BREAKDOWN</div>
          <div className="grid grid-cols-3 gap-2 text-[9px]">
            <div>
              <div className="text-gray-600">Wins</div>
              <div className="font-mono text-emerald-400 font-bold">{stats.winningTrades}</div>
            </div>
            <div>
              <div className="text-gray-600">Losses</div>
              <div className="font-mono text-rose-400 font-bold">{stats.losingTrades}</div>
            </div>
            <div>
              <div className="text-gray-600">Avg Win</div>
              <div className="font-mono text-gray-300">${stats.averageWin.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="bg-black/30 rounded p-2 border border-gray-800">
          <div className="text-[9px] font-bold text-gray-400 mb-2">RISK METRICS</div>
          <div className="space-y-1 text-[9px]">
            <div className="flex justify-between">
              <span className="text-gray-600">Max Drawdown</span>
              <span className="font-mono text-rose-400">{stats.maxDrawdown.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Fees</span>
              <span className="font-mono text-gray-300">${stats.totalFees.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Loss</span>
              <span className="font-mono text-gray-300">${stats.averageLoss.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        {recentTrades.length > 0 && (
          <div className="bg-black/30 rounded p-2 border border-gray-800">
            <div className="text-[9px] font-bold text-gray-400 mb-2">RECENT TRADES</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {recentTrades.map((trade) => (
                <div key={trade.id} className="flex justify-between text-[8px] py-1 border-b border-gray-800 last:border-0">
                  <div>
                    <span className={`font-bold ${trade.type === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.type}
                    </span>
                    <span className="text-gray-600 ml-2">{trade.reason}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-gray-300">${trade.entryPrice.toFixed(2)}</div>
                    {trade.pnl !== undefined && (
                      <div className={`font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recentTrades.length === 0 && (
          <div className="bg-black/30 rounded p-2 border border-gray-800 text-center">
            <div className="text-[8px] text-gray-600">No trades yet</div>
          </div>
        )}
      </div>
    </div>
  );
}
