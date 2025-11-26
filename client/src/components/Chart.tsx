import { useRef, useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { TradingState, DEFAULT_CONFIG } from '@/lib/tradingService';
import { authorityService } from '@/lib/authorityService';

interface ChartProps {
  state: TradingState;
  showPredictionLine?: boolean;
}

export default function Chart({ state, showPredictionLine = false }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = authorityService.subscribe((authenticated) => {
      setIsAuthorized(authenticated);
    });
    setIsAuthorized(authorityService.isAuthenticated());
    return unsubscribe;
  }, []);

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

    // Authority Prediction Line (only if authenticated)
    if (isAuthorized && showPredictionLine) {
      const predictionPoints = [];
      const predictionLength = DEFAULT_CONFIG.projectionWindow;
      const volatilityFactor = state.stats.atr * 0.08;
      const trendStrength = Math.abs(slope) / (volatility + 0.0001);
      const momentum = Math.min(trendStrength, 2);

      for (let i = 0; i <= predictionLength; i++) {
        const progress = i / predictionLength;
        const oscillation = Math.sin(progress * Math.PI * 2) * volatilityFactor * (1 - progress * 0.3);
        const trend = slope * i * (1 + momentum * 0.1);
        const predictedPrice = lastPrice + trend + oscillation;
        const x = startX + (i / predictionLength) * (endX - startX);
        const y = toY(predictedPrice);
        predictionPoints.push({ x, y });
      }

      // Draw prediction line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(168, 85, 247, 0.6)';
      ctx.setLineDash([]);

      predictionPoints.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Prediction confidence area
      ctx.beginPath();
      ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
      const upperPrediction = predictionPoints.map(pt => ({
        ...pt,
        y: pt.y - volatilityFactor * 2
      }));
      const lowerPrediction = predictionPoints.map(pt => ({
        ...pt,
        y: pt.y + volatilityFactor * 2
      }));

      ctx.moveTo(predictionPoints[0].x, predictionPoints[0].y);
      upperPrediction.forEach(pt => ctx.lineTo(pt.x, pt.y));
      lowerPrediction.reverse().forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.closePath();
      ctx.fill();

      // Authority label
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.fillText('AUTHORITY PREDICTION', startX + 10, startY + 20);
    }

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
  }, [state, isAuthorized, showPredictionLine]);

  return (
    <div className="bg-card border border-border flex-1 relative rounded-lg flex flex-col overflow-hidden">
      <div className="bg-muted border-b border-border px-3 py-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[10px] font-bold text-gray-500 tracking-widest">
          <Activity className="w-3 h-3" /> MARKET DATA + PREDICTIVE LAYOUT
          {isAuthorized && <span className="text-purple-400 ml-2">⚡ AUTHORITY MODE</span>}
        </span>
        <span className="font-mono text-[9px] text-gray-600">
          {state.history.length > 0 ? `${state.history.length} TICKS` : 'WAITING FOR TICKS...'}
        </span>
      </div>
      <div className="relative flex-1 bg-black">
        <canvas ref={canvasRef} />
        
        {/* HUD Overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none"></div>
      </div>
    </div>
  );
}
