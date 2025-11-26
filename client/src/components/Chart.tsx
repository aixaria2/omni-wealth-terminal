import { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';
import { TradingState, DEFAULT_CONFIG } from '@/lib/tradingService';

interface ChartProps {
  state: TradingState;
}

export default function Chart({ state }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || state.history.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parentElement = canvas.parentElement;
    if (!parentElement) return;

    const w = parentElement.clientWidth;
    const h = parentElement.clientHeight;
    canvas.width = w;
    canvas.height = h;

    const prices = state.history.map(h => h.price);
    const viewLength = DEFAULT_CONFIG.maxHistory + DEFAULT_CONFIG.projectionWindow;

    const min = Math.min(...prices) * 0.999;
    const max = Math.max(...prices) * 1.001;
    const range = max - min || 1;
    const padding = range * 0.2;

    const toY = (p: number) => h - ((p - (min - padding)) / (range + padding * 2)) * h;
    const step = w / viewLength;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 5; i++) {
      const y = i * (h / 5);
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Real Line
    ctx.beginPath();
    const isUp = state.price >= state.history[0].price;
    const lineColor = isUp ? '#10b981' : '#f43f5e';
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = lineColor;

    state.history.forEach((pt, i) => {
      const x = i * step;
      if (i === 0) ctx.moveTo(x, toY(pt.price));
      else {
        const prevX = (i - 1) * step;
        const prevY = toY(state.history[i - 1].price);
        const cp1x = prevX + (x - prevX) / 2;
        const cp1y = prevY;
        const cp2x = prevX + (x - prevX) / 2;
        const cp2y = toY(pt.price);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, toY(pt.price));
      }
    });
    ctx.stroke();

    // Fill
    const lastX = (state.history.length - 1) * step;
    ctx.lineTo(lastX, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Projection Cone
    const lastPrice = prices[prices.length - 1];
    const slope = (lastPrice - prices[Math.max(0, prices.length - 10)]) / 10;
    const volatility = state.stats.atr * 0.05;

    const startX = (state.history.length - 1) * step;
    const startY = toY(lastPrice);
    const endX = (state.history.length + DEFAULT_CONFIG.projectionWindow) * step;
    const endY = toY(lastPrice + slope * DEFAULT_CONFIG.projectionWindow);
    const upperY = toY(lastPrice + slope * DEFAULT_CONFIG.projectionWindow + volatility);
    const lowerY = toY(lastPrice + slope * DEFAULT_CONFIG.projectionWindow - volatility);

    // Ghost line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([2, 4]);
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Cone area
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.setLineDash([]);
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, upperY);
    ctx.lineTo(endX, lowerY);
    ctx.closePath();
    ctx.fill();

    // Label
    ctx.fillStyle = '#6366f1';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText('PROBABILISTIC FUTURE >>', startX + 10, startY - 10);

    // Entry Line
    if (state.position.type !== 'NONE') {
      const entryY = toY(state.position.entryPrice);
      ctx.beginPath();
      ctx.strokeStyle = '#fbbf24';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.moveTo(0, entryY);
      ctx.lineTo(w, entryY);
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(`ENTRY: ${state.position.entryPrice.toFixed(2)}`, w - 100, entryY - 6);
    }
  }, [state]);

  return (
    <div className="bg-card border border-border flex-1 relative rounded-lg flex flex-col overflow-hidden">
      <div className="bg-muted border-b border-border px-3 py-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[10px] font-bold text-gray-500 tracking-widest">
          <Activity className="w-3 h-3" /> MARKET DATA + PREDICTIVE LAYOUT
        </span>
        <span className="font-mono text-[9px] text-gray-600">
          {state.history.length > 0 ? `${state.history.length} TICKS` : 'WAITING FOR TICKS...'}
        </span>
      </div>
      <div className="relative flex-1 bg-black">
        <canvas ref={canvasRef} />
        
        {/* HUD Overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
          <div className="bg-black/80 border border-gray-800 p-3 rounded backdrop-blur-md shadow-lg min-w-[140px]">
            <div className="text-[9px] text-gray-500 font-bold tracking-wider mb-1">SHARPE RATIO (EFFICIENCY)</div>
            <div className="flex items-end justify-between">
              <div className={`text-lg font-mono font-bold ${state.stats.sharpe > 2 ? 'text-emerald-400' : state.stats.sharpe < -2 ? 'text-rose-400' : 'text-gray-400'}`}>
                {state.stats.sharpe.toFixed(2)}
              </div>
              <div className="w-12 h-1 bg-gray-800 rounded mb-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${state.stats.sharpe > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, Math.abs(state.stats.sharpe) * 20)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="bg-black/80 border border-gray-800 p-3 rounded backdrop-blur-md shadow-lg min-w-[140px]">
            <div className="text-[9px] text-gray-500 font-bold tracking-wider mb-1">PREDICTED VOLATILITY</div>
            <div className="text-sm font-mono text-gray-400">{state.stats.atr.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
