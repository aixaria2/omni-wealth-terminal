import { useState } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';
import { authorityService } from '@/lib/authorityService';

interface AuthorityLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthorityLoginModal({ isOpen, onClose, onSuccess }: AuthorityLoginModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Simulate slight delay for security
      await new Promise(resolve => setTimeout(resolve, 300));

      if (authorityService.authenticate(password)) {
        setPassword('');
        onSuccess();
        onClose();
      } else {
        setError('Invalid authority password');
        setPassword('');
      }
    } catch (err) {
      setError('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-500" />
            <h2 className="text-sm font-bold text-gray-200">AUTHORITY ACCESS</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-[11px] text-gray-500 mb-4">
          Enter the authority password to unlock advanced features including prediction lines, advanced analytics, and exclusive trading tools.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Password Input */}
          <div>
            <label className="text-[9px] font-bold text-gray-400 block mb-1">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Enter authority password"
              className="w-full bg-black/50 border border-gray-800 rounded px-3 py-2 text-[11px] text-gray-200 placeholder-gray-700 focus:outline-none focus:border-emerald-500 disabled:opacity-50 transition-colors"
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-2 bg-rose-950/30 border border-rose-500 rounded">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-[9px] text-rose-300">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:opacity-50 text-white text-[10px] font-bold py-2 rounded transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-3 h-3" />
            {isLoading ? 'VERIFYING...' : 'UNLOCK ACCESS'}
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-bold py-2 rounded transition-colors"
          >
            CANCEL
          </button>
        </form>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-800">
          <p className="text-[8px] text-gray-600 text-center">
            Authority access grants exclusive features and real-time market predictions
          </p>
        </div>
      </div>
    </div>
  );
}
