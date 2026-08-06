import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, X, AlertCircle, RefreshCw } from 'lucide-react';
import { AppLanguage } from '../types';
import { translations } from '../lib/translations';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (memberCode: string) => void;
  lang: AppLanguage;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  lang,
}) => {
  const t = translations[lang];
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let animId: number;
    let stream: MediaStream | null = null;

    if (isOpen) {
      setCameraError(null);
      setIsScanning(true);

      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.setAttribute('playsinline', 'true'); // required for iOS Safari
            videoRef.current.play();
            requestAnimationFrame(tick);
          }
        })
        .catch((err) => {
          console.warn('Camera access error:', err);
          setCameraError(
            lang === 'th'
              ? 'ไม่สามารถเข้าถึงกล้องได้ กรุณากรอกรหัสสมาชิกด้านล่าง'
              : 'Unable to access camera. Please enter member code manually below.'
          );
          setIsScanning(false);
        });
    }

    function tick() {
      if (!isOpen) return;

      if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            const foundCode = code.data.trim();
            if (foundCode.startsWith('MMM-') || foundCode.length >= 4) {
              onScanSuccess(foundCode);
              stopCamera();
              onClose();
              return;
            }
          }
        }
      }
      animId = requestAnimationFrame(tick);
    }

    function stopCamera() {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }

    return () => {
      cancelAnimationFrame(animId);
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim().toUpperCase());
      onClose();
      setManualCode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#D1CEC7] animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-[#EBE7E0]">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#F2EDE4] text-[#8C6D5E] rounded-full">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif italic font-bold text-[#2D2926]">{t.scanQrBtn}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#2D2926]/40 hover:text-[#2D2926] rounded-full hover:bg-[#EBE7E0] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <div className="relative aspect-square w-full bg-[#2D2926] rounded-2xl overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Target Reticle Overlay */}
            {isScanning && !cameraError && (
              <div className="absolute inset-0 border-2 border-dashed border-[#A3A895] m-12 rounded-2xl flex items-center justify-center pointer-events-none animate-pulse">
                <span className="text-xs text-[#F2EDE4] bg-[#2D2926]/80 px-3 py-1 rounded-full">
                  {lang === 'th' ? 'จัดวาง QR Code ให้อยู่ในกรอบ' : 'Align QR within frame'}
                </span>
              </div>
            )}

            {cameraError && (
              <div className="p-6 text-center text-stone-300 flex flex-col items-center gap-2">
                <AlertCircle className="w-10 h-10 text-[#A3A895]" />
                <p className="text-xs">{cameraError}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleManualSubmit} className="mt-5 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2D2926]">
              {lang === 'th' ? 'หรือพิมพ์รหัสสมาชิกโดยตรง:' : 'Or type Member Code manually:'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. MMM-0001"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-sm border border-[#D1CEC7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C6D5E] font-mono text-[#2D2926] uppercase"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#8C6D5E] hover:bg-[#7A5C4E] text-white text-sm font-semibold rounded-full shadow-2xs transition"
              >
                {t.search}
              </button>
            </div>
          </form>

          {/* Quick Demo Pre-fill helper chips */}
          <div className="mt-4 pt-3 border-t border-[#EBE7E0]">
            <p className="text-xs text-[#2D2926]/60 mb-2">Quick test member codes:</p>
            <div className="flex flex-wrap gap-2">
              {['MMM-0001', 'MMM-0002', 'MMM-0003'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    onScanSuccess(code);
                    onClose();
                  }}
                  className="px-3 py-1 text-xs bg-[#EBE7E0] hover:bg-[#D1CEC7] text-[#2D2926] font-mono font-semibold rounded-full transition"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
