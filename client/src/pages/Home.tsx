import { useEffect, useState } from 'react';
import { TradingEngine, TradingState, LogMessage, DEFAULT_STATE } from '@/lib/tradingService';
import { RiskManagementConfig } from '@/lib/riskManagementService';
import Header from '@/components/Header';
import MarketTicker from '@/components/MarketTicker';
import Chart from '@/components/Chart';
import ExecutionPanel from '@/components/ExecutionPanel';
import LogsPanel from '@/components/LogsPanel';
import RiskManagementPanel from '@/components/RiskManagementPanel';
import IndicatorsDisplay from '@/components/IndicatorsDisplay';
import AnalyticsDashboard, { TradeRecord, PerformanceStats } from '@/components/AnalyticsDashboard';

export default function Home() {
  const [state, setState] = useState<TradingState>(DEFAULT_STATE);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [engine] = useState(() => new TradingEngine());
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [stats, setStats] = useState<PerformanceStats>({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    totalPnL: 0,
    totalFees: 0,
    winRate: 0,
    averageWin: 0,
    averageLoss: 0,
    sharpeRatio: 0,
    maxDrawdown: 0
  });

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribeState = engine.subscribe((newState) => {
      setState(newState);
    });

    // Subscribe to log messages
    const unsubscribeLogs = engine.subscribeToLogs((log) => {
      setLogs((prev) => [log, ...prev].slice(0, 50));
    });

    // Connect to data source
    engine.connect();

    return () => {
      unsubscribeState();
      unsubscribeLogs();
      engine.disconnect();
    };
  }, [engine]);

  const handleBuy = () => {
    engine.executeTrade('BUY', 'MANUAL');
  };

  const handleSell = () => {
    engine.executeTrade('SELL', 'MANUAL');
  };

  const handleToggleAuto = (enabled: boolean) => {
    engine.setAutoMode(enabled);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleRiskConfigChange = (config: RiskManagementConfig) => {
    engine.setRiskConfig(config);
  };

  return (
    <div className="min-h-screen flex flex-col p-2 gap-2 text-xs bg-background">
      {/* Top Bar */}
      <Header state={state} />

      {/* Main Workspace */}
      <div className="flex-1 flex gap-2 overflow-hidden">
        {/* Left Col: Market Data & Chart */}
        <div className="flex-[3] flex flex-col gap-2 min-w-0">
          <MarketTicker state={state} />
          <Chart state={state} />
        </div>

        {/* Right Col: Execution, Risk, Indicators & Logs */}
        <div className="flex-[1] min-w-[300px] flex flex-col gap-2 overflow-y-auto">
          <ExecutionPanel
            state={state}
            onBuy={handleBuy}
            onSell={handleSell}
            onToggleAuto={handleToggleAuto}
          />
          <RiskManagementPanel
            config={state.riskConfig}
            entryPrice={state.position.entryPrice}
            positionType={state.position.type}
            onConfigChange={handleRiskConfigChange}
          />
          <IndicatorsDisplay indicators={state.indicators} />
          <AnalyticsDashboard trades={trades} stats={stats} />
          <LogsPanel logs={logs} onClear={handleClearLogs} />
        </div>
      </div>
    </div>
  );
}
