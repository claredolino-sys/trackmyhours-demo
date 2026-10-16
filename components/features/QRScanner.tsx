import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, X, Camera, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export interface QRScannerProps {
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
    try {
      setError(null);
      setIsScanning(true);
      
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // Success callback
          html5QrCode.stop().then(() => {
             onScan(decodedText);
          }).catch(err => console.error("Error stopping scanner after read", err));
        },
        (errorMessage) => {
          // Parse error or no QR code detected - ignore to keep scanning
        }
      );
      setPermissionGranted(true);
    } catch (err: any) {
      console.error("Failed to start QR scanner:", err);
      setIsScanning(false);
      if (err.name === 'NotAllowedError' || err.includes?.('Permission')) {
        setError("Camera permission denied. Please enable camera access to scan your QR code.");
      } else {
        setError("Could not access camera for QR scanning. Make sure your device has a working camera.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl relative">
        <div className="p-4 bg-brand-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode size={20} />
            <h3 className="font-bold text-lg">Scan Login QR</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex flex-col items-center justify-center min-h-[280px]">
            <div id="reader" className="w-full"></div>
            
            {!isScanning && !error && (
              <div className="text-center p-6 space-y-4">
                <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto text-brand-600">
                  <Camera size={32} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Scan your QR Token</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Hold your generated QR code up to your camera to sign in instantly.
                  </p>
                </div>
                <button
                  onClick={startScanning}
                  className="bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm inline-flex items-center space-x-2"
                >
                  <Camera size={16} />
                  <span>Start Camera</span>
                </button>
              </div>
            )}

            {isScanning && (
              <div className="absolute top-2 left-2 bg-brand-600/80 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center space-x-1 backdrop-blur-sm pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span>Camera Active</span>
              </div>
            )}

            {error && (
              <div className="text-center p-6 space-y-3">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                  <AlertCircle size={24} />
                </div>
                <p className="text-xs text-red-600 max-w-[200px] mx-auto">{error}</p>
                <button
                  onClick={startScanning}
                  className="text-xs text-brand-600 font-semibold underline hover:text-brand-700"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Cancel & Use Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
