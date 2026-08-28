import React, { useRef, useState, useEffect } from 'react';
import { Camera, ShieldCheck, ShieldAlert, Loader2, UserCheck, RefreshCw } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';

interface FaceLivenessProps {
  storedProfilePicture: string; // Base64
  onSuccess: () => void;
  onCancel: () => void;
}

export const FaceLiveness: React.FC<FaceLivenessProps> = ({ storedProfilePicture, onSuccess, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<'initializing' | 'ready' | 'verifying' | 'success' | 'failed'>('initializing');
  const [message, setMessage] = useState('Loading biometric models...');
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    loadModels();
    return () => stopCamera();
  }, []);

  const loadModels = async () => {
    try {
      const MODEL_URL = '/model';
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
      startCamera();
    } catch (err) {
      console.error("Failed to load face-api models", err);
      setError("Failed to load biometric models. Please check your internet connection.");
      setStatus('failed');
    }
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', 
          width: { ideal: 720 }, 
          height: { ideal: 720 } 
        } 
      });
      
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video plays
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Play error:", e));
        };
        setStatus('ready');
        setMessage('Position your face in the frame');
        setError(null);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      let errorMessage = 'Could not access camera.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please click the camera icon in your browser address bar to allow access.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application.';
      }

      setError(errorMessage);
      setStatus('failed');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const blinkRef = useRef(false);

  useEffect(() => {
    let isActive = true;
    
    const detectBlinkBackground = async () => {
      let maxEar = 0;
      let minEar = 1;
      
      while (isActive) {
        if (status === 'ready' && videoRef.current && modelsLoaded && !blinkRef.current) {
          try {
            const video = videoRef.current;
            if (video.readyState === 4 && video.videoWidth > 0) {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

              const detection = await faceapi.detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.3 })).withFaceLandmarks();
              
              if (detection) {
                const leftEye = detection.landmarks.getLeftEye();
                const rightEye = detection.landmarks.getRightEye();
                const ear = (eye: faceapi.Point[]) => {
                  const v1 = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
                  const v2 = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
                  const h = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
                  return (v1 + v2) / (2.0 * h);
                };
                const currentEar = (ear(leftEye) + ear(rightEye)) / 2;
                
                if (currentEar > maxEar) maxEar = currentEar;
                if (currentEar < minEar) minEar = currentEar;
                
                if (maxEar - minEar > 0.04 && minEar < 0.28) {
                    blinkRef.current = true;
                    console.log("Background blink detected!");
                }
              }
            }
          } catch (e) {
            // ignore background errors
          }
        }
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    };
    
    if (status === 'ready' && modelsLoaded) {
      detectBlinkBackground();
    }
    
    return () => { isActive = false; };
  }, [status, modelsLoaded]);

  const captureAndVerify = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    setStatus('verifying');
    setError(null);
    setMessage('Simulating biometric check for demo...');

    try {
      // For portfolio/demo purposes, bypass the actual face-api.js comparison.
      // This allows interviewers to test the login flow without needing real biometric data,
      // and avoids the "no face found" error for the blank demo profile pictures.
      setTimeout(() => {
        setStatus('success');
        setMessage('Identity verified successfully!');
        stopCamera();
        setTimeout(onSuccess, 500);
      }, 1500);
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'An error occurred during verification.');
      setStatus('failed');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/10">
        <div className="bg-slate-900 p-6 text-center">
          <h2 className="text-xl font-bold text-white flex items-center justify-center">
            <UserCheck className="w-6 h-6 mr-2 text-blue-400" />
            Biometric Verification
          </h2>
          <p className="text-slate-400 text-xs mt-1">Matching with Registered Profile Photo</p>
        </div>

        <div className="p-6 space-y-6">
          {/* 1:1 Aspect Ratio Container */}
          <div className="relative aspect-square bg-slate-100 rounded-full overflow-hidden border-4 border-slate-200 shadow-inner mx-auto w-64 h-64">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover scale-x-[-1] ${status === 'verifying' ? 'opacity-50' : ''}`}
            />
            
            {status === 'initializing' && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/10 backdrop-blur-[1px]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                <span className="text-xs font-bold text-slate-600">Loading Models...</span>
              </div>
            )}

            {status === 'verifying' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/20">
                <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
              </div>
            )}

            {status === 'success' && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-[2px]">
                <ShieldCheck className="w-20 h-20 text-green-500 animate-bounce" />
              </div>
            )}

            {status === 'failed' && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 backdrop-blur-[2px]">
                <ShieldAlert className="w-20 h-20 text-red-500" />
              </div>
            )}
          </div>

          <div className="text-center">
            <p className={`text-sm font-medium ${status === 'failed' ? 'text-red-600' : 'text-slate-600'}`}>
              {status === 'failed' ? error : message}
            </p>
            <p className="text-xs text-slate-400 mt-2">
                Ensure your face is clearly visible and well-lit.
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <div className="flex space-x-3">
              {status === 'failed' ? (
                <button
                  onClick={() => { 
                    setStatus('ready'); 
                    setError(null); 
                    setMessage('Position your face in the frame'); 
                    startCamera(); // Ensure camera is running
                  }}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
              ) : (
                <button
                  onClick={captureAndVerify}
                  disabled={status !== 'ready' || !modelsLoaded}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {modelsLoaded ? 'Verify Identity' : 'Loading...'}
                </button>
              )}
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
            
            {/* Demo Bypass Button */}
            <button
              onClick={() => {
                setStatus('verifying');
                setError(null);
                setMessage('Bypassing biometric check for demo...');
                setTimeout(() => {
                  setStatus('success');
                  setMessage('Identity verified successfully!');
                  stopCamera();
                  setTimeout(onSuccess, 500);
                }, 1000);
              }}
              className="w-full bg-indigo-50 text-indigo-600 py-2 rounded-xl font-bold text-sm flex items-center justify-center hover:bg-indigo-100 transition-colors border border-indigo-200"
            >
              Skip Camera Check (Demo Mode)
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            Powered by FaceAPI.js (Local Processing)
          </p>
        </div>
      </div>
    </div>
  );
};
