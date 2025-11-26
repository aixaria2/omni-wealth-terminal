import { useState } from 'react';
import { Lock, LogOut, Clock, TrendingUp, Zap } from 'lucide-react';
import { authorityService } from '@/lib/authorityService';

interface AuthorityDashboardProps {
  onLogout: () => void;
}

export default function AuthorityDashboard({ onLogout }: AuthorityDashboardProps) {
  const [timeRemaining] = useState(() => authorityService.getSessionTimeRemaining());

  const handleLogout = () => {
    authorityService.logout();
    onLogout();
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-950 to-purple-900 border-b border-purple-700 px-3 py-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[10px] font-bold text-purple-300 tracking-widest">
          <Zap className="w-3 h-3" /> AUTHORITY ACCESS ACTIVE
        </span>
        <button
          onClick={handleLogout}
          className="text-purple-400 hover:text-purple-300 transition-colors text-[8px] font-bold flex items-center gap-1"
        >
          <LogOut className="w-3 h-3" /> LOGOUT
        </button>
      </div>

      <div className="p-3 space-y-2">
        {/* Session Info */}
        <div className="bg-black/30 rounded p-2 border border-purple-700/30">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3 h-3 text-purple-400" />
            <span className="text-[9px] font-bold text-gray-400">SESSION TIME REMAINING</span>
          </div>
          <div className="text-[11px] font-mono text-purple-300">
            {timeRemaining > 0 ? `${timeRemaining} minutes` : 'Session expired'}
          </div>
        </div>

        {/* Exclusive Features */}
        <div className="bg-black/30 rounded p-2 border border-purple-700/30">
          <div className="text-[9px] font-bold text-gray-400 mb-2">EXCLUSIVE FEATURES</div>
          <div className="space-y-1 text-[8px] text-purple-300">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              <span>Authority Prediction Line</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3" />
              <span>Advanced Market Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3" />
              <span>Exclusive Trading Signals</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-gradient-to-r from-purple-950/50 to-transparent rounded p-2 border border-purple-700/30">
          <div className="text-[8px] text-purple-400 text-center">
            ✓ All authority features unlocked and active
          </div>
        </div>
      </div>
    </div>
  );
}
