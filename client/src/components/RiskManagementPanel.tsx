import { useState } from 'react';
import { Shield } from 'lucide-react';
import { RiskManagementConfig, calculateRiskLevels } from '@/lib/riskManagementService';

interface RiskManagementPanelProps {
  config: RiskManagementConfig;
  entryPrice: number;
  positionType: 'LONG' | 'SHORT' | 'NONE';
  onConfigChange: (config: RiskManagementConfig) => void;
}

export default function RiskManagementPanel({
  config,
  entryPrice,
  positionType,
  onConfigChange
}: RiskManagementPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const riskLevels = positionType !== 'NONE' ? calculateRiskLevels(entryPrice, positionType as 'LONG' | 'SHORT', config) : null;

  const handleStopLossChange = (value: string) => {
    const percent = parseFloat(value) || 0;
    onConfigChange({ ...config, stopLossPercent: percent });
  };

  const handleTakeProfitChange = (value: string) => {
    const percent = parseFloat(value) || 0;
    onConfigChange({ ...config, takeProfitPercent: percent });
  };

  const handleToggleEnabled = () => {
    onConfigChange({ ...config, enabled: !config.enabled });
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-muted border-b border-border px-3 py-2 flex items-center justify-between hover:bg-muted/80 transition-colors"
      >
        <span className="flex items-center gap-2 text-[10px] font-bold text-gray-500 tracking-widest">
          <Shield className="w-3 h-3" /> RISK MANAGEMENT
        </span>
        <span className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-gray-400">ENABLED</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={handleToggleEnabled}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white"></div>
            </label>
          </div>

          {/* Stop Loss */}
          <div>
            <label className="text-[9px] font-bold text-gray-400 block mb-1">STOP LOSS (%)</label>
            <input
              type="number"
              value={config.stopLossPercent}
              onChange={(e) => handleStopLossChange(e.target.value)}
              disabled={!config.enabled}
              className="w-full bg-black/50 border border-gray-800 rounded px-2 py-1 text-[10px] text-gray-200 disabled:opacity-50"
              step="0.1"
              min="0.1"
              max="50"
            />
            {riskLevels && positionType !== 'NONE' && (
              <div className="text-[8px] text-gray-600 mt-1">
                Price: ${riskLevels.stopLossPrice.toFixed(2)}
              </div>
            )}
          </div>

          {/* Take Profit */}
          <div>
            <label className="text-[9px] font-bold text-gray-400 block mb-1">TAKE PROFIT (%)</label>
            <input
              type="number"
              value={config.takeProfitPercent}
              onChange={(e) => handleTakeProfitChange(e.target.value)}
              disabled={!config.enabled}
              className="w-full bg-black/50 border border-gray-800 rounded px-2 py-1 text-[10px] text-gray-200 disabled:opacity-50"
              step="0.1"
              min="0.1"
              max="50"
            />
            {riskLevels && positionType !== 'NONE' && (
              <div className="text-[8px] text-gray-600 mt-1">
                Price: ${riskLevels.takeProfitPrice.toFixed(2)}
              </div>
            )}
          </div>

          {/* Risk/Reward Ratio */}
          {riskLevels && positionType !== 'NONE' && (
            <div className="bg-black/30 rounded p-2 border border-gray-800">
              <div className="text-[9px] font-bold text-gray-400 mb-1">RISK/REWARD RATIO</div>
              <div className="text-sm font-mono text-emerald-400">
                1:{riskLevels.riskReward.toFixed(2)}
              </div>
              <div className="text-[8px] text-gray-600 mt-1">
                For every 1% risk, you can gain {riskLevels.riskReward.toFixed(2)}%
              </div>
            </div>
          )}

          {positionType === 'NONE' && (
            <div className="text-[8px] text-gray-600 italic">
              Open a position to see risk levels
            </div>
          )}
        </div>
      )}
    </div>
  );
}
