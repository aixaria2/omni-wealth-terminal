/**
 * Advanced Alerts Service
 * Handles notifications for risk thresholds, indicator extremes, and trading events
 */

export interface Alert {
  id: string;
  type: 'risk' | 'indicator' | 'trade' | 'performance';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, any>;
}

export interface AlertConfig {
  rsiOverbought: boolean;
  rsiOversold: boolean;
  macdCrossover: boolean;
  bbandBreakout: boolean;
  stopLossTriggered: boolean;
  takeProfitTriggered: boolean;
  largeDrawdown: boolean;
  winStreakEnded: boolean;
  highVolatility: boolean;
}

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  rsiOverbought: true,
  rsiOversold: true,
  macdCrossover: true,
  bbandBreakout: true,
  stopLossTriggered: true,
  takeProfitTriggered: true,
  largeDrawdown: true,
  winStreakEnded: true,
  highVolatility: true
};

export class AlertsManager {
  private alerts: Alert[] = [];
  private config: AlertConfig = DEFAULT_ALERT_CONFIG;
  private listeners: ((alerts: Alert[]) => void)[] = [];
  private lastAlertTime: Record<string, number> = {};
  private alertDebounceMs = 1000; // Prevent duplicate alerts within 1 second

  constructor(config: Partial<AlertConfig> = {}) {
    this.config = { ...DEFAULT_ALERT_CONFIG, ...config };
  }

  /**
   * Create a new alert
   */
  createAlert(
    type: Alert['type'],
    severity: Alert['severity'],
    title: string,
    message: string,
    data?: Record<string, any>
  ): Alert | null {
    // Debounce duplicate alerts
    const key = `${type}-${title}`;
    const lastTime = this.lastAlertTime[key] || 0;
    if (Date.now() - lastTime < this.alertDebounceMs) {
      return null;
    }

    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      title,
      message,
      timestamp: new Date(),
      read: false,
      data
    };

    this.alerts.unshift(alert); // Add to beginning
    this.lastAlertTime[key] = Date.now();

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }

    this.notifyListeners();
    return alert;
  }

  /**
   * Alert for RSI overbought condition
   */
  alertRSIOverbought(rsi: number): Alert | null {
    if (!this.config.rsiOverbought) return null;
    return this.createAlert(
      'indicator',
      'warning',
      'RSI Overbought',
      `RSI reached ${rsi.toFixed(2)} - market may be overextended`,
      { rsi }
    );
  }

  /**
   * Alert for RSI oversold condition
   */
  alertRSIOversold(rsi: number): Alert | null {
    if (!this.config.rsiOversold) return null;
    return this.createAlert(
      'indicator',
      'warning',
      'RSI Oversold',
      `RSI reached ${rsi.toFixed(2)} - market may be undervalued`,
      { rsi }
    );
  }

  /**
   * Alert for MACD crossover
   */
  alertMACDCrossover(isPositive: boolean): Alert | null {
    if (!this.config.macdCrossover) return null;
    return this.createAlert(
      'indicator',
      'info',
      'MACD Crossover',
      `MACD histogram turned ${isPositive ? 'positive' : 'negative'}`,
      { isPositive }
    );
  }

  /**
   * Alert for Bollinger Band breakout
   */
  alertBBandBreakout(side: 'upper' | 'lower'): Alert | null {
    if (!this.config.bbandBreakout) return null;
    return this.createAlert(
      'indicator',
      'warning',
      'Bollinger Band Breakout',
      `Price broke ${side} Bollinger Band - potential volatility spike`,
      { side }
    );
  }

  /**
   * Alert for stop-loss trigger
   */
  alertStopLossTriggered(price: number, loss: number): Alert | null {
    if (!this.config.stopLossTriggered) return null;
    return this.createAlert(
      'risk',
      'critical',
      'Stop-Loss Triggered',
      `Position closed at $${price.toFixed(2)} with loss of $${loss.toFixed(2)}`,
      { price, loss }
    );
  }

  /**
   * Alert for take-profit trigger
   */
  alertTakeProfitTriggered(price: number, profit: number): Alert | null {
    if (!this.config.takeProfitTriggered) return null;
    return this.createAlert(
      'trade',
      'info',
      'Take-Profit Triggered',
      `Position closed at $${price.toFixed(2)} with profit of $${profit.toFixed(2)}`,
      { price, profit }
    );
  }

  /**
   * Alert for large drawdown
   */
  alertLargeDrawdown(drawdown: number, threshold: number = 5): Alert | null {
    if (!this.config.largeDrawdown || drawdown < threshold) return null;
    return this.createAlert(
      'performance',
      'critical',
      'Large Drawdown',
      `Account drawdown reached ${drawdown.toFixed(2)}% - consider risk reduction`,
      { drawdown }
    );
  }

  /**
   * Alert for win streak ended
   */
  alertWinStreakEnded(winStreak: number): Alert | null {
    if (!this.config.winStreakEnded || winStreak < 3) return null;
    return this.createAlert(
      'performance',
      'warning',
      'Win Streak Ended',
      `${winStreak}-trade winning streak ended - stay disciplined`,
      { winStreak }
    );
  }

  /**
   * Alert for high volatility
   */
  alertHighVolatility(volatility: number, threshold: number = 2): Alert | null {
    if (!this.config.highVolatility || volatility < threshold) return null;
    return this.createAlert(
      'indicator',
      'warning',
      'High Volatility Detected',
      `Market volatility is ${volatility.toFixed(2)}x normal - consider reducing position size`,
      { volatility }
    );
  }

  /**
   * Get all alerts
   */
  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Get unread alerts
   */
  getUnreadAlerts(): Alert[] {
    return this.alerts.filter(a => !a.read);
  }

  /**
   * Mark alert as read
   */
  markAsRead(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.read = true;
      this.notifyListeners();
    }
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
    this.notifyListeners();
  }

  /**
   * Update alert configuration
   */
  updateConfig(config: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Subscribe to alert changes
   */
  subscribe(listener: (alerts: Alert[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getAlerts()));
  }
}
