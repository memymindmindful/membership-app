import React from 'react';
import { Loader2, Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';
import { BrandSettings } from '../types';
import appLogo from '../assets/images/me_my_mind_logo_1785924412256.jpg';

interface ConnectingScreenProps {
  brandSettings?: BrandSettings;
  onRetry?: () => void;
  message?: string;
}

export const ConnectingScreen: React.FC<ConnectingScreenProps> = ({
  brandSettings,
  onRetry,
  message = 'กำลังเชื่อมต่อระบบสมาชิก LINE...',
}) => {
  const displayLogo = brandSettings?.logoUrl || appLogo;
  const displayName = brandSettings?.brandName || 'Me.My.Mind Membership';
  const displayTagline = brandSettings?.brandTagline || 'Your Daily Ritual of Self-Love';

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-[#3D3835]">
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl max-w-sm w-full border border-[#F2E3E1] text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
        
        {/* Animated Brand Logo Container */}
        <div className="relative mb-6">
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
        <p className="text-xs text-[#D87085] font-medium tracking-wide mt-0.5 mb-6">
          {displayTagline}
        </p>

        {/* Connection Status Box */}
        <div className="w-full bg-[#FAF0ED] p-4 rounded-2xl border border-[#F2E3E1] flex flex-col items-center gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#8C6D5E]">
            <Loader2 className="w-5 h-5 text-[#D87085] animate-spin shrink-0" />
            <span>{message}</span>
          </div>

          <div className="w-full bg-white/80 h-1.5 rounded-full overflow-hidden border border-[#F2E3E1]">
            <div className="bg-gradient-to-r from-[#E88D9F] to-[#D87085] h-full w-2/3 rounded-full animate-pulse" />
          </div>

          <p className="text-[11px] text-[#6E6763] leading-relaxed">
            ระบบกำลังตรวจสอบสิทธิ์สมาชิก และจัดเตรียมข้อมูลส่วนตัวของคุณอย่างปลอดภัย
          </p>
        </div>

        {/* Security & Speed Tag */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#A39C98] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#06C755]" />
          <span>เชื่อมต่อด้วยระบบ LINE Official Login (SSL Safe)</span>
        </div>

        {/* Optional Manual Retry Button if taking too long */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 text-xs text-[#D87085] hover:text-[#B84E65] underline flex items-center gap-1 cursor-pointer font-medium transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>หากใช้เวลานานเกินไป คลิกที่นี่เพื่อรีโหลด</span>
          </button>
        )}

      </div>
    </div>
  );
};
