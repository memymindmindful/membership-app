import React from 'react';
import { Loader2, Sparkles, RefreshCw, ShieldCheck, LogIn, AlertCircle } from 'lucide-react';
import { BrandSettings } from '../types';
import appLogo from '../assets/images/me_my_mind_logo_1785924412256.jpg';

interface ConnectingScreenProps {
  brandSettings?: BrandSettings;
  onRetry?: () => void;
  onLineLogin?: () => void;
  onDemoLogin?: () => void;
  message?: string;
  error?: string | null;
  isInitializing?: boolean;
}

export const ConnectingScreen: React.FC<ConnectingScreenProps> = ({
  brandSettings,
  onRetry,
  onLineLogin,
  onDemoLogin,
  message = 'กำลังตรวจสอบสิทธิ์สมาชิก LINE...',
  error = null,
  isInitializing = true,
}) => {
  const displayLogo = (brandSettings?.logoUrl && brandSettings.logoUrl.trim()) ? brandSettings.logoUrl : appLogo;
  const displayName = brandSettings?.brandName || 'Me.My.Mind Membership';
  const displayTagline = brandSettings?.brandTagline || 'Your Daily Ritual of Self-Love';

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-[#3D3835]">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl max-w-sm w-full border border-[#F2E3E1] text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
        
        {/* Animated Brand Logo Container */}
        <div className="relative mb-5">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#E88D9F] to-[#D87085] rounded-full blur-md opacity-40 animate-pulse" />
          <img
            src={displayLogo}
            alt={displayName}
            className="relative w-20 h-20 rounded-full object-cover border-4 border-white shadow-md bg-white"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-0 right-0 bg-[#06C755] text-white p-1.5 rounded-full border-2 border-white shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <h2 className="font-serif text-xl font-bold text-[#3D3835] flex items-center justify-center gap-1.5">
          {displayName}
          <Sparkles className="w-4 h-4 text-[#E88D9F]" />
        </h2>
        <p className="text-xs text-[#D87085] font-medium tracking-wide mt-0.5 mb-5">
          {displayTagline}
        </p>

        {/* Connection Status / Login Box */}
        {error ? (
          <div className="w-full bg-rose-50 p-4 rounded-2xl border border-rose-200 flex flex-col items-center gap-2 mb-4 text-rose-800">
            <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
            <p className="text-xs font-semibold">{error}</p>
            <p className="text-[11px] text-rose-600">กรุณากดปุ่มเพื่อเข้าสู่ระบบ LINE อีกครั้ง</p>
          </div>
        ) : isInitializing ? (
          <div className="w-full bg-[#FAF0ED] p-4 rounded-2xl border border-[#F2E3E1] flex flex-col items-center gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#8C6D5E]">
              <Loader2 className="w-5 h-5 text-[#D87085] animate-spin shrink-0" />
              <span>{message}</span>
            </div>

            <div className="w-full bg-white/80 h-1.5 rounded-full overflow-hidden border border-[#F2E3E1]">
              <div className="bg-gradient-to-r from-[#E88D9F] to-[#D87085] h-full w-2/3 rounded-full animate-pulse" />
            </div>

            <p className="text-[11px] text-[#6E6763] leading-relaxed">
              ระบบกำลังยืนยันตัวตน และเชื่อมต่อข้อมูลสมาชิกของคุณโดยอัตโนมัติ
            </p>
          </div>
        ) : null}

        {/* Action Button: Login with LINE */}
        {onLineLogin && (
          <button
            onClick={onLineLogin}
            className="w-full py-3.5 px-4 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer mb-3"
          >
            <LogIn className="w-4 h-4" />
            <span>เข้าสู่ระบบด้วย LINE (Log in with LINE)</span>
          </button>
        )}

        {/* Security & Speed Tag */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#A39C98] font-medium my-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#06C755]" />
          <span>เชื่อมต่อด้วยระบบ LINE Official Login (SSL Safe)</span>
        </div>

        {/* Controls: Retry or Demo Mode */}
        <div className="mt-4 flex flex-col items-center gap-2 w-full pt-3 border-t border-[#F2E3E1]">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-[#D87085] hover:text-[#B84E65] flex items-center gap-1 cursor-pointer font-medium transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>รีโหลด / โหลดข้อมูลใหม่ (Retry)</span>
            </button>
          )}

          {onDemoLogin && (
            <button
              onClick={onDemoLogin}
              className="text-[11px] text-[#8C6D5E] hover:text-[#3D3835] underline cursor-pointer font-medium transition mt-1"
            >
              ทดลองใช้งานในโหมดตัวอย่าง (Demo Mode)
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

