import { describe, it, expect, beforeEach } from 'vitest';
import { AlertsManager, DEFAULT_ALERT_CONFIG } from './alertsService';

describe('Alerts Service', () => {
  let alertsManager: AlertsManager;

  beforeEach(() => {
    alertsManager = new AlertsManager();
  });

  describe('createAlert', () => {
    it('should create an alert with correct properties', () => {
      const alert = alertsManager.createAlert('indicator', 'warning', 'Test Alert', 'Test message');
      
      expect(alert).not.toBeNull();
      expect(alert?.type).toBe('indicator');
      expect(alert?.severity).toBe('warning');
      expect(alert?.title).toBe('Test Alert');
      expect(alert?.message).toBe('Test message');
      expect(alert?.read).toBe(false);
    });

    it('should debounce duplicate alerts', () => {
      const alert1 = alertsManager.createAlert('indicator', 'warning', 'Test', 'Message');
      const alert2 = alertsManager.createAlert('indicator', 'warning', 'Test', 'Message');
      
      expect(alert1).not.toBeNull();
      expect(alert2).toBeNull(); // Debounced
    });

    it('should allow same alert after debounce period', async () => {
      const alert1 = alertsManager.createAlert('indicator', 'warning', 'Test', 'Message');
      
      // Wait for debounce period
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const alert2 = alertsManager.createAlert('indicator', 'warning', 'Test', 'Message');
      expect(alert1).not.toBeNull();
      expect(alert2).not.toBeNull();
    });

    it('should keep only last 100 alerts', () => {
      for (let i = 0; i < 110; i++) {
        alertsManager.createAlert('indicator', 'info', `Alert ${i}`, 'Message');
      }
      
      const alerts = alertsManager.getAlerts();
      expect(alerts.length).toBeLessThanOrEqual(100);
    });
  });

  describe('RSI alerts', () => {
    it('should alert on RSI overbought', () => {
      const alert = alertsManager.alertRSIOverbought(75);
      expect(alert).not.toBeNull();
      expect(alert?.title).toBe('RSI Overbought');
      expect(alert?.severity).toBe('warning');
    });

    it('should alert on RSI oversold', () => {
      const alert = alertsManager.alertRSIOversold(25);
      expect(alert).not.toBeNull();
      expect(alert?.title).toBe('RSI Oversold');
      expect(alert?.severity).toBe('warning');
    });

    it('should not alert if RSI alerts disabled', () => {
      alertsManager.updateConfig({ rsiOverbought: false, rsiOversold: false });
      const alert1 = alertsManager.alertRSIOverbought(75);
      const alert2 = alertsManager.alertRSIOversold(25);
      
      expect(alert1).toBeNull();
      expect(alert2).toBeNull();
    });
  });

  describe('MACD alerts', () => {
    it('should alert on MACD crossover', () => {
      const alert = alertsManager.alertMACDCrossover(true);
      expect(alert).not.toBeNull();
      expect(alert?.title).toBe('MACD Crossover');
    });

    it('should not alert if MACD alerts disabled', () => {
      alertsManager.updateConfig({ macdCrossover: false });
      const alert = alertsManager.alertMACDCrossover(true);
      expect(alert).toBeNull();
    });
  });

  describe('Risk alerts', () => {
    it('should alert on stop-loss trigger', () => {
      const alert = alertsManager.alertStopLossTriggered(95, 50);
      expect(alert).not.toBeNull();
      expect(alert?.title).toBe('Stop-Loss Triggered');
      expect(alert?.severity).toBe('critical');
    });

    it('should alert on take-profit trigger', () => {
      const alert = alertsManager.alertTakeProfitTriggered(110, 100);
      expect(alert).not.toBeNull();
      expect(alert?.title).toBe('Take-Profit Triggered');
      expect(alert?.severity).toBe('info');
    });

    it('should not alert if risk alerts disabled', () => {
      alertsManager.updateConfig({ stopLossTriggered: false, takeProfitTriggered: false });
      const alert1 = alertsManager.alertStopLossTriggered(95, 50);
      const alert2 = alertsManager.alertTakeProfitTriggered(110, 100);
      
      expect(alert1).toBeNull();
      expect(alert2).toBeNull();
    });
  });

  describe('Performance alerts', () => {
    it('should alert on large drawdown', () => {
      const alert = alertsManager.alertLargeDrawdown(10, 5);
      expect(alert).not.toBeNull();
      expect(alert?.title).toBe('Large Drawdown');
      expect(alert?.severity).toBe('critical');
    });

    it('should not alert on small drawdown', () => {
      const alert = alertsManager.alertLargeDrawdown(3, 5);
      expect(alert).toBeNull();
    });

    it('should alert on win streak ended', () => {
      const alert = alertsManager.alertWinStreakEnded(5);
      expect(alert).not.toBeNull();
      expect(alert?.title).toBe('Win Streak Ended');
    });

    it('should not alert on short win streak', () => {
      const alert = alertsManager.alertWinStreakEnded(2);
      expect(alert).toBeNull();
    });
  });

  describe('Alert management', () => {
    it('should get all alerts', () => {
      alertsManager.createAlert('indicator', 'info', 'Alert 1', 'Message 1');
      alertsManager.createAlert('risk', 'warning', 'Alert 2', 'Message 2');
      
      const alerts = alertsManager.getAlerts();
      expect(alerts.length).toBe(2);
    });

    it('should get unread alerts', () => {
      const alert1 = alertsManager.createAlert('indicator', 'info', 'Alert 1', 'Message 1');
      const alert2 = alertsManager.createAlert('risk', 'warning', 'Alert 2', 'Message 2');
      
      alertsManager.markAsRead(alert1!.id);
      
      const unread = alertsManager.getUnreadAlerts();
      expect(unread.length).toBe(1);
      expect(unread[0].id).toBe(alert2!.id);
    });

    it('should mark alert as read', () => {
      const alert = alertsManager.createAlert('indicator', 'info', 'Test', 'Message');
      expect(alert?.read).toBe(false);
      
      alertsManager.markAsRead(alert!.id);
      const alerts = alertsManager.getAlerts();
      expect(alerts[0].read).toBe(true);
    });

    it('should clear all alerts', () => {
      alertsManager.createAlert('indicator', 'info', 'Alert 1', 'Message 1');
      alertsManager.createAlert('risk', 'warning', 'Alert 2', 'Message 2');
      
      alertsManager.clearAlerts();
      
      const alerts = alertsManager.getAlerts();
      expect(alerts.length).toBe(0);
    });
  });

  describe('Alert subscriptions', () => {
    it('should notify subscribers on new alert', () => {
      let notified = false;
      let alertCount = 0;
      
      alertsManager.subscribe((alerts) => {
        notified = true;
        alertCount = alerts.length;
      });
      
      alertsManager.createAlert('indicator', 'info', 'Test', 'Message');
      
      expect(notified).toBe(true);
      expect(alertCount).toBe(1);
    });

    it('should unsubscribe from alerts', () => {
      let callCount = 0;
      
      const unsubscribe = alertsManager.subscribe(() => {
        callCount++;
      });
      
      alertsManager.createAlert('indicator', 'info', 'Alert 1', 'Message 1');
      expect(callCount).toBe(1);
      
      unsubscribe();
      
      alertsManager.createAlert('indicator', 'info', 'Alert 2', 'Message 2');
      expect(callCount).toBe(1); // Should not increment
    });
  });

  describe('Configuration', () => {
    it('should update alert configuration', () => {
      alertsManager.updateConfig({ rsiOverbought: false });
      
      const alert = alertsManager.alertRSIOverbought(75);
      expect(alert).toBeNull();
    });

    it('should use default configuration', () => {
      const newManager = new AlertsManager();
      
      const alert = newManager.alertRSIOverbought(75);
      expect(alert).not.toBeNull(); // Should use default enabled
    });
  });
});
