import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, X, Camera, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

interface QRScannerProps {
  onScan: (token: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    try {
      const scannerId = "qr-reader";
      
      // Ensure previous instance is cleared
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }

      scannerRef.current = new Html5Qrcode(scannerId);

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Success callback
          if (scannerRef.current) {
             scannerRef.current.stop().then(() => {
                scannerRef.current?.clear();
                onScan(decodedText);
             }).catch(err => console.error("Failed to stop after scan", err));
          }
        },
        (errorMessage) => {
          // Ignore frame parse errors
        }
      );
      
      setPermissionGranted(true);
      setIsScanning(true);
    } catch (err: any) {
      console.error("Failed to start scanner", err);
      let errorMessage = "Camera access denied or unavailable.";
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = "Camera permission denied. Please allow camera access.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = "No camera found on this device.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = "Camera is already in use.";
      }
      
      setError(errorMessage);
      setPermissionGranted(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="bg-slate-900 p-6 flex items-center justify-between">
          <div className="flex items-center">
            <QrCode className="w-6 h-6 text-blue-400 mr-3" />
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Scan QR Code</h2>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Instant Login Access</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          <div className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner flex items-center justify-center">
            <div id="qr-reader" className="w-full h-full"></div>
            
            {!permissionGranted && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 p-6 text-center z-10">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-slate-900 font-bold text-lg mb-2">Camera Access Required</h3>
                <p className="text-slate-500 text-xs mb-6 leading-relaxed">
                  To scan your login QR code, we need access to your device's camera.
                </p>
                <button
                  onClick={startScanning}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all transform hover:scale-105 active:scale-95 flex items-center"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Allow Camera Access
                </button>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-6 text-center z-20">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-sm text-red-700 font-bold mb-2">Camera Error</p>
                <p className="text-xs text-red-600 leading-relaxed mb-6">{error}</p>
                <button 
                  onClick={startScanning}
                  className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
            
            {isScanning && (
               <div className="absolute inset-0 pointer-events-none border-[40px] border-slate-900/50 z-10">
                  <div className="absolute inset-0 border-2 border-blue-500/50 animate-pulse"></div>
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-[scan_2s_ease-in-out_infinite]"></div>
               </div>
            )}
          </div>

          <div className="mt-8 text-center space-y-4">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
              <Camera className="w-3 h-3 mr-2" />
              Place QR code within the frame
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[250px] mx-auto">
              Your unique QR code is provided by the system administrator. Scan it for secure, passwordless access.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-6 border-t border-slate-100 text-center">
           <button 
            onClick={onClose}
            className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
           >
             Cancel and use password
           </button>
        </div>
      </div>
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
