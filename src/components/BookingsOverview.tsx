import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CalendarCheck,
  CalendarDays,
  Clock,
  MapPin,
  User,
  Phone,
  ArrowLeft,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  CreditCard,
  Coins,
  Package,
  Ticket,
  Gift,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { AppLanguage, ClientOneTimeBooking, Employee } from '../types';
import { api } from '../services/api';
import { ExpiringAlertTasks } from './ExpiringAlertTasks';

type BookingWithClient = ClientOneTimeBooking & {
  clientName: string;
  clientPhone: string;
  clientProfilePic?: string;
};

type ActivePackageItem = {
  packageId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientProfilePic?: string;
  packageName: string;
  sessionsUsed: number;
  totalSessions: number;
  remainingSessions: number;
  expiryDate: string;
};

interface BookingsOverviewProps {
  lang: AppLanguage;
  currentStaff: Employee;
  onBack: () => void;
  onSelectClient: (clientId: string) => void;
}

export const BookingsOverview: React.FC<BookingsOverviewProps> = ({
  lang,
  currentStaff,
  onBack,
  onSelectClient,
}) => {
  // Real-time Clock
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  // Data states
  const [upcomingBookings, setUpcomingBookings] = useState<BookingWithClient[]>([]);
  const [activePackages, setActivePackages] = useState<ActivePackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // UI Accordion / Dropdown State
  const [expandedBox, setExpandedBox] = useState<'bookings' | 'packages' | null>('bookings');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExpiringTasks, setShowExpiringTasks] = useState(false);

  // Reschedule Modal States
  const [rescheduleTarget, setRescheduleTarget] = useState<BookingWithClient | null>(null);
  const [newDateTime, setNewDateTime] = useState('');
  const [newEndDateTime, setNewEndDateTime] = useState('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  // Calendar View States
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedCalendarDateStr, setSelectedCalendarDateStr] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [bookingsData, packagesData] = await Promise.all([
        api.getAllOneTimeBookings(),
        api.getAllActivePackagesOverview(),
      ]);
      setUpcomingBookings(bookingsData);
      setActivePackages(packagesData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || (lang === 'th' ? 'ไม่สามารถโหลดข้อมูลได้' : 'Failed to load data'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Digital clock time string (HH:mm:ss)
  const timeOnlyString = useMemo(() => {
    return currentDateTime.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }, [currentDateTime]);

  // Digital clock date string
  const dateOnlyString = useMemo(() => {
    if (lang === 'th') {
      const weekdays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
      const months = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
      ];
      const dayName = weekdays[currentDateTime.getDay()];
      const day = currentDateTime.getDate();
      const monthName = months[currentDateTime.getMonth()];
      const thaiYear = currentDateTime.getFullYear() + 543;
      return `${dayName}ที่ ${day} ${monthName} ${thaiYear}`;
    } else {
      return currentDateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  }, [currentDateTime, lang]);

  const formatDateTime = (isoString: string, endIsoString?: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;

      const dateStr = d.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      const startTimeStr = d.toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      if (endIsoString) {
        const endD = new Date(endIsoString);
        if (!isNaN(endD.getTime())) {
          const endTimeStr = endD.toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          return `${dateStr} • ${startTimeStr} - ${endTimeStr} น.`;
        }
      }

      return `${dateStr} • ${startTimeStr} น.`;
    } catch {
      return isoString;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return upcomingBookings;
    const q = searchQuery.toLowerCase();
    return upcomingBookings.filter(
      (b) =>
        b.clientName.toLowerCase().includes(q) ||
        b.clientPhone.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.branch.toLowerCase().includes(q)
    );
  }, [upcomingBookings, searchQuery]);

  const filteredPackages = useMemo(() => {
    if (!searchQuery.trim()) return activePackages;
    const q = searchQuery.toLowerCase();
    return activePackages.filter(
      (p) =>
        p.clientName.toLowerCase().includes(q) ||
        p.clientPhone.toLowerCase().includes(q) ||
        p.packageName.toLowerCase().includes(q)
    );
  }, [activePackages, searchQuery]);

  const renderPaymentBadge = (booking: BookingWithClient) => {
    switch (booking.paymentStatusAtBooking) {
      case 'paid_full':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {lang === 'th' ? 'ชำระเต็มจำนวนแล้ว' : 'Paid in Full'}
          </span>
        );
      case 'deposit': {
        const depositPaid = booking.depositAmount + (booking.coinAmountUsed || 0);
        const remaining =
          booking.status === 'used'
            ? booking.remainingAmountPaid || 0
            : booking.fullPrice - depositPaid;

        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            {lang === 'th'
              ? `มัดจำแล้ว ฿${depositPaid.toLocaleString()} (คงเหลือ ฿${Math.max(0, remaining).toLocaleString()})`
              : `Deposit ฿${depositPaid.toLocaleString()} (Remaining ฿${Math.max(0, remaining).toLocaleString()})`}
          </span>
        );
      }
      case 'free':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Gift className="w-3.5 h-3.5 text-blue-600" />
            {lang === 'th' ? 'กิจกรรมฟรี (Free)' : 'Free Activity'}
          </span>
        );
      case 'deduct_package':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Package className="w-3.5 h-3.5 text-purple-600" />
            {lang === 'th' ? 'ตัดจาก Package' : 'Deduct from Package'}
          </span>
        );
      case 'deduct_coupon':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Ticket className="w-3.5 h-3.5 text-indigo-600" />
            {lang === 'th' ? 'ใช้ Coupon' : 'Use Coupon'}
          </span>
        );
      case 'coin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Coins className="w-3.5 h-3.5 text-rose-600" />
            {lang === 'th'
              ? `ใช้ Coin ชำระทั้งหมด (฿${(booking.coinAmountUsed || booking.fullPrice).toLocaleString()})`
              : `Pay with Coin (฿${(booking.coinAmountUsed || booking.fullPrice).toLocaleString()})`}
          </span>
        );
      default:
        return null;
    }
  };

  // Calendar Helpers
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sun

  const monthName = useMemo(() => {
    return calendarDate.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [calendarDate, lang]);

  // Map bookings per date 'YYYY-MM-DD'
  const bookingsByDate = useMemo(() => {
    const map: Record<string, BookingWithClient[]> = {};
    for (const b of upcomingBookings) {
      const dStr = b.bookingDateTime.slice(0, 10);
      if (!map[dStr]) map[dStr] = [];
      map[dStr].push(b);
    }
    return map;
  }, [upcomingBookings]);

  const selectedDateBookings = useMemo(() => {
    return bookingsByDate[selectedCalendarDateStr] || [];
  }, [bookingsByDate, selectedCalendarDateStr]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Digital Clock Banner */}
      <div className="bg-gradient-to-br from-[#FAF0ED] to-white px-6 py-5 rounded-2xl border border-[#F2E3E1] shadow-2xs text-center">
        <p className="text-4xl sm:text-5xl font-extrabold text-[#3D3835] tracking-wide tabular-nums">
          {timeOnlyString}
        </p>
        <p className="text-xs sm:text-sm font-semibold text-[#8C6D5E] mt-1">
          {dateOnlyString}
        </p>
        <p className="text-[11px] text-[#9C948E] mt-0.5">Me.My.Mind Mindfulness Studio</p>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#F2E3E1]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-white text-[#3D3835] hover:text-[#D87085] rounded-full border border-[#F2E3E1] shadow-2xs hover:bg-[#FAF0ED] transition cursor-pointer"
            title={lang === 'th' ? 'ย้อนกลับ' : 'Back'}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#3D3835] flex items-center gap-2">
              <CalendarCheck className="w-6 h-6 text-[#D87085]" />
              <span>{lang === 'th' ? 'ภาพรวมการจอง & บริการ' : 'Bookings & Services Dashboard'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6763]">
              {lang === 'th'
                ? 'ติดตามรายการนัดหมายที่กำลังจะถึง และแพ็กเกจคงเหลือของลูกค้าทั้งหมด'
                : 'Track upcoming appointments and active client packages'}
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF0ED] text-[#3D3835] hover:text-[#D87085] rounded-full border border-[#F2E3E1] text-xs font-semibold shadow-2xs transition disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#D87085] ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{lang === 'th' ? 'รีเฟรช' : 'Refresh'}</span>
        </button>
      </div>

      {/* 3 Summary Dashboard Cards — Always in 1 Row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Card 1: Upcoming Booking */}
        <button
          onClick={() => setExpandedBox(expandedBox === 'bookings' ? null : 'bookings')}
          className={`p-3 sm:p-5 rounded-2xl border text-left transition relative cursor-pointer shadow-2xs ${
            expandedBox === 'bookings'
              ? 'bg-[#E88D9F] border-[#D87085] text-white ring-2 ring-[#E88D9F]/40 shadow-sm'
              : 'bg-white border-[#F2E3E1] text-[#3D3835] hover:bg-[#FAF0ED]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <Calendar className={`w-5 h-5 sm:w-6 sm:h-6 ${expandedBox === 'bookings' ? 'text-white' : 'text-[#D87085]'}`} />
            {expandedBox === 'bookings' ? (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-white opacity-80" />
            ) : (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#9C948E]" />
            )}
          </div>
          <p className="text-xl sm:text-3xl font-extrabold tracking-tight">
            {isLoading ? '-' : upcomingBookings.length}
          </p>
          <p className={`text-[11px] sm:text-xs font-semibold mt-0.5 sm:mt-1 truncate ${expandedBox === 'bookings' ? 'text-white/95' : 'text-[#6E6763]'}`}>
            {lang === 'th' ? 'การจองที่กำลังจะถึง' : 'Upcoming Bookings'}
          </p>
          <div className={`text-[9px] sm:text-[10px] mt-0.5 truncate hidden xs:block ${expandedBox === 'bookings' ? 'text-white/80' : 'text-[#9C948E]'}`}>
            {lang === 'th' ? 'กดเพื่อดูรายละเอียด' : 'Click to view'}
          </div>
        </button>

        {/* Card 2: Active Packages */}
        <button
          onClick={() => setExpandedBox(expandedBox === 'packages' ? null : 'packages')}
          className={`p-3 sm:p-5 rounded-2xl border text-left transition relative cursor-pointer shadow-2xs ${
            expandedBox === 'packages'
              ? 'bg-[#E88D9F] border-[#D87085] text-white ring-2 ring-[#E88D9F]/40 shadow-sm'
              : 'bg-white border-[#F2E3E1] text-[#3D3835] hover:bg-[#FAF0ED]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <Package className={`w-5 h-5 sm:w-6 sm:h-6 ${expandedBox === 'packages' ? 'text-white' : 'text-[#D87085]'}`} />
            {expandedBox === 'packages' ? (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-white opacity-80" />
            ) : (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#9C948E]" />
            )}
          </div>
          <p className="text-xl sm:text-3xl font-extrabold tracking-tight">
            {isLoading ? '-' : activePackages.length}
          </p>
          <p className={`text-[11px] sm:text-xs font-semibold mt-0.5 sm:mt-1 truncate ${expandedBox === 'packages' ? 'text-white/95' : 'text-[#6E6763]'}`}>
            {lang === 'th' ? 'แพ็กเกจคงเหลือ' : 'Active Packages'}
          </p>
          <div className={`text-[9px] sm:text-[10px] mt-0.5 truncate hidden xs:block ${expandedBox === 'packages' ? 'text-white/80' : 'text-[#9C948E]'}`}>
            {lang === 'th' ? 'กดเพื่อดูรายการลูกค้า' : 'Click to view'}
          </div>
        </button>

        {/* Card 3: Calendar */}
        <button
          onClick={() => setShowCalendar(true)}
          className="p-3 sm:p-5 rounded-2xl border border-[#F2E3E1] bg-white text-[#3D3835] text-left transition hover:bg-[#FAF0ED] cursor-pointer shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-[#D87085]" />
            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-[#FAF0ED] text-[#D87085] border border-[#F2E3E1]">
              {lang === 'th' ? 'เปิด' : 'Open'}
            </span>
          </div>
          <div>
            <p className="text-xs sm:text-lg font-bold text-[#3D3835] truncate">
              {lang === 'th' ? 'ปฏิทินการจอง' : 'Calendar'}
            </p>
            <p className="text-[10px] sm:text-xs text-[#6E6763] mt-0.5 truncate hidden xs:block">
              {lang === 'th' ? 'ดูตารางรายเดือน' : 'Monthly view'}
            </p>
          </div>
          <div className="text-[9px] sm:text-[10px] text-[#9C948E] mt-1 sm:mt-2 truncate hidden xs:block">
            {lang === 'th' ? 'คลิกเปิดปฏิทิน' : 'Click to view'}
          </div>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition cursor-pointer"
          >
            {lang === 'th' ? 'ลองใหม่' : 'Retry'}
          </button>
        </div>
      )}

      {/* Expiring Alert Tasks Section Toggle & Component */}
      <div className="space-y-3">
        {showExpiringTasks && (
          <div className="animate-in fade-in">
            <ExpiringAlertTasks
              currentStaff={currentStaff}
              onSelectClient={onSelectClient}
              onRefreshData={handleRefresh}
            />
          </div>
        )}
      </div>

      {/* Expanded Detail Dropdown Section */}
      {expandedBox && (
        <div className="space-y-4 pt-2">
          {/* Search Bar & Expiring Cases Toggle for the active expanded box */}
          <div className="bg-white p-4 rounded-2xl border border-[#F2E3E1] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#9C948E]" />
              <input
                type="text"
                placeholder={
                  expandedBox === 'bookings'
                    ? lang === 'th'
                      ? 'ค้นหาการจองตามชื่อลูกค้า, เบอร์โทร, บริการ หรือสาขา...'
                      : 'Search bookings by client name, phone, service, branch...'
                    : lang === 'th'
                    ? 'ค้นหาแพ็กเกจตามชื่อลูกค้า, เบอร์โทร หรือชื่อแพ็กเกจ...'
                    : 'Search packages by client name, phone, or package name...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-[#F2E3E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E88D9F] bg-white placeholder-[#9C948E]"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowExpiringTasks(!showExpiringTasks)}
                className={`px-3 py-2 border text-xs font-bold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  showExpiringTasks
                    ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
                    : 'bg-white border-[#F2E3E1] text-[#8C6D5E] hover:bg-[#FAF0ED]'
                }`}
              >
                <AlertTriangle className={`w-3.5 h-3.5 ${showExpiringTasks ? 'text-white' : 'text-amber-500'}`} />
                <span>{lang === 'th' ? 'งานติดตามหมดอายุ' : 'Expiring Cases'}</span>
              </button>

              <div className="text-xs font-semibold text-[#6E6763] bg-[#FAF0ED] px-3.5 py-2 rounded-xl border border-[#F2E3E1]">
                {expandedBox === 'bookings'
                  ? lang === 'th'
                    ? `พบการจอง ${filteredBookings.length} รายการ`
                    : `Found ${filteredBookings.length} bookings`
                  : lang === 'th'
                  ? `พบแพ็กเกจ ${filteredPackages.length} รายการ`
                  : `Found ${filteredPackages.length} packages`}
              </div>
            </div>
          </div>

          {/* Content Loading */}
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-[#F2E3E1]">
              <Loader2 className="w-8 h-8 animate-spin text-[#E88D9F] mb-3" />
              <p className="text-xs sm:text-sm font-medium text-[#6E6763]">
                {lang === 'th' ? 'กำลังโหลดข้อมูล...' : 'Loading data...'}
              </p>
            </div>
          ) : expandedBox === 'bookings' ? (
            /* Upcoming Bookings List */
            filteredBookings.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-[#F2E3E1] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FAF0ED] flex items-center justify-center border border-[#F2E3E1]">
                  <Calendar className="w-6 h-6 text-[#D87085]" />
                </div>
                <h3 className="text-base font-bold text-[#3D3835]">
                  {lang === 'th' ? 'ไม่มีรายการการจองที่กำลังจะถึง' : 'No upcoming bookings'}
                </h3>
                <p className="text-xs text-[#6E6763] max-w-sm">
                  {searchQuery
                    ? lang === 'th'
                      ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา ลองเปลี่ยนคำค้นหา'
                      : 'No appointments match your search query.'
                    : lang === 'th'
                    ? 'ขณะนี้ยังไม่มีรายการนัดหมายที่รอเข้ารับบริการ'
                    : 'There are currently no upcoming appointments waiting for service.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((booking) => {
                  return (
                    <div
                      key={booking.id}
                      onClick={() => onSelectClient(booking.clientId)}
                      className="bg-white p-4 sm:p-5 rounded-2xl border border-[#F2E3E1] transition shadow-2xs hover:shadow-xs hover:border-[#E88D9F]/60 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                    >
                      {/* Left: Avatar + Client Info + Service & Time */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Avatar */}
                        {booking.clientProfilePic ? (
                          <img
                            src={booking.clientProfilePic}
                            alt={booking.clientName}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-full object-cover border border-[#F2E3E1] shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-[#FAF0ED] text-[#D87085] flex items-center justify-center font-bold text-sm border border-[#F2E3E1] shrink-0">
                            {booking.clientName ? booking.clientName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                          </div>
                        )}

                        <div className="space-y-1.5 flex-1 min-w-0">
                          {/* Client Name + Phone */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm sm:text-base font-bold text-[#3D3835] group-hover:text-[#D87085] transition truncate">
                              {booking.clientName}
                            </span>

                            {booking.clientPhone && booking.clientPhone !== '-' && (
                              <a
                                href={`tel:${booking.clientPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF0ED] text-[#D87085] hover:bg-[#F2E3E1] transition border border-[#F2E3E1]"
                                title={lang === 'th' ? 'โทรออก' : 'Call'}
                              >
                                <Phone className="w-3 h-3 text-[#D87085]" />
                                <span>{booking.clientPhone}</span>
                              </a>
                            )}

                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-700" />
                              {lang === 'th' ? 'ยืนยันการจอง' : 'Booked'}
                            </span>
                          </div>

                          {/* Service Name */}
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#3D3835]">
                            <Sparkles className="w-4 h-4 text-[#E88D9F] shrink-0" />
                            <span>{booking.name}</span>
                            {booking.fullPrice > 0 && (
                              <span className="text-xs text-[#6E6763] font-normal">
                                (฿{booking.fullPrice.toLocaleString()})
                              </span>
                            )}
                          </div>

                          {/* DateTime & Branch */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6E6763]">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#D87085] shrink-0" />
                              <span className="font-medium text-[#3D3835]">
                                {formatDateTime(booking.bookingDateTime, booking.endDateTime)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#D87085] shrink-0" />
                              <span>{booking.branch || 'Me.My.Mind Spa'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Payment Status Badge & Action Buttons */}
                      <div className="flex flex-col sm:items-end justify-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#F2E3E1]/60 gap-2">
                        <div className="flex flex-col sm:items-end">
                          <div className="text-[10px] text-[#9C948E] font-medium mb-1 md:text-right">
                            {lang === 'th' ? 'สถานะการชำระเงิน' : 'Payment Status'}
                          </div>
                          <div>{renderPaymentBadge(booking)}</div>
                        </div>

                        {/* Reschedule Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRescheduleTarget(booking);
                            setNewDateTime(booking.bookingDateTime ? booking.bookingDateTime.slice(0, 16) : '');
                            setNewEndDateTime(booking.endDateTime ? booking.endDateTime.slice(0, 16) : '');
                          }}
                          className="px-3 py-1.5 bg-white border border-[#F2E3E1] text-[#8C6D5E] hover:bg-[#FAF0ED] hover:text-[#D87085] text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Calendar className="w-3.5 h-3.5 text-[#D87085]" />
                          <span>{lang === 'th' ? 'เลื่อนนัด' : 'Reschedule'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Active Packages List */
            filteredPackages.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-[#F2E3E1] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FAF0ED] flex items-center justify-center border border-[#F2E3E1]">
                  <Package className="w-6 h-6 text-[#D87085]" />
                </div>
                <h3 className="text-base font-bold text-[#3D3835]">
                  {lang === 'th' ? 'ไม่พบแพ็กเกจคงเหลือ' : 'No active packages found'}
                </h3>
                <p className="text-xs text-[#6E6763] max-w-sm">
                  {searchQuery
                    ? lang === 'th'
                      ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา ลองเปลี่ยนคำค้นหา'
                      : 'No packages match your search query.'
                    : lang === 'th'
                    ? 'ขณะนี้ยังไม่มีแพ็กเกจที่เปิดใช้งานอยู่ในระบบ'
                    : 'There are currently no active packages in the system.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredPackages.map((pkg) => {
                  return (
                    <div
                      key={pkg.packageId}
                      onClick={() => onSelectClient(pkg.clientId)}
                      className="bg-white p-4 rounded-2xl border border-[#F2E3E1] transition shadow-2xs hover:shadow-xs hover:border-[#E88D9F]/60 flex flex-col justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        {pkg.clientProfilePic ? (
                          <img
                            src={pkg.clientProfilePic}
                            alt={pkg.clientName}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover border border-[#F2E3E1] shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#FAF0ED] text-[#D87085] flex items-center justify-center font-bold text-xs border border-[#F2E3E1] shrink-0">
                            {pkg.clientName ? pkg.clientName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-[#3D3835] group-hover:text-[#D87085] transition truncate">
                              {pkg.clientName}
                            </span>
                            {pkg.clientPhone && pkg.clientPhone !== '-' && (
                              <a
                                href={`tel:${pkg.clientPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] text-[#D87085] font-semibold bg-[#FAF0ED] px-2 py-0.5 rounded-full border border-[#F2E3E1] hover:bg-[#F2E3E1]"
                              >
                                {pkg.clientPhone}
                              </a>
                            )}
                          </div>

                          <div className="text-xs font-bold text-[#3D3835] mt-1 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-[#E88D9F] shrink-0" />
                            <span className="truncate">{pkg.packageName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Sessions Progress Bar & Expiry */}
                      <div className="bg-[#FAF0ED]/60 p-3 rounded-xl border border-[#F2E3E1] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#6E6763]">
                            {lang === 'th' ? 'จำนวนครั้งที่ใช้' : 'Sessions Used'}:
                          </span>
                          <span className="font-bold text-[#3D3835]">
                            {pkg.sessionsUsed} / {pkg.totalSessions} ครั้ง
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#F2E3E1] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#E88D9F] h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (pkg.sessionsUsed / pkg.totalSessions) * 100)}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#D87085]">
                            {lang === 'th' ? `เหลือ ${pkg.remainingSessions} ครั้ง` : `${pkg.remainingSessions} remaining`}
                          </span>
                          <span className="text-[#9C948E]">
                            {lang === 'th' ? 'หมดอายุ: ' : 'Expires: '}{formatDate(pkg.expiryDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* Calendar Full Modal (Card 3) */}
      {showCalendar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl p-5 sm:p-7 shadow-2xl border border-[#F2E3E1] space-y-5 my-auto max-h-[90vh] flex flex-col">
            {/* Calendar Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F2E3E1] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF0ED] flex items-center justify-center border border-[#F2E3E1]">
                  <CalendarDays className="w-5 h-5 text-[#D87085]" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-[#3D3835]">
                    {lang === 'th' ? 'ปฏิทินการจองบริการ' : 'Bookings Calendar'}
                  </h2>
                  <p className="text-xs text-[#6E6763]">
                    {lang === 'th'
                      ? 'คลิกวันที่ในปฏิทินเพื่อดูรายการนัดหมายของวันนั้น'
                      : 'Click a date to view appointments for that day'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCalendar(false)}
                className="p-2 bg-[#FAF0ED] hover:bg-[#F2E3E1] text-[#3D3835] rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Month Nav Controls */}
            <div className="flex items-center justify-between bg-[#FAF0ED] px-4 py-2.5 rounded-2xl border border-[#F2E3E1] shrink-0">
              <button
                onClick={() => setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1))}
                className="p-1.5 hover:bg-white rounded-xl text-[#3D3835] transition cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-sm sm:text-base font-bold text-[#3D3835] flex items-center gap-2">
                <span>{monthName}</span>
                <button
                  onClick={() => {
                    const today = new Date();
                    setCalendarDate(today);
                    setSelectedCalendarDateStr(today.toISOString().slice(0, 10));
                  }}
                  className="text-[11px] font-semibold text-[#D87085] bg-white px-2.5 py-0.5 rounded-full border border-[#F2E3E1] hover:bg-[#FAF0ED]"
                >
                  {lang === 'th' ? 'วันนี้' : 'Today'}
                </button>
              </div>

              <button
                onClick={() => setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1))}
                className="p-1.5 hover:bg-white rounded-xl text-[#3D3835] transition cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Calendar Body */}
            <div className="overflow-y-auto space-y-5 pr-1 flex-1">
              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-[#8C6D5E]">
                {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, idx) => (
                  <div key={idx} className="py-1">
                    {lang === 'th' ? day : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]}
                  </div>
                ))}
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Empty padding slots before 1st day */}
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-14 sm:h-18 rounded-xl bg-[#FAF0ED]/30 border border-dashed border-[#F2E3E1]/40" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateObj = new Date(calendarYear, calendarMonth, dayNum);
                  const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayBookings = bookingsByDate[dateStr] || [];
                  const isSelected = selectedCalendarDateStr === dateStr;
                  const isToday = new Date().toISOString().slice(0, 10) === dateStr;

                  return (
                    <button
                      key={`day-${dayNum}`}
                      onClick={() => setSelectedCalendarDateStr(dateStr)}
                      className={`h-14 sm:h-18 rounded-xl p-1.5 sm:p-2 border text-left flex flex-col justify-between transition relative cursor-pointer ${
                        isSelected
                          ? 'bg-[#FAF0ED] border-[#E88D9F] ring-2 ring-[#E88D9F]/50 shadow-xs'
                          : isToday
                          ? 'bg-rose-50/40 border-[#F2C2CE]'
                          : 'bg-white border-[#F2E3E1] hover:bg-[#FAF0ED]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs font-bold ${
                            isToday
                              ? 'w-5 h-5 rounded-full bg-[#E88D9F] text-white flex items-center justify-center'
                              : 'text-[#3D3835]'
                          }`}
                        >
                          {dayNum}
                        </span>
                        {dayBookings.length > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#D87085] text-white">
                            {dayBookings.length}
                          </span>
                        )}
                      </div>

                      {dayBookings.length > 0 ? (
                        <div className="text-[10px] text-[#D87085] font-semibold truncate hidden sm:block">
                          {dayBookings[0].name}
                        </div>
                      ) : (
                        <div className="h-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Day Bookings Detail */}
              <div className="bg-[#FAF0ED] p-4 rounded-2xl border border-[#F2E3E1] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold text-[#3D3835] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#D87085]" />
                    <span>
                      {lang === 'th' ? 'รายการนัดหมายวันที่' : 'Bookings for'}{' '}
                      {formatDate(selectedCalendarDateStr)} ({selectedDateBookings.length} รายการ)
                    </span>
                  </h3>
                </div>

                {selectedDateBookings.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#9C948E]">
                    {lang === 'th' ? 'ไม่มีรายการนัดหมายในวันที่เลือก' : 'No appointments on this selected date'}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedDateBookings.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setShowCalendar(false);
                          onSelectClient(b.clientId);
                        }}
                        className="bg-white p-3.5 rounded-xl border border-[#F2E3E1] hover:border-[#E88D9F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer shadow-2xs group"
                      >
                        <div className="flex items-center gap-3">
                          {b.clientProfilePic ? (
                            <img
                              src={b.clientProfilePic}
                              alt={b.clientName}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-cover border border-[#F2E3E1]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#FAF0ED] text-[#D87085] flex items-center justify-center font-bold text-xs border border-[#F2E3E1]">
                              {b.clientName ? b.clientName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                            </div>
                          )}

                          <div>
                            <div className="text-xs sm:text-sm font-bold text-[#3D3835] group-hover:text-[#D87085] transition">
                              {b.clientName} ({b.clientPhone})
                            </div>
                            <div className="text-xs text-[#6E6763] font-medium flex items-center gap-1.5 mt-0.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#E88D9F]" />
                              <span>{b.name}</span>
                              <span>•</span>
                              <Clock className="w-3 h-3 text-[#D87085]" />
                              <span>{formatDateTime(b.bookingDateTime, b.endDateTime)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {renderPaymentBadge(b)}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRescheduleTarget(b);
                              setNewDateTime(b.bookingDateTime ? b.bookingDateTime.slice(0, 16) : '');
                              setNewEndDateTime(b.endDateTime ? b.endDateTime.slice(0, 16) : '');
                            }}
                            className="px-2.5 py-1 bg-white border border-[#F2E3E1] text-[#8C6D5E] hover:bg-[#FAF0ED] hover:text-[#D87085] text-xs font-bold rounded-lg transition"
                          >
                            {lang === 'th' ? 'เลื่อนนัด' : 'Reschedule'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl border border-[#F2E3E1] space-y-4">
            <h3 className="text-base font-serif font-bold text-[#3D3835]">
              {lang === 'th' ? 'เลื่อนนัดหมาย' : 'Reschedule Booking'}
            </h3>
            <p className="text-xs text-[#6E6763]">{rescheduleTarget.name} — {rescheduleTarget.clientName}</p>

            <div>
              <label className="block text-xs font-bold text-[#3D3835] mb-1">
                {lang === 'th' ? 'วัน-เวลานัดหมายใหม่' : 'New Date & Time'} *
              </label>
              <input
                type="datetime-local"
                value={newDateTime}
                onChange={(e) => setNewDateTime(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#F2E3E1] rounded-xl text-xs font-bold focus:outline-none focus:border-[#E88D9F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3D3835] mb-1">
                {lang === 'th' ? 'วัน-เวลาสิ้นสุดใหม่ (ถ้ามี)' : 'New End Time (optional)'}
              </label>
              <input
                type="datetime-local"
                value={newEndDateTime}
                onChange={(e) => setNewEndDateTime(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#F2E3E1] rounded-xl text-xs font-bold focus:outline-none focus:border-[#E88D9F]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                disabled={isSubmittingReschedule}
                onClick={() => setRescheduleTarget(null)}
                className="flex-1 py-2.5 bg-[#FAF0ED] text-[#6E6763] font-bold text-xs rounded-xl hover:bg-[#F2E3E1] transition cursor-pointer"
              >
                {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                disabled={isSubmittingReschedule || !newDateTime}
                onClick={async () => {
                  if (!newDateTime) return;
                  try {
                    setIsSubmittingReschedule(true);
                    await api.rescheduleOneTimeBooking(
                      rescheduleTarget.id,
                      new Date(newDateTime).toISOString(),
                      newEndDateTime ? new Date(newEndDateTime).toISOString() : undefined
                    );
                    setRescheduleTarget(null);
                    loadData();
                  } catch (err: any) {
                    alert(err.message || 'เกิดข้อผิดพลาดในการเลื่อนนัด');
                  } finally {
                    setIsSubmittingReschedule(false);
                  }
                }}
                className="flex-1 py-2.5 bg-[#E88D9F] text-white font-bold text-xs rounded-xl hover:bg-[#D87085] transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isSubmittingReschedule ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{lang === 'th' ? 'ยืนยันเลื่อนนัด' : 'Confirm'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
