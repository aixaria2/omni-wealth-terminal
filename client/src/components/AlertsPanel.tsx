import { useState } from 'react';
import { AlertCircle, Info, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Alert } from '@/lib/alertsService';

interface AlertsPanelProps {
  alerts: Alert[];
  onClearAll: () => void;
  onMarkAsRead: (alertId: string) => void;
}

export default function AlertsPanel({ alerts, onClearAll, onMarkAsRead }: AlertsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'risk':
        return <AlertCircle className="w-4 h-4" />;
      case 'indicator':
        return <Info className="w-4 h-4" />;
      case 'trade':
        return <CheckCircle className="w-4 h-4" />;
      case 'performance':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getAlertColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-rose-500 bg-rose-950/30';
      case 'warning':
        return 'border-yellow-500 bg-yellow-950/30';
      case 'info':
        return 'border-blue-500 bg-blue-950/30';
      default:
        return 'border-gray-500 bg-gray-950/30';
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-rose-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-muted border-b border-border px-3 py-2 flex items-center justify-between hover:bg-muted/80 transition-colors"
      >
        <span className="flex items-center gap-2 text-[10px] font-bold text-gray-500 tracking-widest">
          <AlertCircle className="w-3 h-3" /> ALERTS
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-rose-500 text-white rounded text-[8px] font-bold">
              {unreadCount}
            </span>
          )}
        </span>
        <span className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isExpanded && (
        <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="text-center text-[8px] text-gray-600 py-4">
              No alerts yet
            </div>
          ) : (
            <>
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded p-2 ${getAlertColor(alert.severity)} ${alert.read ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className={`mt-0.5 flex-shrink-0 ${getSeverityColor(alert.severity)}`}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[9px] font-bold text-gray-200">
                          {alert.title}
                        </div>
                        <div className="text-[8px] text-gray-400 mt-0.5 break-words">
                          {alert.message}
                        </div>
                        <div className="text-[7px] text-gray-600 mt-1">
                          {alert.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onMarkAsRead(alert.id)}
                      className="flex-shrink-0 text-gray-600 hover:text-gray-400 transition-colors"
                      title={alert.read ? 'Mark as unread' : 'Mark as read'}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {alerts.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="w-full mt-2 text-[8px] text-gray-600 hover:text-gray-400 py-1 border-t border-border pt-2"
                >
                  Clear All
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
