import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, ShieldCheck, ShieldAlert, Loader2, RefreshCw, QrCode } from 'lucide-react';
import { detectNetwork } from '../../services/utils';
import { UserRole } from '../../types';

export interface NetworkGuardProps {
  children?: React.ReactNode;
  userRole?: UserRole;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const NetworkGuard: React.FC<NetworkGuardProps> = ({ children, userRole, onSuccess, onCancel }) => {
  // Admin and Super Admin are always granted immediately to avoid blocking/delay
  const [status, setStatus] = useState<'scanning' | 'denied' | 'granted'>(
    (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) ? 'granted' : 'scanning'
  );
  const [detectedNetwork, setDetectedNetwork] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentIp, setCurrentIp] = useState<string | null>(null);

  const verifyNetwork = async () => {
    if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) return;

    setStatus('scanning');
    setError(null);
    try {
      const net = await detectNetwork();
      setDetectedNetwork(net.ssid || net.ip || 'Unknown Network');
      setCurrentIp(net.ip || null);

      if (net.isAllowed) {
        setStatus('granted');
        if (onSuccess) onSuccess();
      } else {
        setStatus('denied');
        setError(`Access Denied. You are connected to an unauthorized network (${net.ssid || net.ip || 'External'}). Please connect to the designated Office Wi-Fi.`);
      }
    } catch (err: any) {
      console.error("Network verification error:", err);
      // Fallback to allow demo if network detection fails
      setStatus('granted');
      if (onSuccess) onSuccess();
    }
  };

  useEffect(() => {
    verifyNetwork();
  }, [userRole]);

  if (status === 'granted') {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100">
        <div className="p-6 text-center space-y-4">
          {status === 'scanning' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Wifi size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Verifying Office Network</h3>
              <p className="text-sm text-gray-500">
                Checking your current Wi-Fi/LAN connection to ensure you are logging attendance on-site...
              </p>
              <div className="flex items-center justify-center space-x-2 text-xs text-brand-600 font-medium">
                <Loader2 size={16} className="animate-spin" />
                <span>Scanning IP gateway...</span>
              </div>
            </div>
          )}

          {status === 'denied' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <WifiOff size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Network Restriction</h3>
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-left space-y-1">
                <p className="text-xs text-red-700 font-semibold flex items-center">
                  <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                  Not on Designated Wi-Fi
                </p>
                <p className="text-xs text-red-600 leading-relaxed">
                  {error || "Your device is not connected to the authorized facility network."}
                </p>
                {currentIp && (
                  <p className="text-[11px] text-gray-400 font-mono mt-1">
                    Detected IP: {currentIp}
                  </p>
                )}
              </div>
              
              <div className="space-y-2 pt-2">
                <button
                  onClick={verifyNetwork}
                  className="w-full bg-brand-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-brand-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw size={16} />
                  <span>Re-check Connection</span>
                </button>

                {/* Demo Mode Bypass */}
                <button
                  onClick={() => {
                    setStatus('granted');
                    if (onSuccess) onSuccess();
                  }}
                  className="w-full bg-indigo-50 text-indigo-700 py-2 rounded-xl font-semibold text-xs hover:bg-indigo-100 transition-colors border border-indigo-200"
                >
                  Bypass for Demo (Interviewer Mode)
                </button>

                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
                  >
                    Cancel & Return
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
