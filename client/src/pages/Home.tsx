import { useState, useEffect } from 'react';
import { TradingEngine, TradingState, LogMessage, DEFAULT_STATE } from '@/lib/tradingService';
import { RiskManagementConfig } from '@/lib/riskManagementService';
import { AlertsManager, Alert } from '@/lib/alertsService';
import { BacktestEngine, BacktestResult } from '@/lib/backtestingService';
import { authorityService } from '@/lib/authorityService';
import Header from '@/components/Header';
import MarketTicker from '@/components/MarketTicker';
import Chart from '@/components/Chart';
import ExecutionPanel from '@/components/ExecutionPanel';
import LogsPanel from '@/components/LogsPanel';
import RiskManagementPanel from '@/components/RiskManagementPanel';
import IndicatorsDisplay from '@/components/IndicatorsDisplay';
import AnalyticsDashboard, { TradeRecord, PerformanceStats } from '@/components/AnalyticsDashboard';
import AlertsPanel from '@/components/AlertsPanel';
import BacktestingPanel from '@/components/BacktestingPanel';
import AuthorityLoginModal from '@/components/AuthorityLoginModal';
import AuthorityDashboard from '@/components/AuthorityDashboard';

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
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsManager] = useState(() => new AlertsManager());
  const [backtestResults, setBacktestResults] = useState<BacktestResult | null>(null);
  const [isBacktestRunning, setIsBacktestRunning] = useState(false);
  const [isAuthorityModalOpen, setIsAuthorityModalOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = authorityService.subscribe((authenticated) => {
      setIsAuthorized(authenticated);
    });
    setIsAuthorized(authorityService.isAuthenticated());
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribeAlerts = alertsManager.subscribe((newAlerts) => {
      setAlerts(newAlerts);
    });

    return () => {
      unsubscribeAlerts();
    };
  }, [alertsManager]);

  useEffect(() => {
    const unsubscribeState = engine.subscribe((newState) => {
      setState(newState);

      // Check for alert conditions
      if (newState.indicators.rsi > 70) {
        alertsManager.alertRSIOverbought(newState.indicators.rsi);
      } else if (newState.indicators.rsi < 30) {
        alertsManager.alertRSIOversold(newState.indicators.rsi);
      }

      if (newState.indicators.macd.histogram > 0) {
        alertsManager.alertMACDCrossover(true);
      }

      if (newState.stats.atr > 2) {
        alertsManager.alertHighVolatility(newState.stats.atr);
      }
    });

    const unsubscribeLogs = engine.subscribeToLogs((log) => {
      setLogs((prev) => [log, ...prev].slice(0, 50));
    });

    engine.connect();

    return () => {
      unsubscribeState();
      unsubscribeLogs();
      engine.disconnect();
    };
  }, [engine, alertsManager]);

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

  const handleRunBacktest = async (strategy: string, dataPoints: number) => {
    setIsBacktestRunning(true);
    try {
      const backtest = new BacktestEngine({
        startDate: new Date(Date.now() - dataPoints * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        initialCash: 10000,
        riskConfig: state.riskConfig,
        strategy: strategy as any
      });

      backtest.generateSyntheticData(state.price, dataPoints);
      const results = await backtest.runBacktest();
      setBacktestResults(results);

      alertsManager.createAlert(
        'performance',
        'info',
        'Backtest Complete',
        `Strategy: ${strategy} | Win Rate: ${results.winRate.toFixed(1)}% | P&L: $${results.totalPnL.toFixed(2)}`,
        results
      );
    } catch (error) {
      alertsManager.createAlert(
        'performance',
        'critical',
        'Backtest Error',
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsBacktestRunning(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-2 gap-2 text-xs bg-background">
      <Header state={state} />

      {/* Authority Login Modal */}
      <AuthorityLoginModal
        isOpen={isAuthorityModalOpen}
        onClose={() => setIsAuthorityModalOpen(false)}
        onSuccess={() => setIsAuthorityModalOpen(false)}
      />

      <div className="flex-1 flex gap-2 overflow-hidden">
        <div className="flex-[3] flex flex-col gap-2 min-w-0">
          <MarketTicker state={state} />
          <Chart state={state} showPredictionLine={isAuthorized} />
        </div>

        <div className="flex-[1] min-w-[300px] flex flex-col gap-2 overflow-y-auto">
          {/* Authority Access Button / Dashboard */}
          {!isAuthorized ? (
            <button
              onClick={() => setIsAuthorityModalOpen(true)}
              className="bg-gradient-to-r from-purple-900 to-purple-800 hover:from-purple-800 hover:to-purple-700 border border-purple-600 text-white text-[9px] font-bold py-2 px-3 rounded transition-colors flex items-center justify-center gap-2"
            >
              <span>🔓</span> UNLOCK AUTHORITY ACCESS
            </button>
          ) : (
            <AuthorityDashboard onLogout={() => setIsAuthorized(false)} />
          )}

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
          <AlertsPanel
            alerts={alerts}
            onClearAll={() => alertsManager.clearAlerts()}
            onMarkAsRead={(id) => alertsManager.markAsRead(id)}
          />
          <BacktestingPanel
            isRunning={isBacktestRunning}
            results={backtestResults}
            onRunBacktest={handleRunBacktest}
          />
          <AnalyticsDashboard trades={trades} stats={stats} />
          <LogsPanel logs={logs} onClear={handleClearLogs} />
        </div>
      </div>
    </div>
  );
}
