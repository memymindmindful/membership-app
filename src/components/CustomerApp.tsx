import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Sparkles,
  Package,
  Ticket,
  Coins,
  Award,
  History,
  QrCode,
  Bell,
  Clock,
  ChevronRight,
  Check,
  Copy,
  Info,
  Gift,
  AlertTriangle,
  User,
  ShieldCheck,
} from 'lucide-react';
import {
  AppLanguage,
  CatalogItem,
  Client,
  ClientCoupon,
  ClientPackage,
  CoinTransaction,
  InAppNotification,
  PointsTransaction,
  PointsWallet,
  RewardCatalogItem,
} from '../types';
import {
  translations,
  formatDate,
  formatShortDate,
  formatCurrency,
  translateTxNote,
  translateNotificationTitle,
  translateNotificationMessage,
} from '../lib/translations';

interface CustomerAppProps {
  client: Client;
  coinBalance: number;
  coinTransactions: CoinTransaction[];
  pointsWallet: PointsWallet;
  pointsTransactions: PointsTransaction[];
  packages: ClientPackage[];
  coupons: ClientCoupon[];
  notifications: InAppNotification[];
  rewardCatalog: RewardCatalogItem[];
  lang: AppLanguage;
  brandSettings?: { brandName?: string; brandTagline?: string; logoUrl?: string; promoPosterUrl?: string; updatedAt?: number };
  onRefresh: () => void;
  onOpenConsent?: () => void;
  onOpenProfileSetup?: () => void;
}

type TabType = 'home' | 'packages' | 'coupons' | 'coin' | 'points' | 'history' | 'qr' | 'notifications';

export const CustomerApp: React.FC<CustomerAppProps> = ({
  client,
  coinBalance,
  coinTransactions,
  pointsWallet,
  pointsTransactions,
  packages,
  coupons,
  notifications,
  rewardCatalog,
  lang,
  brandSettings,
  onRefresh,
  onOpenConsent,
  onOpenProfileSetup,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Filter active/expiring_soon packages & coupons (used_up items are hidden from customer active view)
  const activePackages = packages.filter((p) => p.status !== 'used_up');
  const activeCoupons = coupons.filter((c) => c.status !== 'used_up');
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    // Generate QR Code for Member Code
    if (client.memberCode) {
      QRCode.toDataURL(client.memberCode, {
        width: 280,
        margin: 2,
        color: {
          dark: '#44281d', // warm brown
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [client.memberCode]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(client.memberCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF6F2] text-[#3D3835] pb-24 font-sans flex justify-center">
      {/* Mobile Shell Frame */}
      <div className="w-full max-w-md bg-[#FFFDFB] shadow-sm min-h-screen flex flex-col border-x border-[#F2E3E1]">
        
        {/* LIFF Header Banner */}
        <div className="bg-gradient-to-r from-[#E88D9F] via-[#DF7B8F] to-[#D87085] text-white p-4 pt-5 border-b border-[#E07A90] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={client.profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                alt={client.displayName}
                className="w-11 h-11 rounded-full object-cover border-2 border-white/80 shadow-2xs"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#4ADE80] border-2 border-[#D87085] rounded-full" title="LINE LIFF Connected" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-rose-100 font-bold uppercase tracking-wider">LINE Connected</span>
              </div>
              <h2 className="text-sm font-bold font-serif text-white tracking-tight flex items-center gap-1">
                {client.displayName}
                <Sparkles className="w-3.5 h-3.5 text-rose-100" />
              </h2>
              <p className="text-[11px] font-mono text-rose-100">
                {t.memberCodeLabel}: <span className="text-white font-bold">{client.memberCode}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('notifications')}
            className="relative p-2 bg-white/20 text-white hover:bg-white/30 rounded-full transition border border-white/30 shadow-2xs"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-[#D87085] text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Member Profile Quick Status Bar */}
        <div className="bg-[#FAF0ED] px-4 py-2 border-b border-[#F2E3E1] flex items-center justify-between text-xs text-[#3D3835]">
          <div className="flex items-center gap-3 overflow-hidden text-[11px]">
            <span className="font-semibold text-[#8C6D5E] shrink-0">ข้อมูลสมาชิก:</span>
            {client.phone ? (
              <span className="truncate font-mono text-[#4A4441]">
                📞 {client.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
                {client.birthday && <span className="ml-2 text-[#8C6D5E]">🎂 {client.birthday}</span>}
              </span>
            ) : (
              <span className="text-rose-600 font-semibold flex items-center gap-1 animate-pulse">
                ⚠️ ยังไม่ได้ระบุเบอร์โทรศัพท์ & วันเกิด
              </span>
            )}
          </div>

          <button
            onClick={onOpenProfileSetup}
            className="shrink-0 px-2.5 py-1 bg-white hover:bg-[#FFF8F7] text-[#D87085] font-bold rounded-lg border border-[#F2E3E1] hover:border-[#E88D9F] transition text-[11px] shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <User className="w-3 h-3" />
            <span>{client.phone && client.birthday ? 'แก้ไข' : 'กรอกข้อมูล'}</span>
          </button>
        </div>

        {/* Dynamic Tab Content */}
        <main className="flex-1 p-4 overflow-y-auto">

          {/* TAB 1: HOME */}
          {activeTab === 'home' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Prominent Coin Balance Hero Card */}
              <div className="bg-gradient-to-br from-[#E88D9F] via-[#DF7B8F] to-[#D87085] text-white rounded-2xl p-5 shadow-sm relative overflow-hidden border border-[#E07A90]">
                <div className="absolute top-0 right-0 p-8 opacity-15 pointer-events-none">
                  <Coins className="w-32 h-32 text-white" />
                </div>

                <div className="flex items-center justify-between text-xs text-rose-100 font-medium">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Coins className="w-4 h-4 text-white" />
                    {t.coinBalanceTitle}
                  </span>
                  <span className="bg-white/25 text-white text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold backdrop-blur-xs border border-white/30">
                    In-Store Credit Only
                  </span>
                </div>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-serif font-bold text-white tracking-tight">
                    {formatCurrency(coinBalance)}
                  </span>
                  <span className="text-rose-100 font-semibold text-sm">{t.currencyUnit}</span>
                </div>

                {/* Non-cash Disclaimer Banner */}
                <div className="mt-3.5 pt-3 border-t border-white/20 flex items-start gap-2 text-[11px] text-rose-50 leading-tight">
                  <Info className="w-3.5 h-3.5 shrink-0 text-white/90 mt-0.5" />
                  <p>{t.coinDisclaimer}</p>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => setActiveTab('packages')}
                  className="bg-white p-3 rounded-2xl border border-[#F2E3E1] shadow-2xs hover:border-[#E88D9F] transition text-left flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-[#D87085]">
                    <Package className="w-5 h-5" />
                    <ChevronRight className="w-4 h-4 text-[#F2E3E1]" />
                  </div>
                  <div className="mt-3">
                    <span className="text-xl font-serif font-bold text-[#3D3835]">{activePackages.length}</span>
                    <p className="text-[11px] text-[#6E6763] font-medium leading-tight">{t.quickStatsPackages}</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('coupons')}
                  className="bg-white p-3 rounded-2xl border border-[#F2E3E1] shadow-2xs hover:border-[#E88D9F] transition text-left flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-[#D87085]">
                    <Ticket className="w-5 h-5" />
                    <ChevronRight className="w-4 h-4 text-[#F2E3E1]" />
                  </div>
                  <div className="mt-3">
                    <span className="text-xl font-serif font-bold text-[#3D3835]">{activeCoupons.length}</span>
                    <p className="text-[11px] text-[#6E6763] font-medium leading-tight">{t.quickStatsCoupons}</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('points')}
                  className="bg-white p-3 rounded-2xl border border-[#F2E3E1] shadow-2xs hover:border-[#E88D9F] transition text-left flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-[#D87085]">
                    <Award className="w-5 h-5" />
                    <span className="text-[9px] bg-[#FAF0ED] text-[#D87085] uppercase font-bold px-1.5 py-0.2 rounded-full border border-[#F2E3E1]">
                      {pointsWallet.tier}
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-xl font-serif font-bold text-[#3D3835]">{pointsWallet.balance}</span>
                    <p className="text-[11px] text-[#6E6763] font-medium leading-tight">{t.quickStatsPoints}</p>
                  </div>
                </button>
              </div>

              {/* Quick Actions Bar */}
              <div className="bg-[#FAF0ED] border border-[#F2E3E1] rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#E88D9F] text-white rounded-full">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#3D3835]">{t.memberQrTitle}</h3>
                    <p className="text-[11px] text-[#6E6763]">{t.memberQrSubtitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('qr')}
                  className="px-4 py-2 bg-[#E88D9F] hover:bg-[#D87085] text-white text-xs font-semibold rounded-full shadow-2xs shrink-0 transition"
                >
                  Show QR
                </button>
              </div>

              {/* Recent Notifications Feed Snippet */}
              <div className="bg-white rounded-2xl p-4 border border-[#D1CEC7] shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#EBE7E0]">
                  <h3 className="text-xs font-bold text-[#2D2926] flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#8C6D5E]" />
                    {t.recentNotificationsTitle}
                  </h3>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className="text-[11px] text-[#8C6D5E] hover:underline font-semibold uppercase tracking-wider"
                  >
                    {lang === 'th' ? 'ดูทั้งหมด' : 'View All'}
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <p className="text-xs text-[#2D2926]/50 py-3 text-center">{t.noNotifications}</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.slice(0, 3).map((notif) => (
                      <div key={notif.id} className="p-2.5 bg-[#F9F8F6] rounded-xl border border-[#EBE7E0] text-xs">
                        <div className="flex items-center justify-between text-[#2D2926]/60 text-[10px] mb-1">
                          <span className="font-semibold text-[#2D2926]">{translateNotificationTitle(notif.title, lang)}</span>
                          <span>{formatShortDate(notif.createdAt, lang)}</span>
                        </div>
                        <p className="text-[#2D2926]/80 leading-snug">{translateNotificationMessage(notif.message, lang)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY PACKAGES */}
          {activeTab === 'packages' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h2 className="text-base font-bold text-stone-800">{t.myPackagesTitle}</h2>
                <p className="text-xs text-stone-500">{t.myPackagesSubtitle}</p>
              </div>

              {activePackages.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center space-y-2">
                  <Package className="w-10 h-10 text-stone-300 mx-auto" />
                  <p className="text-xs font-medium text-stone-500">{t.noActivePackages}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activePackages.map((pkg) => {
                    const percentUsed = Math.round(
                      ((pkg.totalSessions - pkg.remainingSessions) / pkg.totalSessions) * 100
                    );

                    return (
                      <div
                        key={pkg.id}
                        className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs space-y-3 p-4 relative"
                      >
                        {/* Status Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={pkg.imageUrl || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=200&q=80'}
                              alt={pkg.name}
                              className="w-14 h-14 rounded-xl object-cover border border-stone-200"
                            />
                            <div>
                              <h3 className="text-sm font-bold text-stone-800 leading-snug">{pkg.name}</h3>
                              <p className="text-[11px] text-stone-500 line-clamp-1">{pkg.description}</p>
                            </div>
                          </div>

                          {pkg.status === 'expiring_soon' ? (
                            <span className="shrink-0 text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              {t.statusExpiringSoon}
                            </span>
                          ) : (
                            <span className="shrink-0 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                              {t.statusActive}
                            </span>
                          )}
                        </div>

                        {/* Sessions Progress Bar */}
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-stone-700">
                              {t.sessionsRemaining
                                .replace('{remaining}', String(pkg.remainingSessions))
                                .replace('{total}', String(pkg.totalSessions))}
                            </span>
                            <span className="text-stone-400 text-[10px]">{percentUsed}% used</span>
                          </div>
                          <div className="w-full bg-[#FAF0ED] h-2.5 rounded-full overflow-hidden border border-[#F2E3E1]">
                            <div
                              className="bg-gradient-to-r from-[#E88D9F] to-[#D87085] h-full rounded-full transition-all duration-500"
                              style={{ width: `${100 - percentUsed}%` }}
                            />
                          </div>
                        </div>

                        {/* Validity Dates */}
                        <div className="flex justify-between items-center text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                          <span>{t.purchaseDate}: {formatShortDate(pkg.purchaseDate, lang)}</span>
                          <span className="font-medium text-stone-700">
                            {t.expiryDate}: {formatShortDate(pkg.expiryDate, lang)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY COUPONS */}
          {activeTab === 'coupons' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h2 className="text-base font-bold text-stone-800">{t.myCouponsTitle}</h2>
                <p className="text-xs text-stone-500">{t.myCouponsSubtitle}</p>
              </div>

              {activeCoupons.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center space-y-2">
                  <Ticket className="w-10 h-10 text-stone-300 mx-auto" />
                  <p className="text-xs font-medium text-stone-500">{t.noActiveCoupons}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeCoupons.map((cpn) => (
                    <div
                      key={cpn.id}
                      className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={cpn.imageUrl || 'https://images.unsplash.com/photo-1512290900673-3f149ff93ff2?auto=format&fit=crop&w=200&q=80'}
                            alt={cpn.name}
                            className="w-14 h-14 rounded-xl object-cover border border-stone-200"
                          />
                          <div>
                            <h3 className="text-sm font-bold text-stone-800 leading-snug">{cpn.name}</h3>
                            <p className="text-[11px] text-stone-500 line-clamp-1">{cpn.description}</p>
                          </div>
                        </div>

                        {cpn.status === 'expiring_soon' ? (
                          <span className="shrink-0 text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {t.statusExpiringSoon}
                          </span>
                        ) : (
                          <span className="shrink-0 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            {t.statusActive}
                          </span>
                        )}
                      </div>

                      {/* Coupon Code & Quantity */}
                      <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-amber-900/80 tracking-wider">
                            {t.couponCodeLabel}
                          </p>
                          <p className="font-mono text-sm font-extrabold text-amber-950 tracking-wider">
                            {cpn.couponCode}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-amber-900">
                            {t.couponQuantityRemaining
                              .replace('{remaining}', String(cpn.remainingQuantity))
                              .replace('{total}', String(cpn.totalQuantity))}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-stone-400 italic text-center leading-tight">
                        {t.couponNotice}
                      </p>

                      <div className="flex justify-between items-center text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                        <span>{t.purchaseDate}: {formatShortDate(cpn.purchaseDate, lang)}</span>
                        <span className="font-medium text-stone-700">
                          {t.expiryDate}: {formatShortDate(cpn.expiryDate, lang)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COIN WALLET */}
          {activeTab === 'coin' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#E88D9F] via-[#DF7B8F] to-[#D87085] text-white p-6 rounded-3xl shadow-sm border border-[#E07A90] space-y-3">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-rose-300/20 rounded-full blur-2xl pointer-events-none" />
                <div className="flex justify-between items-center text-xs text-rose-100 font-medium relative z-10">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Coins className="w-4 h-4 text-white" />
                    {t.coinWalletTitle}
                  </span>
                  <span className="bg-white/25 text-white text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold backdrop-blur-xs border border-white/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-white" />
                    Store Credit
                  </span>
                </div>
                <div className="mt-2 text-3xl font-serif font-bold text-white tracking-tight relative z-10">
                  {formatCurrency(coinBalance)} <span className="text-sm font-normal text-rose-100">{t.currencyUnit}</span>
                </div>
              </div>

              {/* Disclaimer Banner - Standout Pink Card */}
              <div className="p-4 bg-gradient-to-r from-[#FAF0ED] via-[#FFF8F6] to-[#FAF0ED] text-[#D87085] border-2 border-[#F2E3E1] rounded-2xl text-xs leading-relaxed flex items-start gap-3 shadow-2xs relative">
                <ShieldCheck className="w-5 h-5 text-[#E88D9F] shrink-0 mt-0.5" />
                <p className="font-medium text-[#3D3835] leading-relaxed">{t.coinNoticeBanner}</p>
              </div>

              {/* Promotion Poster Banner (Shown between Coin Balance/Notice and Transaction History) */}
              {brandSettings?.promoPosterUrl && brandSettings.promoPosterUrl.trim() !== '' && (
                <div className="rounded-2xl overflow-hidden border border-[#F2E3E1] shadow-xs bg-white">
                  <img
                    src={brandSettings.promoPosterUrl.startsWith('data:')
                      ? brandSettings.promoPosterUrl
                      : `${brandSettings.promoPosterUrl}${brandSettings.promoPosterUrl.includes('?') ? '&' : '?'}v=${brandSettings.updatedAt || 1}`}
                    alt="Promotion Poster"
                    className="w-full h-auto object-cover max-h-72"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Coin Transactions */}
              <div className="bg-white rounded-2xl p-4 border border-[#F2E3E1] shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-[#3D3835] border-b border-[#FAF0ED] pb-2 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#E88D9F]" />
                  {t.coinTransactionHistory}
                </h3>

                {coinTransactions.length === 0 ? (
                  <p className="text-xs text-[#9C948E] py-4 text-center">{lang === 'th' ? 'ยังไม่มีประวัติการทำรายการ' : 'No transactions recorded'}</p>
                ) : (
                  <div className="space-y-2.5">
                    {coinTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className={`p-3 rounded-xl border text-xs flex justify-between items-center ${
                          tx.reversed
                            ? 'bg-stone-50 border-stone-200 text-stone-400 line-through'
                            : tx.amount > 0
                            ? 'bg-[#FAF0ED]/60 border-[#F2E3E1]'
                            : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-[#3D3835]">{translateTxNote(tx.note, lang)}</div>
                          <div className="text-[10px] text-[#9C948E] mt-0.5">
                            {formatDate(tx.createdAt, lang)} • {lang === 'th' ? 'พนักงาน:' : 'Staff:'} {tx.createdByStaffName}
                          </div>
                          {tx.reversed && (
                            <span className="inline-block mt-1 text-[10px] bg-stone-200 text-stone-600 font-bold px-1.5 py-0.2 rounded">
                              {t.statusReversed} ({tx.reversalReason})
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span
                            className={`font-bold font-mono text-sm ${
                              tx.reversed
                                ? 'text-stone-400'
                                : tx.amount > 0
                                ? 'text-[#D87085]'
                                : 'text-[#3D3835]'
                            }`}
                          >
                            {tx.amount > 0 ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)} {t.currency}
                          </span>
                          <div className="text-[10px] text-[#9C948E]">Bal: ฿{formatCurrency(tx.resultingBalance)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: POINTS & REWARDS */}
          {activeTab === 'points' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#E88D9F] via-[#D87085] to-[#C95B72] text-white p-6 rounded-3xl shadow-sm border border-[#E07A90] space-y-4">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-xl pointer-events-none" />
                <div className="flex justify-between items-center text-xs text-rose-100 relative z-10">
                  <span className="font-bold flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-white" />
                    {t.pointsTitle}
                  </span>
                  <span className="bg-white/25 text-white px-3 py-0.5 rounded-full font-bold text-[10px] border border-white/30 backdrop-blur-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-white" />
                    {pointsWallet.tier} Tier
                  </span>
                </div>

                <div className="text-3xl font-serif font-bold tracking-tight text-white relative z-10">
                  {pointsWallet.balance} <span className="text-sm font-normal text-rose-100">{t.pointsUnit}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-white/20 text-rose-100 relative z-10">
                  <div>
                    <span className="text-white/80 block">{t.lifetimePointsEarned}</span>
                    <span className="font-bold text-white text-sm">{pointsWallet.lifetimeEarned} pts</span>
                  </div>
                  <div>
                    <span className="text-white/80 block">{t.lifetimePointsRedeemed}</span>
                    <span className="font-bold text-white text-sm">{pointsWallet.lifetimeRedeemed} pts</span>
                  </div>
                </div>
              </div>

              {/* Rewards Catalog */}
              <div className="space-y-2">
                <div>
                  <h3 className="text-xs font-bold text-stone-800">{t.rewardsCatalogTitle}</h3>
                  <p className="text-[11px] text-stone-500">{t.rewardsCatalogSubtitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {rewardCatalog.map((reward) => (
                    <div
                      key={reward.id}
                      className="bg-white rounded-2xl border border-stone-200 p-3 shadow-2xs space-y-2 flex flex-col justify-between"
                    >
                      <img
                        src={reward.imageUrl || 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=200&q=80'}
                        alt={reward.name}
                        className="w-full h-24 rounded-xl object-cover border border-stone-100"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-stone-800 leading-snug">{reward.name}</h4>
                        <p className="text-[10px] text-stone-500 line-clamp-2 mt-0.5">{reward.description}</p>
                      </div>

                      <div className="pt-2 border-t border-[#FAF0ED] flex items-center justify-between">
                        <span className="text-xs font-bold text-[#D87085]">
                          {reward.pointsCost} {t.pointsUnit}
                        </span>
                        <span className="text-[9px] bg-[#FAF0ED] text-[#D87085] px-2 py-0.5 rounded-full font-semibold border border-[#F2E3E1]">
                          In-store
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Points History */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-stone-800 border-b border-stone-100 pb-2">
                  {t.pointsTransactionHistory}
                </h3>
                {pointsTransactions.length === 0 ? (
                  <p className="text-xs text-stone-400 py-3 text-center">No points activity recorded</p>
                ) : (
                  <div className="space-y-2">
                    {pointsTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-2.5 bg-stone-50 rounded-xl border border-stone-100 text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold text-stone-800">{tx.note}</p>
                          <p className="text-[10px] text-stone-400">{formatDate(tx.createdAt, lang)}</p>
                        </div>
                        <span
                          className={`font-bold font-mono ${
                            tx.amount > 0 ? 'text-emerald-700' : 'text-stone-700'
                          }`}
                        >
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: HISTORY (COMBINED) */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h2 className="text-base font-bold text-stone-800">{t.navHistory}</h2>
                <p className="text-xs text-stone-500">{lang === 'th' ? 'ประวัติการทำรายการย้อนหลังทั้งหมดในบัญชีของคุณ' : 'Combined chronological log of all account activity'}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs space-y-3">
                {coinTransactions.length === 0 && pointsTransactions.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center">{lang === 'th' ? 'ยังไม่มีประวัติการทำรายการ' : 'No activity history yet'}</p>
                ) : (
                  <div className="space-y-3">
                    {[
                      ...coinTransactions.map((tx) => ({ ...tx, category: 'coin' as const })),
                      ...pointsTransactions.map((tx) => ({ ...tx, category: 'points' as const })),
                    ]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs space-y-1"
                        >
                          <div className="flex justify-between items-start">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                                item.category === 'coin'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              }`}
                            >
                              {item.category === 'coin' ? (lang === 'th' ? 'Coin Wallet' : 'Coin Wallet') : (lang === 'th' ? 'คะแนนสะสม' : 'Loyalty Points')}
                            </span>
                            <span className="text-[10px] text-stone-400">{formatDate(item.createdAt, lang)}</span>
                          </div>
                          <p className="font-semibold text-stone-800">{translateTxNote(item.note, lang)}</p>
                          <div className="flex justify-between items-center text-[11px] pt-1 text-stone-500 border-t border-stone-200/50">
                            <span>{lang === 'th' ? 'พนักงาน:' : 'Staff:'} {item.createdByStaffName}</span>
                            <span className="font-bold font-mono text-stone-800">
                              {item.amount > 0 ? `+${item.amount}` : item.amount}{' '}
                              {item.category === 'coin' ? t.currency : 'pts'}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: MEMBER QR */}
          {activeTab === 'qr' && (
            <div className="space-y-4 animate-in fade-in text-center">
              <div>
                <h2 className="text-base font-bold text-stone-800">{t.memberQrTitle}</h2>
                <p className="text-xs text-stone-500">{t.memberQrSubtitle}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md inline-block max-w-xs mx-auto w-full space-y-4">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt={client.memberCode} className="w-56 h-56 mx-auto rounded-2xl" />
                ) : (
                  <div className="w-56 h-56 mx-auto bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400">
                    Generating QR...
                  </div>
                )}

                <div>
                  <p className="text-xs text-stone-400 uppercase font-bold tracking-wider">{t.memberCodeLabel}</p>
                  <p className="text-2xl font-mono font-extrabold text-amber-900 tracking-wider">
                    {client.memberCode}
                  </p>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{t.memberCodeCopied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{t.copyMemberCode}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h2 className="text-base font-bold text-stone-800">{t.navNotifications}</h2>
                <p className="text-xs text-stone-500">{lang === 'th' ? 'ข่าวสารและการแจ้งเตือนการทำรายการจากสตูดิโอ' : 'In-app studio updates and automated transaction notices'}</p>
              </div>

              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-xs text-stone-400">
                    {t.noNotifications}
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 rounded-2xl border text-xs space-y-1 transition ${
                        n.read ? 'bg-white border-stone-200' : 'bg-amber-50/70 border-amber-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-stone-800">{translateNotificationTitle(n.title, lang)}</span>
                        <span className="text-[10px] text-stone-400">{formatDate(n.createdAt, lang)}</span>
                      </div>
                      <p className="text-stone-600 leading-relaxed">{translateNotificationMessage(n.message, lang)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Privacy Policy & Terms Footer Button */}
          {onOpenConsent && (
            <div className="pt-8 pb-4 text-center">
              <button
                onClick={onOpenConsent}
                className="inline-flex items-center gap-1.5 text-[11px] text-[#8C827A] hover:text-[#D87085] transition underline underline-offset-4"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#E88D9F]" />
                <span>
                  {lang === 'th'
                    ? 'นโยบายความเป็นส่วนตัว (PDPA) & ข้อกำหนดการใช้งาน'
                    : 'Privacy Policy (PDPA) & Terms of Use'}
                </span>
              </button>
            </div>
          )}

        </main>

        {/* Bottom Navigation Dock */}
        <nav className="fixed bottom-0 max-w-md w-full bg-white/90 backdrop-blur-md border-t border-[#D1CEC7] px-2 py-2 flex items-center justify-around z-30 shadow-xs">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-full transition ${
              activeTab === 'home' ? 'text-[#8C6D5E] font-bold' : 'text-[#2D2926]/50 hover:text-[#2D2926]'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider">{t.navHome}</span>
          </button>

          <button
            onClick={() => setActiveTab('packages')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-full transition ${
              activeTab === 'packages' ? 'text-[#8C6D5E] font-bold' : 'text-[#2D2926]/50 hover:text-[#2D2926]'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider">{t.navPackages}</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-full transition ${
              activeTab === 'coupons' ? 'text-[#8C6D5E] font-bold' : 'text-[#2D2926]/50 hover:text-[#2D2926]'
            }`}
          >
            <Ticket className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider">{t.navCoupons}</span>
          </button>

          <button
            onClick={() => setActiveTab('coin')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-full transition ${
              activeTab === 'coin' ? 'text-[#8C6D5E] font-bold' : 'text-[#2D2926]/50 hover:text-[#2D2926]'
            }`}
          >
            <Coins className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider">Coin</span>
          </button>

          <button
            onClick={() => setActiveTab('points')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-full transition ${
              activeTab === 'points' ? 'text-[#8C6D5E] font-bold' : 'text-[#2D2926]/50 hover:text-[#2D2926]'
            }`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider">Points</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-full transition ${
              activeTab === 'qr' ? 'text-[#8C6D5E] font-bold' : 'text-[#2D2926]/50 hover:text-[#2D2926]'
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span className="text-[9px] uppercase tracking-wider">QR</span>
          </button>
        </nav>

      </div>
    </div>
  );
};
