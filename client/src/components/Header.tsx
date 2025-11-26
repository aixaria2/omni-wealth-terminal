import { Cpu } from 'lucide-react';
import { TradingState } from '@/lib/tradingService';

interface HeaderProps {
  state: TradingState;
}

export default function Header({ state }: HeaderProps) {
  const getConnectionColor = () => {
    if (state.connection.status === 'CONNECTED') return 'bg-emerald-500';
    if (state.connection.status === 'CONNECTING') return 'bg-yellow-500';
    return 'bg-gray-600';
  };

  const getConnectionText = () => {
    if (state.connection.type === 'WEBSOCKET') return 'LIVE STREAM';
    if (state.connection.type === 'HTTP') return 'HTTP PULSE';
    if (state.simMode) return 'OFFLINE SIM';
    return 'INITIALIZING...';
  };

  const getConnectionSub = () => {
    if (state.connection.type === 'WEBSOCKET') return 'BINANCE_WS';
    if (state.connection.type === 'HTTP') return 'COINGECKO_REST';
    if (state.simMode) return 'LOCAL_PHYSICS';
    return '--';
  };

  const equity = state.cash + (
    state.position.type !== 'NONE'
      ? state.position.type === 'LONG'
        ? (state.price - state.position.entryPrice) * state.position.size
        : (state.position.entryPrice - state.price) * state.position.size
      : 0
  );

  return (
    <header className="h-12 bg-card border border-border flex items-center justify-between px-4 shrink-0 rounded-lg relative overflow-hidden">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gray-900 rounded border border-gray-800">
            <Cpu className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="font-bold text-gray-100 tracking-widest text-sm">OMNI // TERMINAL</div>
            <div className="text-[9px] text-gray-500 tracking-wider">QUANTITATIVE PREDICTION ENGINE</div>
          </div>
        </div>
        <div className="h-6 w-px bg-gray-800"></div>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${getConnectionColor()} ${state.connection.status === 'CONNECTED' ? 'animate-pulse' : ''}`}></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-gray-500">{getConnectionText()}</span>
            <span className="text-[8px] font-mono text-gray-600">{getConnectionSub()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-[9px] text-gray-500 tracking-wider mb-0.5">PROJECTED ASSETS</div>
          <div className="text-base font-mono font-bold text-gray-100 tracking-tight">
            ${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="px-2 py-1 rounded bg-indigo-900/20 border border-indigo-700/30 text-indigo-400 text-[9px] font-bold tracking-widest">
          QUANTUM SIM
        </div>
      </div>
    </header>
  );
}
