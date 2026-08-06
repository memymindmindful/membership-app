import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  X,
  Calendar,
  Download,
  AlertTriangle,
  Award,
  Users,
  Filter,
  CheckCircle2,
  Clock,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';

interface ExportClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffRole?: string;
}

export const ExportClientsModal: React.FC<ExportClientsModalProps> = ({
  isOpen,
  onClose,
  staffRole,
}) => {
  const [filterMode, setFilterMode] = useState<
    'all' | 'joined_date' | 'expiry_date' | 'top_spenders'
  >('all');

  // Date inputs
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Expiry option
  const [expiryDaysFilter, setExpiryDaysFilter] = useState<number>(30);

  // Top spender limit
  const [topSpenderLimit, setTopSpenderLimit] = useState<number>(20);

  // Raw fetched export data
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadExportData();
    }
  }, [isOpen]);

  const loadExportData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await api.getExportClientsData();
      setRawData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถโหลดข้อมูลสำหรับ Export ได้');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Compute filtered dataset
  const getFilteredDataset = () => {
    if (!rawData || rawData.length === 0) return [];

    let list = [...rawData];

    // Filter by Joined Date
    if (filterMode === 'joined_date' && (startDate || endDate)) {
      list = list.filter((item) => {
        if (!item.client?.createdAt) return false;
        const created = new Date(item.client.createdAt).getTime();
        const start = startDate ? new Date(startDate).getTime() : 0;
        const end = endDate ? new Date(endDate + 'T23:59:59').getTime() : Infinity;
        return created >= start && created <= end;
      });
    }

    // Filter by Voucher/Package Expiry Date
    if (filterMode === 'expiry_date') {
      const now = new Date();
      const targetMaxDate = new Date(now.getTime() + expiryDaysFilter * 24 * 60 * 60 * 1000);

      list = list.filter((item) => {
        const pkgs = item.packages || [];
        return pkgs.some((p: any) => {
          if (!p.expiryDate || p.remainingSessions <= 0) return false;
          const exp = new Date(p.expiryDate);
          return exp >= now && exp <= targetMaxDate;
        });
      });
    }

    // Sort by Top Spenders
    if (filterMode === 'top_spenders') {
      list.sort((a, b) => (b.totalSpending || 0) - (a.totalSpending || 0));
      if (topSpenderLimit > 0) {
        list = list.slice(0, topSpenderLimit);
      }
    }

    return list;
  };

  const filteredItems = getFilteredDataset();

  // Handle Export to Excel
  const handleExportExcel = () => {
    if (filteredItems.length === 0) {
      alert('ไม่พบข้อมูลลูกค้าตรงตามเงื่อนไขที่เลือก');
      return;
    }

    const now = new Date();

    // Sheet 1: Customer Summary
    const summarySheetData = filteredItems.map((item, index) => {
      const c = item.client || {};
      const pw = item.pointsWallet || {};
      return {
        'ลำดับ': index + 1,
        'รหัสสมาชิก (Member Code)': c.memberCode || '',
        'ชื่อ-นามสกุล (Display Name)': c.displayName || '',
        'ชื่อเล่น (Nickname)': c.nickname || '-',
        'เบอร์โทรศัพท์ (Phone)': c.phone || '-',
        'วันเกิด (Birthday)': c.birthday || '-',
        'ระดับสมาชิก (Tier)': pw.tier || 'Bronze',
        'ยอด Coin คงเหลือ (บาท)': item.coinBalance || 0,
        'คะแนนสะสมคงเหลือ (pts)': pw.balance || 0,
        'คะแนนสะสมสะสมรวม (pts)': pw.lifetimeEarned || 0,
        'ยอดใช้จ่ายรวมประมาณการ (บาท)': item.totalSpending || 0,
        'จำนวน Voucher/Package ที่ใช้ได้': item.activePackagesCount || 0,
        'จำนวน Voucher/Package ใกล้หมดอายุ (30วัน)': item.expiringPackagesCount || 0,
        'จำนวนคูปองส่วนลดคงเหลือ': item.activeCouponsCount || 0,
        'วันที่สมัครสมาชิก': c.createdAt ? new Date(c.createdAt).toLocaleDateString('th-TH') : '-',
        'Staff Note (บันทึกพนักงาน)': c.notes || '-',
      };
    });

    // Sheet 2: Package & Voucher Details
    const packageSheetData: any[] = [];
    filteredItems.forEach((item) => {
      const c = item.client || {};
      const pkgs = item.packages || [];
      pkgs.forEach((p: any) => {
        let statusText = 'ใช้งานได้ (Active)';
        let daysLeftStr = '-';

        if (p.expiryDate) {
          const exp = new Date(p.expiryDate);
          const diffMs = exp.getTime() - now.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            statusText = 'หมดอายุแล้ว (Expired)';
            daysLeftStr = 'หมดอายุแล้ว';
          } else {
            daysLeftStr = `เหลือ ${diffDays} วัน`;
            if (diffDays <= 30) {
              statusText = 'ใกล้หมดอายุ (Near Expiry)';
            }
          }
        }

        if (p.remainingSessions <= 0) {
          statusText = 'ใช้สิทธิ์ครบแล้ว (Completed)';
        }

        packageSheetData.push({
          'รหัสสมาชิก': c.memberCode || '',
          'ชื่อลูกค้า': c.displayName || '',
          'เบอร์โทรศัพท์': c.phone || '-',
          'ชื่อ Voucher / Package': p.name || '',
          'สิทธิ์คงเหลือ (รอบ)': p.remainingSessions ?? 0,
          'สิทธิ์ทั้งหมด (รอบ)': p.totalSessions ?? 0,
          'ราคาที่ชำระ (บาท)': p.pricePaid ?? 0,
          'สถานะ': statusText,
          'จำนวนวันที่เหลือก่อนหมดอายุ': daysLeftStr,
          'วันที่ซื้อ/ได้รับ': p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString('th-TH') : '-',
          'วันที่หมดอายุ': p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('th-TH') : 'ไม่มีวันหมดอายุ',
        });
      });
    });

    // Sheet 3: Coupon Details
    const couponSheetData: any[] = [];
    filteredItems.forEach((item) => {
      const c = item.client || {};
      const cpnList = item.coupons || [];
      cpnList.forEach((cpn: any) => {
        let statusText = 'ใช้งานได้ (Available)';
        if (cpn.expiryDate && new Date(cpn.expiryDate) < now) {
          statusText = 'หมดอายุแล้ว (Expired)';
        } else if (cpn.usedQuantity >= cpn.totalQuantity) {
          statusText = 'ใช้สิทธิ์แล้ว (Used)';
        }

        couponSheetData.push({
          'รหัสสมาชิก': c.memberCode || '',
          'ชื่อลูกค้า': c.displayName || '',
          'เบอร์โทรศัพท์': c.phone || '-',
          'ชื่อคูปอง': cpn.name || '',
          'รหัสคูปอง (Coupon Code)': cpn.couponCode || '-',
          'จำนวนคงเหลือ': (cpn.totalQuantity || 1) - (cpn.usedQuantity || 0),
          'จำนวนทั้งหมด': cpn.totalQuantity || 1,
          'สถานะ': statusText,
          'วันที่หมดอายุ': cpn.expiryDate ? new Date(cpn.expiryDate).toLocaleDateString('th-TH') : 'ไม่มีวันหมดอายุ',
        });
      });
    });

    // Create Excel Workbook using SheetJS
    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.json_to_sheet(summarySheetData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปข้อมูลสมาชิก_TopSpenders');

    const wsPackages = XLSX.utils.json_to_sheet(
      packageSheetData.length > 0
        ? packageSheetData
        : [{ 'ข้อความ': 'ไม่มีข้อมูล Voucher / Package ในเงื่อนไขที่เลือก' }]
    );
    XLSX.utils.book_append_sheet(wb, wsPackages, 'รายละเอียด_Voucher_Packages');

    const wsCoupons = XLSX.utils.json_to_sheet(
      couponSheetData.length > 0
        ? couponSheetData
        : [{ 'ข้อความ': 'ไม่มีข้อมูลคูปองส่วนลดในเงื่อนไขที่เลือก' }]
    );
    XLSX.utils.book_append_sheet(wb, wsCoupons, 'รายละเอียด_คูปองส่วนลด');

    // Download File
    const todayStr = new Date().toISOString().split('T')[0];
    const fileName = `MeMyMind_Customers_Export_${todayStr}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-[#F2C2CE] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-5 border-b border-[#F2E3E1] flex items-center justify-between bg-[#FAF0ED]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E88D9F] flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#3D3835] flex items-center gap-2">
                <span>Export ข้อมูลลูกค้า & Voucher / Package (Excel)</span>
                <span className="text-[10px] bg-[#FAF0ED] text-[#D87085] border border-[#F2E3E1] font-sans px-2 py-0.5 rounded-full font-bold">
                  Admin & Manager
                </span>
              </h3>
              <p className="text-xs text-[#6E6763]">
                ดาวน์โหลดไฟล์ .xlsx เพื่อตรวจเช็ก Voucher ใกล้หมดอายุ และวิเคราะห์ Top Spenders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Filter Options Selection */}
          <div>
            <label className="block text-xs font-bold text-[#3D3835] mb-2">
              1. ตัวเลือกโหมดการดึงข้อมูล (Export Filter Mode)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                  filterMode === 'all'
                    ? 'bg-[#FAF0ED] border-[#E88D9F] ring-1 ring-[#E88D9F]'
                    : 'bg-white border-[#F2E3E1] hover:bg-stone-50'
                }`}
              >
                <Users className={`w-4 h-4 mt-0.5 shrink-0 ${filterMode === 'all' ? 'text-[#D87085]' : 'text-stone-400'}`} />
                <div>
                  <p className="text-xs font-bold text-[#3D3835]">ทั้งหมด (All Customers)</p>
                  <p className="text-[11px] text-[#6E6763]">ส่งออกข้อมูลลูกค้าและยอดคงเหลือสิทธิ์ทั้งหมด</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('expiry_date')}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                  filterMode === 'expiry_date'
                    ? 'bg-[#FAF0ED] border-[#E88D9F] ring-1 ring-[#E88D9F]'
                    : 'bg-white border-[#F2E3E1] hover:bg-stone-50'
                }`}
              >
                <Clock className={`w-4 h-4 mt-0.5 shrink-0 ${filterMode === 'expiry_date' ? 'text-[#D87085]' : 'text-stone-400'}`} />
                <div>
                  <p className="text-xs font-bold text-[#3D3835]">เตือน Voucher/Package ใกล้หมดอายุ</p>
                  <p className="text-[11px] text-[#6E6763]">กรองเฉพาะสิทธิ์ที่กำลังจะหมดอายุเพื่อส่งไลน์เตือนลูกค้า</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('top_spenders')}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                  filterMode === 'top_spenders'
                    ? 'bg-[#FAF0ED] border-[#E88D9F] ring-1 ring-[#E88D9F]'
                    : 'bg-white border-[#F2E3E1] hover:bg-stone-50'
                }`}
              >
                <Award className={`w-4 h-4 mt-0.5 shrink-0 ${filterMode === 'top_spenders' ? 'text-[#D87085]' : 'text-stone-400'}`} />
                <div>
                  <p className="text-xs font-bold text-[#3D3835]">จัดอันดับ Top Spenders</p>
                  <p className="text-[11px] text-[#6E6763]">เรียงลำดับลูกค้ายอดใช้จ่ายสะสมสูงสุดเพื่อมอบสิทธิพิเศษ</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('joined_date')}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                  filterMode === 'joined_date'
                    ? 'bg-[#FAF0ED] border-[#E88D9F] ring-1 ring-[#E88D9F]'
                    : 'bg-white border-[#F2E3E1] hover:bg-stone-50'
                }`}
              >
                <Calendar className={`w-4 h-4 mt-0.5 shrink-0 ${filterMode === 'joined_date' ? 'text-[#D87085]' : 'text-stone-400'}`} />
                <div>
                  <p className="text-xs font-bold text-[#3D3835]">กรองช่วงวันที่สมัครสมาชิก</p>
                  <p className="text-[11px] text-[#6E6763]">เลือกวันที่เริ่มต้น - วันที่สิ้นสุดสำหรับลูกค้าใหม่</p>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Controls based on Filter Mode */}
          {filterMode === 'expiry_date' && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-amber-900">
                เลือกช่วงเวลาที่ Voucher/Package จะหมดอายุ:
              </label>
              <div className="flex flex-wrap gap-2">
                {[15, 30, 60, 90].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setExpiryDaysFilter(days)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      expiryDaysFilter === days
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-white text-stone-700 border border-amber-200 hover:bg-amber-100/50'
                    }`}
                  >
                    หมดอายุภายใน {days} วัน
                  </button>
                ))}
              </div>
            </div>
          )}

          {filterMode === 'top_spenders' && (
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-purple-900">
                เลือกจำนวนอันดับ Top Spenders ที่ต้องการดึง:
              </label>
              <div className="flex flex-wrap gap-2">
                {[10, 20, 50, 0].map((limit) => (
                  <button
                    key={limit}
                    type="button"
                    onClick={() => setTopSpenderLimit(limit)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      topSpenderLimit === limit
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'bg-white text-purple-900 border border-purple-200 hover:bg-purple-100/50'
                    }`}
                  >
                    {limit === 0 ? 'ลูกค้าทั้งหมด (ไม่จำกัดอันดับ)' : `Top ${limit} คนแรก`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filterMode === 'joined_date' && (
            <div className="p-4 bg-[#FAF0ED] border border-[#F2E3E1] rounded-2xl space-y-3">
              <label className="block text-xs font-bold text-[#3D3835]">
                กำหนดช่วงวันที่สมัครสมาชิก (Joined Date Range):
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] text-[#6E6763] mb-1">วันที่เริ่มต้น</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#F2E3E1] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-[#6E6763] mb-1">วันที่สิ้นสุด</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#F2E3E1] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dataset Summary Box */}
          <div className="bg-[#FAF0ED]/60 border border-[#F2E3E1] p-4 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-[#3D3835]">
                พร้อมส่งออกจำนวนทั้งหมด: <span className="text-[#D87085] text-sm font-mono">{filteredItems.length}</span> รายการ
              </p>
              <p className="text-[11px] text-[#6E6763] mt-0.5">
                ไฟล์ Excel จะสร้างขึ้นโดยอัตโนมัติ พร้อม Sheet สรุปรายชื่อ, Voucher/Package และ คูปอง
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-[#E88D9F]" />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-[#F2E3E1] bg-stone-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl transition"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={loading || filteredItems.length === 0}
            className="px-5 py-2.5 bg-[#FAF0ED] hover:bg-[#F2E3E1] text-[#3D3835] border border-[#F2C2CE] text-xs font-semibold rounded-xl shadow-2xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#D87085]" />
            <span>ดาวน์โหลดไฟล์ Excel (.xlsx)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
