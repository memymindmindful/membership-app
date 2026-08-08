import React from 'react';
import { Sparkles, Globe, UserCheck, Shield, Smartphone, LogOut } from 'lucide-react';
import { AppLanguage, Employee, Client, BrandSettings } from '../types';
import { translations } from '../lib/translations';
import appLogo from '../assets/images/me_my_mind_logo_1785924412256.jpg';

interface HeaderProps {
  viewMode: 'customer' | 'staff';
  setViewMode: (mode: 'customer' | 'staff') => void;
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  currentStaff: Employee | null;
  setCurrentStaff: (staff: Employee | null) => void;
  employees: Employee[];
  currentClient: Client | null;
  setCurrentClient: (client: Client | null) => void;
  allClients: Client[];
  brandSettings?: BrandSettings;
  onOpenAuditLogs?: () => void;
  onOpenCatalog?: () => void;
  isLiffLoggedIn?: boolean;
  isLiffApp?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  lang,
  setLang,
  currentStaff,
  setCurrentStaff,
  employees,
  currentClient,
  setCurrentClient,
  allClients,
  brandSettings,
  onOpenAuditLogs,
  onOpenCatalog,
  isLiffLoggedIn = false,
  isLiffApp = false,
}) => {
  const t = translations[lang];
  const displayLogo = brandSettings?.logoUrl || appLogo;
  const displayName = brandSettings?.brandName || 'Me.My.Mind Membership';
  const displayTagline = brandSettings?.brandTagline || 'Your Daily Ritual of Self-Love';

  // Check URL parameters for explicit staff or demo mode
  const isStaffRequested = window.location.search.includes('staff=true') || window.location.search.includes('mode=staff');
  const isDemoRequested = window.location.search.includes('demo=true') || window.location.search.includes('dev=true');
  
  // Mode switcher is shown ONLY if staff mode is explicitly requested or in staff view or demo URL parameter
  const showModeSwitcher = isStaffRequested || isDemoRequested || viewMode === 'staff';

  // Demo user selector shown ONLY when explicitly requested with ?demo=true in URL (never to real customers)
  const showDemoSelector = viewMode === 'customer' && !isLiffLoggedIn && isDemoRequested;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-[#3D3835] shadow-2xs border-b border-[#F2E3E1]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2 flex-nowrap">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img
            src={displayLogo}
            alt={displayName}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-[#E88D9F] shadow-xs shrink-0 bg-white"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <h1 className="font-serif text-sm sm:text-xl font-bold tracking-tight text-[#3D3835] flex items-center gap-1 truncate">
              <span className="truncate">{displayName}</span>
              <Sparkles className="w-3.5 h-3.5 text-[#E88D9F] shrink-0" />
            </h1>
            <p className="text-[10px] sm:text-[11px] text-[#D87085] tracking-wide font-medium hidden sm:block truncate">
              {displayTagline}
            </p>
          </div>
        </div>

        {/* Center / Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Mode Switcher Pills (Automatically hidden for LINE customers in production) */}
          {showModeSwitcher && (
            <div className="bg-[#FAF0ED] p-0.5 sm:p-1 rounded-full flex items-center text-[11px] sm:text-xs font-medium border border-[#F2E3E1]">
              <button
                onClick={() => setViewMode('customer')}
                className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full transition ${
                  viewMode === 'customer'
                    ? 'bg-[#E88D9F] text-white shadow-xs font-semibold'
                    : 'text-[#6E6763] hover:text-[#3D3835]'
                }`}
              >
                <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Customer</span>
              </button>
              <button
                onClick={() => setViewMode('staff')}
                className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full transition ${
                  viewMode === 'staff'
                    ? 'bg-[#E88D9F] text-white shadow-xs font-semibold'
                    : 'text-[#6E6763] hover:text-[#3D3835]'
                }`}
              >
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Staff</span>
              </button>
            </div>
          )}

          {/* Customer Profile Indicator in LIFF / Customer Mode */}
          {viewMode === 'customer' && isLiffLoggedIn && currentClient && (
            <div className="hidden md:flex items-center gap-2 bg-[#FAF0ED] px-3 py-1 rounded-full border border-[#F2E3E1] text-xs font-medium text-[#3D3835]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-[#3D3835]">{currentClient.displayName}</span>
              <span className="text-[10px] text-[#D87085] font-bold">({currentClient.memberCode})</span>
            </div>
          )}

          {/* Demo Customer Selector (Only when explicitly requested with ?demo=true in URL) */}
          {showDemoSelector && (
            <div className="flex items-center gap-1 bg-[#FAF0ED] px-2 py-1 rounded-full border border-[#F2E3E1] text-xs">
              <UserCheck className="w-3.5 h-3.5 text-[#D87085]" />
              <select
                value={currentClient?.id || ''}
                onChange={(e) => {
                  const found = allClients.find((c) => c.id === e.target.value);
                  if (found) setCurrentClient(found);
                }}
                className="bg-white text-[#3D3835] text-[11px] py-0.5 px-1.5 rounded-full border border-[#F2E3E1] focus:outline-none font-medium"
              >
                {allClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.displayName} ({client.memberCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* If in Staff Mode: Staff Account Indicator */}
          {viewMode === 'staff' && currentStaff && (
            <div className="flex items-center gap-1.5 bg-[#FAF0ED] px-2.5 py-1 rounded-full border border-[#F2E3E1] text-xs">
              <span className="w-2 h-2 rounded-full bg-[#E88D9F] animate-pulse" />
              <span className="text-[#3D3835] font-semibold text-[11px] sm:text-xs truncate max-w-[80px] sm:max-w-none">{currentStaff.displayName}</span>
              <button
                onClick={() => setCurrentStaff(null)}
                title="Switch Staff Account"
                className="text-[#9C948E] hover:text-[#D87085] ml-0.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Language Switcher Button */}
          <button
            onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#FAF0ED] text-[#3D3835] rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-[#F2E3E1] transition shadow-2xs shrink-0"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#D87085]" />
            <span>{lang}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
