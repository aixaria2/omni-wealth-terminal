// Trading Engine Service - Core business logic
import { calculateAllIndicators, IndicatorValues } from './indicatorsService';
import { RiskManagementConfig, DEFAULT_RISK_CONFIG, calculateRiskLevels, checkRiskTriggers } from './riskManagementService';

export interface TradingConfig {
  endpoints: Array<{ type: string; url: string }>;
  initialCash: number;
  makerFee: number;
  takerFee: number;
  maxHistory: number;
  sharpeWindow: number;
  projectionWindow: number;
}

export interface Position {
  size: number;
  entryPrice: number;
  type: 'NONE' | 'LONG' | 'SHORT';
}

export interface PricePoint {
  time: number;
  price: number;
}

export interface TradingStats {
  sharpe: number;
  atr: number;
  smafast: number;
  smaslow: number;
}

export interface ConnectionState {
  type: 'NONE' | 'WEBSOCKET' | 'HTTP';
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';
  fails: number;
}

export interface TradingState {
  cash: number;
  position: Position;
  price: number;
  history: PricePoint[];
  isAuto: boolean;
  lastTradeTime: number;
  stats: TradingStats;
  connection: ConnectionState;
  simMode: boolean;
  simDrift: number;
  indicators: IndicatorValues;
  riskConfig: RiskManagementConfig;
}

export const DEFAULT_CONFIG: TradingConfig = {
  endpoints: [
    { type: 'WS_SECURE', url: 'wss://stream.binance.com:9443/ws/ethusdt@kline_1s' },
    { type: 'WS_STANDARD', url: 'wss://stream.binance.com/ws/ethusdt@kline_1s' },
    { type: 'HTTP_CG', url: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd' }
  ],
  initialCash: 10000,
  makerFee: 0.0005,
  takerFee: 0.0005,
  maxHistory: 200,
  sharpeWindow: 60,
  projectionWindow: 20
};

export const DEFAULT_STATE: TradingState = {
  cash: DEFAULT_CONFIG.initialCash,
  position: { size: 0, entryPrice: 0, type: 'NONE' },
  price: 0,
  history: [],
  isAuto: false,
  lastTradeTime: 0,
  stats: { sharpe: 0, atr: 0, smafast: 0, smaslow: 0 },
  connection: { type: 'NONE', status: 'DISCONNECTED', fails: 0 },
  simMode: false,
  simDrift: 0,
  indicators: {
    rsi: 0,
    macd: { line: 0, signal: 0, histogram: 0 },
    bollingerBands: { upper: 0, middle: 0, lower: 0 }
  },
  riskConfig: DEFAULT_RISK_CONFIG
};

export class TradingEngine {
  private config: TradingConfig;
  private state: TradingState;
  private listeners: Set<(state: TradingState) => void> = new Set();
  private logListeners: Set<(msg: LogMessage) => void> = new Set();
  private ws: WebSocket | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private simInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<TradingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = { ...DEFAULT_STATE };
  }

  getState(): TradingState {
    return { ...this.state };
  }

  subscribe(listener: (state: TradingState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeToLogs(listener: (msg: LogMessage) => void): () => void {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  private log(msg: string, type: 'info' | 'success' | 'error' | 'neutral' = 'neutral'): void {
    const logMsg: LogMessage = {
      time: new Date(),
      message: msg,
      type
    };
    this.logListeners.forEach(listener => listener(logMsg));
  }

  async connect(): Promise<void> {
    this.updateConnectionUI('SEARCHING FEED...', 'SEARCHING', 'warn');

    // Try WS endpoints
    for (const endpoint of this.config.endpoints.slice(0, 2)) {
      try {
        await this.tryWebSocket(endpoint.url);
        return;
      } catch (e) {
        this.log(`${endpoint.type} failed. Retrying...`, 'error');
      }
    }

    // Try HTTP polling
    try {
      this.log('Attempting HTTP Polling...', 'info');
      const res = await fetch(this.config.endpoints[2].url);
      if (res.ok) {
        this.startPolling(this.config.endpoints[2].url, 'COINGECKO_REST');
        return;
      }
    } catch (e) {
      this.log('HTTP Feed Unreachable.', 'error');
    }

    // Fallback to simulation
    this.startSimulation();
  }

  private tryWebSocket(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.log(`Handshaking: ${url}`, 'info');
      const ws = new WebSocket(url);
      let connected = false;

      ws.onopen = () => {
        connected = true;
        this.state.connection.type = 'WEBSOCKET';
        this.updateConnectionUI('LIVE STREAM', 'BINANCE_WS', 'success');
        this.log('Quantum Uplink Established.', 'success');
        this.ws = ws;
        resolve();
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.k) this.updateEngine(parseFloat(data.k.c));
        else if (data.p) this.updateEngine(parseFloat(data.p));
      };

      ws.onerror = () => {
        if (!connected) reject(new Error('Connection failed'));
      };

      ws.onclose = () => {
        if (connected && !this.state.simMode) {
          this.log('Stream Lost. Rerouting...', 'error');
          this.connect();
        }
      };

      setTimeout(() => {
        if (!connected) reject(new Error('Connection timeout'));
      }, 5000);
    });
  }

  private startPolling(url: string, type: string): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.state.connection.type = 'HTTP';
    this.updateConnectionUI('HTTP PULSE', type, 'warn');
    this.log(`Switched to Backup Feed: ${type}`, 'info');

    const poll = async () => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        let price = 0;
        if (data.ethereum) price = parseFloat(data.ethereum.usd);
        if (price > 0) this.updateEngine(price);
      } catch (e) {
        this.log('Polling Failed.', 'error');
        this.startSimulation();
      }
    };

    poll();
    this.pollInterval = setInterval(poll, 5000);
  }

  private startSimulation(): void {
    if (this.state.simMode) return;
    this.state.simMode = true;
    if (this.pollInterval) clearInterval(this.pollInterval);

    this.updateConnectionUI('OFFLINE SIM', 'LOCAL_PHYSICS', 'sim');
    this.log('ALL NETWORKS DOWN. ENGAGING LOCAL SIMULATOR.', 'error');
    this.log('Simulating Brownian Motion...', 'info');

    let simPrice = 3000.0;

    this.simInterval = setInterval(() => {
      const volatility = 0.001;
      const change = simPrice * volatility * (Math.random() - 0.5);
      simPrice += change;

      this.state.simDrift += (Math.random() - 0.5) * 0.1;
      simPrice += this.state.simDrift;

      this.updateEngine(simPrice);
    }, 1000);
  }

  private updateConnectionUI(text: string, sub: string, status: 'success' | 'warn' | 'sim'): void {
    this.state.connection.status = status === 'success' ? 'CONNECTED' : 'CONNECTING';
    this.notifyListeners();
  }

  private updateEngine(price: number): void {
    this.state.price = price;
    this.state.history.push({ time: Date.now(), price });
    if (this.state.history.length > this.config.maxHistory) {
      this.state.history.shift();
    }

    this.calculateMetrics();
    if (this.state.isAuto) this.runAutoPilot();
    this.notifyListeners();
  }

  private calculateMetrics(): void {
    const prices = this.state.history.map(h => h.price);
    if (prices.length < 2) return;

    // Returns
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    // Sharpe
    const slice = returns.slice(-this.config.sharpeWindow);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / slice.length;
    const stdDev = Math.sqrt(variance);

    this.state.stats.sharpe = stdDev === 0 ? 0 : (mean / stdDev) * 100;

    // SMAs
    const sma = (n: number) => prices.slice(-n).reduce((a, b) => a + b, 0) / n;
    this.state.stats.smafast = sma(10);
    this.state.stats.smaslow = sma(30);

    // ATR
    this.state.stats.atr = stdDev * this.state.price * 100;

    // Calculate technical indicators
    this.state.indicators = calculateAllIndicators(prices);

    // Check risk management triggers
    if (this.state.riskConfig.enabled && this.state.position.type !== 'NONE') {
      const riskLevels = calculateRiskLevels(this.state.position.entryPrice, this.state.position.type, this.state.riskConfig);
      const trigger = checkRiskTriggers(this.state.price, riskLevels, this.state.position.type);
      if (trigger === 'stop-loss') {
        this.log('STOP-LOSS TRIGGERED at $' + this.state.price.toFixed(2), 'error');
        this.executeTrade('CLOSE', 'STOP_LOSS');
      } else if (trigger === 'take-profit') {
        this.log('TAKE-PROFIT TRIGGERED at $' + this.state.price.toFixed(2), 'success');
        this.executeTrade('CLOSE', 'TAKE_PROFIT');
      }
    }
  }

  private runAutoPilot(): void {
    const now = Date.now();
    if (now - this.state.lastTradeTime < 3000) return;

    const s = this.state.stats.sharpe;
    const trend = this.state.stats.smafast > this.state.stats.smaslow;

    if (this.state.position.type === 'NONE') {
      if (s > 2.5 && trend) this.executeTrade('BUY', 'QUANT_ENTRY');
      else if (s < -2.5 && !trend) this.executeTrade('SELL', 'QUANT_ENTRY');
    } else if (this.state.position.type === 'LONG') {
      if (!trend || s < -0.5) this.executeTrade('CLOSE', 'QUANT_EXIT');
    } else if (this.state.position.type === 'SHORT') {
      if (trend || s > 0.5) this.executeTrade('CLOSE', 'QUANT_EXIT');
    }
  }

  executeTrade(action: 'BUY' | 'SELL' | 'CLOSE', reason: string = 'MANUAL'): void {
    const price = this.state.price;

    if (action === 'BUY') {
      if (this.state.position.type === 'SHORT') this.executeTrade('CLOSE', 'FLIP');
      if (this.state.position.type === 'LONG') return;

      const margin = this.state.cash * 0.5;
      const size = margin / price;
      const fee = (size * price) * this.config.takerFee;

      this.state.cash -= fee;
      this.state.position = { size, entryPrice: price, type: 'LONG' };
      this.state.lastTradeTime = Date.now();
      this.log(`LONG EXECUTED: ${size.toFixed(4)} ETH`, 'success');
    } else if (action === 'SELL') {
      if (this.state.position.type === 'LONG') this.executeTrade('CLOSE', 'FLIP');
      if (this.state.position.type === 'SHORT') return;

      const margin = this.state.cash * 0.5;
      const size = margin / price;
      const fee = (size * price) * this.config.takerFee;

      this.state.cash -= fee;
      this.state.position = { size, entryPrice: price, type: 'SHORT' };
      this.state.lastTradeTime = Date.now();
      this.log(`SHORT EXECUTED: ${size.toFixed(4)} ETH`, 'error');
    } else if (action === 'CLOSE') {
      if (this.state.position.type === 'NONE') return;

      const valExit = this.state.position.size * price;
      const valEntry = this.state.position.size * this.state.position.entryPrice;
      const fee = valExit * this.config.takerFee;

      let pnl = 0;
      if (this.state.position.type === 'LONG') pnl = valExit - valEntry;
      else pnl = valEntry - valExit;

      this.state.cash += (pnl - fee);
      this.state.position = { size: 0, entryPrice: 0, type: 'NONE' };
      this.state.lastTradeTime = Date.now();
      this.log(`POSITION CLOSED. PnL: $${pnl.toFixed(2)}`, pnl > 0 ? 'success' : 'neutral');
    }

    this.notifyListeners();
  }

  setAutoMode(enabled: boolean): void {
    this.state.isAuto = enabled;
    this.log(`AUTO-PILOT ${enabled ? 'ENGAGED' : 'DISENGAGED'}`, 'info');
    this.notifyListeners();
  }

  setRiskConfig(config: RiskManagementConfig): void {
    this.state.riskConfig = config;
    this.notifyListeners();
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.simInterval) clearInterval(this.simInterval);
  }
}

export interface LogMessage {
  time: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'neutral';
}
