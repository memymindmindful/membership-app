import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CalendarCheck,
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
} from 'lucide-react';
import { AppLanguage, ClientOneTimeBooking } from '../types';
import { api } from '../services/api';

type BookingWithClient = ClientOneTimeBooking & {
  clientName: string;
  clientPhone: string;
};

interface BookingsOverviewProps {
  lang: AppLanguage;
  onBack: () => void;
}

export const BookingsOverview: React.FC<BookingsOverviewProps> = ({ lang, onBack }) => {
  const [range, setRange] = useState<'today' | 'week' | 'month'>('today');
  const [bookings, setBookings] = useState<BookingWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBookings = async (selectedRange: 'today' | 'week' | 'month') => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getAllOneTimeBookings(selectedRange);
      setBookings(data);
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
      setError(err.message || (lang === 'th' ? 'ไม่สามารถโหลดข้อมูลการจองได้' : 'Failed to load bookings'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings(range);
  }, [range]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadBookings(range);
  };

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

  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.clientName.toLowerCase().includes(q) ||
      b.clientPhone.toLowerCase().includes(q) ||
      b.name.toLowerCase().includes(q) ||
      b.branch.toLowerCase().includes(q)
    );
  });

  const renderPaymentBadge = (booking: BookingWithClient) => {
    switch (booking.paymentStatusAtBooking) {
      case 'paid_full':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            {lang === 'th'
              ? `มัดจำแล้ว ฿${depositPaid.toLocaleString()} (คงเหลือ ฿${Math.max(0, remaining).toLocaleString()})`
              : `Deposit ฿${depositPaid.toLocaleString()} (Remaining ฿${Math.max(0, remaining).toLocaleString()})`}
          </span>
        );
      }
      case 'free':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Gift className="w-3.5 h-3.5 text-blue-600" />
            {lang === 'th' ? 'กิจกรรมฟรี (Free)' : 'Free Activity'}
          </span>
        );
      case 'deduct_package':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Package className="w-3.5 h-3.5 text-purple-600" />
            {lang === 'th' ? 'ตัดจาก Package' : 'Deduct from Package'}
          </span>
        );
      case 'deduct_coupon':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Ticket className="w-3.5 h-3.5 text-indigo-600" />
            {lang === 'th' ? 'ใช้ Coupon' : 'Use Coupon'}
          </span>
        );
      case 'coin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
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

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#F2E3E1]">
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
              <span>{lang === 'th' ? 'ภาพรวมการจอง (Bookings Overview)' : 'Bookings Overview'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6763]">
              {lang === 'th'
                ? 'ตรวจสอบรายการนัดหมายและสถานะการชำระเงินของลูกค้าทั้งหมดในที่เดียว'
                : 'Overview of all customer appointments, schedules, and payment statuses'}
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

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#F2E3E1] shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Time Range Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-[#FAF0ED] p-1 rounded-full border border-[#F2E3E1]">
            <button
              onClick={() => setRange('today')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                range === 'today'
                  ? 'bg-[#E88D9F] text-white shadow-xs'
                  : 'text-[#6E6763] hover:text-[#3D3835]'
              }`}
            >
              {lang === 'th' ? 'วันนี้' : 'Today'}
            </button>
            <button
              onClick={() => setRange('week')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                range === 'week'
                  ? 'bg-[#E88D9F] text-white shadow-xs'
                  : 'text-[#6E6763] hover:text-[#3D3835]'
              }`}
            >
              {lang === 'th' ? 'สัปดาห์นี้' : 'This Week'}
            </button>
            <button
              onClick={() => setRange('month')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                range === 'month'
                  ? 'bg-[#E88D9F] text-white shadow-xs'
                  : 'text-[#6E6763] hover:text-[#3D3835]'
              }`}
            >
              {lang === 'th' ? 'เดือนนี้' : 'This Month'}
            </button>
          </div>

          {/* Count Badge */}
          <div className="text-xs font-semibold text-[#6E6763] bg-[#FAF0ED] px-3 py-1.5 rounded-full border border-[#F2E3E1]">
            {lang === 'th'
              ? `พบทั้งหมด ${filteredBookings.length} รายการ`
              : `Total ${filteredBookings.length} bookings`}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#9C948E]" />
          <input
            type="text"
            placeholder={
              lang === 'th'
                ? 'ค้นหาตามชื่อลูกค้า, เบอร์โทร, บริการที่จอง หรือสาขา...'
                : 'Search by client name, phone, service, or branch...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-[#F2E3E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E88D9F] bg-white placeholder-[#9C948E]"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => loadBookings(range)}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition"
          >
            {lang === 'th' ? 'ลองใหม่' : 'Retry'}
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-[#F2E3E1]">
          <Loader2 className="w-8 h-8 animate-spin text-[#E88D9F] mb-3" />
          <p className="text-xs sm:text-sm font-medium text-[#6E6763]">
            {lang === 'th' ? 'กำลังโหลดรายการการจอง...' : 'Loading bookings...'}
          </p>
        </div>
      ) : filteredBookings.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-4 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-[#F2E3E1] space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF0ED] flex items-center justify-center border border-[#F2E3E1]">
            <Calendar className="w-7 h-7 text-[#D87085]" />
          </div>
          <h3 className="text-base font-bold text-[#3D3835]">
            {lang === 'th' ? 'ไม่พบรายการการจองในช่วงเวลานี้' : 'No bookings found in this period'}
          </h3>
          <p className="text-xs sm:text-sm text-[#6E6763] max-w-sm">
            {searchQuery
              ? lang === 'th'
                ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา ลองเปลี่ยนคำค้นหาหรือตัวกรองช่วงเวลา'
                : 'No appointments match your search term. Try adjusting your search query or filter.'
              : lang === 'th'
              ? range === 'today'
                ? 'วันนี้ยังไม่มีรายการนัดหมายจองบริการ'
                : range === 'week'
                ? 'สัปดาห์นี้ยังไม่มีรายการนัดหมายจองบริการ'
                : 'เดือนนี้ยังไม่มีรายการนัดหมายจองบริการ'
              : 'There are no appointments scheduled for the selected time range.'}
          </p>
        </div>
      ) : (
        /* Bookings List Cards (Sorted Morning to Evening) */
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const isUsed = booking.status === 'used';
            const isVoided = booking.status === 'voided';

            return (
              <div
                key={booking.id}
                className={`bg-white p-4 sm:p-5 rounded-2xl border transition shadow-2xs hover:shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isUsed
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isVoided
                    ? 'border-stone-200 opacity-60'
                    : 'border-[#F2E3E1]'
                }`}
              >
                {/* Left Side: Client, Service & Time Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  {/* Top Bar: Client Name & Phone + Status Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-[#3D3835]">
                      <User className="w-4 h-4 text-[#D87085] shrink-0" />
                      <span className="truncate">{booking.clientName}</span>
                    </div>

                    {booking.clientPhone && booking.clientPhone !== '-' && (
                      <a
                        href={`tel:${booking.clientPhone}`}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FAF0ED] text-[#D87085] hover:bg-[#F2E3E1] transition border border-[#F2E3E1]"
                        title={lang === 'th' ? 'โทรออก' : 'Call'}
                      >
                        <Phone className="w-3 h-3 text-[#D87085]" />
                        <span>{booking.clientPhone}</span>
                      </a>
                    )}

                    {/* Booking Status Badge */}
                    {isUsed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {lang === 'th' ? 'ใช้บริการแล้ว' : 'Completed'}
                      </span>
                    ) : isVoided ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                        {lang === 'th' ? 'ยกเลิกแล้ว' : 'Voided'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-700" />
                        {lang === 'th' ? 'ยืนยันการจอง' : 'Booked'}
                      </span>
                    )}
                  </div>

                  {/* Program / Service Name */}
                  <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-[#3D3835]">
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

                {/* Right Side: Payment Status Badge */}
                <div className="flex flex-col sm:items-end justify-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#F2E3E1]/60">
                  <div className="text-[10px] text-[#9C948E] font-medium mb-1 md:text-right">
                    {lang === 'th' ? 'สถานะการชำระเงิน' : 'Payment Status'}
                  </div>
                  <div>{renderPaymentBadge(booking)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
