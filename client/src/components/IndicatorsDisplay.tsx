import { TrendingUp } from 'lucide-react';
import { IndicatorValues } from '@/lib/indicatorsService';

interface IndicatorsDisplayProps {
  indicators: IndicatorValues;
}

export default function IndicatorsDisplay({ indicators }: IndicatorsDisplayProps) {
  const getRSIColor = (rsi: number) => {
    if (rsi > 70) return 'text-rose-400'; // Overbought
    if (rsi < 30) return 'text-emerald-400'; // Oversold
    return 'text-gray-400';
  };

  const getMACDColor = (histogram: number) => {
    return histogram > 0 ? 'text-emerald-400' : 'text-rose-400';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 tracking-widest border-b border-border pb-2">
        <TrendingUp className="w-3 h-3" /> TECHNICAL INDICATORS
      </div>

      {/* RSI */}
      <div className="bg-black/30 rounded p-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] font-bold text-gray-400">RSI (14)</span>
          <span className={`text-sm font-mono font-bold ${getRSIColor(indicators.rsi)}`}>
            {indicators.rsi.toFixed(2)}
          </span>
        </div>
        <div className="w-full h-1 bg-gray-800 rounded overflow-hidden">
          <div
            className={`h-full transition-all ${getRSIColor(indicators.rsi).replace('text-', 'bg-')}`}
            style={{ width: `${Math.min(100, indicators.rsi)}%` }}
          />
        </div>
        <div className="text-[8px] text-gray-600 mt-1 flex justify-between">
          <span>Oversold (30)</span>
          <span>Overbought (70)</span>
        </div>
      </div>

      {/* MACD */}
      <div className="bg-black/30 rounded p-2">
        <div className="text-[9px] font-bold text-gray-400 mb-1">MACD</div>
        <div className="grid grid-cols-3 gap-2 text-[9px]">
          <div>
            <div className="text-gray-600">Line</div>
            <div className="font-mono text-gray-300">{indicators.macd.line.toFixed(4)}</div>
          </div>
          <div>
            <div className="text-gray-600">Signal</div>
            <div className="font-mono text-gray-300">{indicators.macd.signal.toFixed(4)}</div>
          </div>
          <div>
            <div className="text-gray-600">Histogram</div>
            <div className={`font-mono font-bold ${getMACDColor(indicators.macd.histogram)}`}>
              {indicators.macd.histogram.toFixed(4)}
            </div>
          </div>
        </div>
      </div>

      {/* Bollinger Bands */}
      <div className="bg-black/30 rounded p-2">
        <div className="text-[9px] font-bold text-gray-400 mb-1">BOLLINGER BANDS (20, 2σ)</div>
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between">
            <span className="text-gray-600">Upper</span>
            <span className="font-mono text-gray-300">${indicators.bollingerBands.upper.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Middle (SMA)</span>
            <span className="font-mono text-gray-300">${indicators.bollingerBands.middle.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Lower</span>
            <span className="font-mono text-gray-300">${indicators.bollingerBands.lower.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Signal Summary */}
      <div className="bg-black/50 rounded p-2 border border-gray-800">
        <div className="text-[9px] font-bold text-gray-400 mb-1">SIGNAL SUMMARY</div>
        <div className="text-[8px] text-gray-500 space-y-0.5">
          <div>
            RSI: {indicators.rsi > 70 ? '⚠️ Overbought' : indicators.rsi < 30 ? '⚠️ Oversold' : '✓ Neutral'}
          </div>
          <div>
            MACD: {indicators.macd.histogram > 0 ? '📈 Bullish' : '📉 Bearish'}
          </div>
        </div>
      </div>
    </div>
  );
}
