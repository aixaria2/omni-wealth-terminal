import { useEffect, useRef } from 'react';
import { LogMessage } from '@/lib/tradingService';

interface LogsPanelProps {
  logs: LogMessage[];
  onClear: () => void;
}

export default function LogsPanel({ logs, onClear }: LogsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [logs]);

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-emerald-400';
      case 'error':
        return 'text-rose-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-card border border-border flex-1 flex flex-col overflow-hidden rounded-lg">
      <div className="bg-muted border-b border-border px-3 py-2 flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-500 tracking-widest">ALGORITHM LOGS</span>
        <button
          onClick={onClear}
          className="text-[9px] text-gray-500 hover:text-white transition-colors"
        >
          CLEAR
        </button>
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-1.5 text-gray-500 bg-black/20"
      >
        {logs.length === 0 ? (
          <div className="flex gap-2">
            <span className="text-blue-500">INFO</span>
            <span>Initializing Quantum Data Link...</span>
          </div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="opacity-30">[{log.time.toLocaleTimeString().split(' ')[0]}]</span>
              <span className={getLogColor(log.type)}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
