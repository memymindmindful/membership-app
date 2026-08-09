import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PlusCircle,
  MinusCircle,
  Download,
  Calendar,
  Filter,
  Search,
  Sparkles,
  PieChart as PieIcon,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Tag,
  CreditCard,
  UserCheck,
  ChevronDown,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AppLanguage, Employee, FinancialEntry, FinancialEntryCategory, FinancialEntryType } from '../types';
import { api } from '../services/api';
import { formatCurrency } from '../lib/translations';

interface FinancialDashboardProps {
  currentStaff: Employee;
  lang: AppLanguage;
}

const CATEGORY_LABEL_MAP: Record<FinancialEntryCategory, { label: string; isIncome: boolean }> = {
  coin_purchase: { label: 'เติม Cash Coin', isIncome: true },
  direct_service: { label: 'ชำระเงินสด/โอนตรงหน้างาน', isIncome: true },
  package_sale: { label: 'ขายคอร์ส/แพ็กเกจ', isIncome: true },
  coupon_sale: { label: 'ขายคูปองส่วนลด', isIncome: true },
  online_course: { label: 'ขายคอร์สเรียนออนไลน์', isIncome: true },
  product_sale: { label: 'ขายผลิตภัณฑ์หน้าสปา', isIncome: true },
  other_income: { label: 'รายรับอื่น ๆ', isIncome: true },
  rent: { label: 'ค่าเช่าสถานที่ / ร้าน', isIncome: false },
  utilities: { label: 'ค่าน้ำ ค่าไฟ อินเทอร์เน็ต', isIncome: false },
  supplies: { label: 'ค่าอุปกรณ์ / ผลิตภัณฑ์', isIncome: false },
  salary: { label: 'เงินเดือน / ค่าคอมพนักงาน', isIncome: false },
  marketing: { label: 'ค่าการตลาด / Bonus Coins CRM', isIncome: false },
  marketing_voucher_cost: { label: 'ต้นทุนคูปองการตลาด (แจกฟรี)', isIncome: false },
  other_expense: { label: 'รายจ่ายอื่น ๆ', isIncome: false },
};

const PIE_COLORS_INCOME = ['#E88D9F', '#8884d8', '#82ca9d', '#ffc658', '#a4de6c', '#d0ed57', '#ff8042'];
const PIE_COLORS_EXPENSE = ['#ef4444', '#f97316', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

const ALL_CATEGORY_KEYS = Object.keys(CATEGORY_LABEL_MAP) as FinancialEntryCategory[];

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ currentStaff }) => {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Timeframe for Summary Cards: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'
  const [summaryTimeframe, setSummaryTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'>('monthly');

  // Timeframe for Charts: 'weekly' | 'monthly' | 'yearly'
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  // Filters for Table
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);

  // Multi-select category checkbox helper logic
  const handleToggleCategory = (catKey: string) => {
    if (selectedCategories.length === 0) {
      // If currently all selected, unchecking one selects all EXCEPT that one
      setSelectedCategories(ALL_CATEGORY_KEYS.filter((k) => k !== catKey));
    } else if (selectedCategories.includes(catKey)) {
      const updated = selectedCategories.filter((k) => k !== catKey);
      setSelectedCategories(updated);
    } else {
      const updated = [...selectedCategories, catKey];
      if (updated.length === ALL_CATEGORY_KEYS.length) {
        setSelectedCategories([]); // reset to [] representing all
      } else {
        setSelectedCategories(updated);
      }
    }
  };

  const isCategoryChecked = (catKey: string) => {
    if (selectedCategories.length === 0) return true;
    return selectedCategories.includes(catKey);
  };

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportStartDate, setExportStartDate] = useState<string>('');
  const [exportEndDate, setExportEndDate] = useState<string>('');
  const [exportType, setExportType] = useState<'all' | 'income' | 'expense'>('all');

  const handleOpenExportModal = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const monthStartStr = todayStr.substring(0, 7) + '-01';
    setExportStartDate(startDate || monthStartStr);
    setExportEndDate(endDate || todayStr);
    setExportType(typeFilter === 'all' ? 'all' : typeFilter);
    setIsExportModalOpen(true);
  };

  // Filtered Entries for Export Modal
  const exportFilteredEntries = useMemo(() => {
    return entries.filter((e) => {
      let matchesDate = true;
      if (exportStartDate) matchesDate = matchesDate && e.date >= exportStartDate;
      if (exportEndDate) matchesDate = matchesDate && e.date <= exportEndDate;

      let matchesType = exportType === 'all' || e.type === exportType;

      return matchesDate && matchesType;
    });
  }, [entries, exportStartDate, exportEndDate, exportType]);

  // Export to Excel / CSV with UTF-8 BOM
  const handleDoExportCSV = () => {
    if (exportFilteredEntries.length === 0) {
      alert('ไม่พบข้อมูลบัญชีในช่วงเวลาที่เลือก');
      return;
    }

    const headers = ['วันที่', 'ประเภท', 'หมวดหมู่', 'รายการ', 'จำนวนเงิน (บาท)', 'ชื่อลูกค้า/รายละเอียด', 'หมายเหตุ', 'ผู้บันทึก', 'ที่มารายการ'];

    const rows = exportFilteredEntries.map((e) => [
      e.date,
      e.type === 'income' ? 'รายรับ (+)' : 'รายจ่าย (-)',
      `"${e.categoryNameTh.replace(/"/g, '""')}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      e.amount,
      `"${(e.clientName || '-').replace(/"/g, '""')}"`,
      `"${(e.note || '').replace(/"/g, '""')}"`,
      `"${e.createdByStaffName.replace(/"/g, '""')}"`,
      e.isAutoGenerated ? 'อัตโนมัติ (Studio Auto-Sync)' : 'คีย์มือ (Manual Entry)',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    let rangeLabel = 'All';
    if (exportStartDate && exportEndDate) {
      rangeLabel = `${exportStartDate}_to_${exportEndDate}`;
    } else if (exportStartDate) {
      rangeLabel = `from_${exportStartDate}`;
    } else if (exportEndDate) {
      rangeLabel = `until_${exportEndDate}`;
    }

    link.setAttribute('download', `MeMyMind_Financial_Report_${rangeLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  // Add Entry Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<FinancialEntryType>('income');
  const [entryTitle, setEntryTitle] = useState<string>('');
  const [entryCategory, setEntryCategory] = useState<FinancialEntryCategory>('online_course');
  const [entryAmount, setEntryAmount] = useState<number | ''>('');
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [entryNote, setEntryNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load Financial Entries
  const fetchFinancialEntries = async () => {
    try {
      setRefreshing(true);
      const data = await api.getFinancialEntries();
      setEntries(data);
    } catch (err) {
      console.error('Error fetching financial entries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinancialEntries();
  }, []);

  // Filtered Entries for Summary Cards according to chosen summaryTimeframe
  const summaryFilteredEntries = useMemo(() => {
    if (summaryTimeframe === 'all') return entries;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (summaryTimeframe === 'daily') {
      return entries.filter((e) => e.date === todayStr);
    } else if (summaryTimeframe === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      weekAgo.setHours(0, 0, 0, 0);
      return entries.filter((e) => {
        const d = new Date(e.date);
        return !isNaN(d.getTime()) && d >= weekAgo;
      });
    } else if (summaryTimeframe === 'monthly') {
      const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
      return entries.filter((e) => e.date && e.date.startsWith(currentMonthStr));
    } else if (summaryTimeframe === 'yearly') {
      const currentYearStr = todayStr.substring(0, 4); // YYYY
      return entries.filter((e) => e.date && e.date.startsWith(currentYearStr));
    }
    return entries;
  }, [entries, summaryTimeframe]);

  // Total Income, Expense, Profit based on Summary Timeframe
  const totalIncome = useMemo(() => {
    return summaryFilteredEntries.filter((e) => e.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  }, [summaryFilteredEntries]);

  const totalExpense = useMemo(() => {
    return summaryFilteredEntries.filter((e) => e.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  }, [summaryFilteredEntries]);

  const netProfit = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  const autoTrackedIncome = useMemo(() => {
    return summaryFilteredEntries
      .filter((e) => e.type === 'income' && e.isAutoGenerated)
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [summaryFilteredEntries]);

  // Filtered Entries for History Table (Search, Type, Category, Date Range)
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchesType = typeFilter === 'all' || e.type === typeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        (e.note && e.note.toLowerCase().includes(q)) ||
        (e.clientName && e.clientName.toLowerCase().includes(q)) ||
        e.categoryNameTh.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(e.category);

      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && e.date >= startDate;
      }
      if (endDate) {
        matchesDate = matchesDate && e.date <= endDate;
      }

      return matchesType && matchesSearch && matchesCategory && matchesDate;
    });
  }, [entries, typeFilter, searchQuery, selectedCategories, startDate, endDate]);

  // Chart Data preparation
  const chartData = useMemo(() => {
    if (entries.length === 0) return [];

    if (timeframe === 'weekly') {
      // Last 7 Days
      const days: Record<string, { name: string; income: number; expense: number; profit: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
        days[dateStr] = { name: dayLabel, income: 0, expense: 0, profit: 0 };
      }

      entries.forEach((e) => {
        if (days[e.date]) {
          if (e.type === 'income') days[e.date].income += e.amount;
          else days[e.date].expense += e.amount;
          days[e.date].profit = days[e.date].income - days[e.date].expense;
        }
      });
      return Object.values(days);
    } else if (timeframe === 'monthly') {
      // 12 Months of current year
      const currentYear = new Date().getFullYear();
      const monthNames = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      const months = monthNames.map((name, i) => ({
        monthIdx: i,
        name,
        income: 0,
        expense: 0,
        profit: 0
      }));

      entries.forEach((e) => {
        const entryDateObj = new Date(e.date);
        if (entryDateObj.getFullYear() === currentYear) {
          const idx = entryDateObj.getMonth();
          if (months[idx]) {
            if (e.type === 'income') months[idx].income += e.amount;
            else months[idx].expense += e.amount;
            months[idx].profit = months[idx].income - months[idx].expense;
          }
        }
      });
      return months;
    } else {
      // Yearly Comparison
      const yearsMap: Record<string, { name: string; income: number; expense: number; profit: number }> = {};
      entries.forEach((e) => {
        const yearStr = e.date ? e.date.split('-')[0] : '2026';
        if (!yearsMap[yearStr]) {
          yearsMap[yearStr] = { name: `ปี ${yearStr}`, income: 0, expense: 0, profit: 0 };
        }
        if (e.type === 'income') yearsMap[yearStr].income += e.amount;
        else yearsMap[yearStr].expense += e.amount;
        yearsMap[yearStr].profit = yearsMap[yearStr].income - yearsMap[yearStr].expense;
      });

      return Object.values(yearsMap).sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [entries, timeframe]);

  // Income Breakdown Pie Data
  const incomePieData = useMemo(() => {
    const catTotals: Record<string, number> = {};
    entries
      .filter((e) => e.type === 'income')
      .forEach((e) => {
        const catLabel = e.categoryNameTh || CATEGORY_LABEL_MAP[e.category]?.label || e.category;
        catTotals[catLabel] = (catTotals[catLabel] || 0) + e.amount;
      });
    return Object.entries(catTotals).map(([name, value]) => ({ name, value }));
  }, [entries]);

  // Expense Breakdown Pie Data
  const expensePieData = useMemo(() => {
    const catTotals: Record<string, number> = {};
    entries
      .filter((e) => e.type === 'expense')
      .forEach((e) => {
        const catLabel = e.categoryNameTh || CATEGORY_LABEL_MAP[e.category]?.label || e.category;
        catTotals[catLabel] = (catTotals[catLabel] || 0) + e.amount;
      });
    return Object.entries(catTotals).map(([name, value]) => ({ name, value }));
  }, [entries]);

  // Open Modal Helper
  const openModal = (type: FinancialEntryType) => {
    setModalType(type);
    setEntryTitle('');
    setEntryCategory(type === 'income' ? 'online_course' : 'rent');
    setEntryAmount('');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setEntryNote('');
    setIsModalOpen(true);
  };

  // Create Financial Entry
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryTitle.trim()) {
      alert('กรุณาระบุชื่อรายการ');
      return;
    }
    const numAmt = Number(entryAmount);
    if (!numAmt || numAmt <= 0) {
      alert('กรุณาระบุจำนวนเงินที่ถูกต้อง');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createFinancialEntry(
        {
          type: modalType,
          category: entryCategory,
          categoryNameTh: CATEGORY_LABEL_MAP[entryCategory]?.label || entryCategory,
          title: entryTitle.trim(),
          amount: numAmt,
          date: entryDate,
          note: entryNote.trim(),
        },
        currentStaff.id,
        currentStaff.displayName
      );

      await fetchFinancialEntries();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการบันทึกรายการ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Financial Entry
  const handleDeleteEntry = async (id: string, isAuto?: boolean) => {
    if (isAuto) {
      alert('รายการนี้ถูกบันทึกอัตโนมัติจากระบบหน้าร้าน ไม่สามารถลบได้จากหน้านี้');
      return;
    }
    if (!window.confirm('คุณต้องการลบรายการบัญชีนี้ใช่หรือไม่?')) return;

    try {
      await api.deleteFinancialEntry(id, currentStaff.id, currentStaff.displayName);
      await fetchFinancialEntries();
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบรายการได้');
    }
  };

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (entries.length === 0) {
      alert('ไม่มีข้อมูลบัญชีสำหรับส่งออก');
      return;
    }

    const headers = ['วันที่', 'ประเภท', 'หมวดหมู่', 'รายการ', 'จำนวนเงิน (บาท)', 'ชื่อลูกค้า/รายละเอียด', 'หมายเหตุ', 'ผู้บันทึก', 'ที่มารายการ'];

    const rows = filteredEntries.map((e) => [
      e.date,
      e.type === 'income' ? 'รายรับ (+)' : 'รายจ่าย (-)',
      `"${e.categoryNameTh.replace(/"/g, '""')}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      e.amount,
      `"${(e.clientName || '-').replace(/"/g, '""')}"`,
      `"${(e.note || '').replace(/"/g, '""')}"`,
      `"${e.createdByStaffName.replace(/"/g, '""')}"`,
      e.isAutoGenerated ? 'อัตโนมัติ (Studio Auto-Sync)' : 'คีย์มือ (Manual Entry)',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MeMyMind_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#E88D9F] animate-spin" />
          <p className="text-sm font-medium text-[#6E6763]">กำลังโหลดข้อมูลบัญชีและสรุปการเงิน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header & Action Bar */}
      <div className="bg-gradient-to-r from-[#FAF0ED] via-[#F8E2E6] to-[#FAF0ED] p-6 rounded-3xl border border-[#F2C2CE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-[#E88D9F] text-white text-[10px] font-extrabold uppercase rounded-full tracking-wider">
              Studio Accounting & Financial Dashboard
            </span>
            <span className="text-xs font-mono text-[#D87085]">Auto-Sync Enabled</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#3D3835] flex items-center gap-2">
            สรุปรายรับ-รายจ่าย & บันทึกการเงินสตูดิโอ
          </h2>
          <p className="text-xs text-[#6E6763] mt-1">
            ดึงยอดเงินอัตโนมัติจากการขาย Coin / คอร์สบริการหน้างาน พร้อมระบบบันทึกรายรับคอร์สออนไลน์และรายจ่ายของร้าน
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openModal('income')}
            className="px-4 py-2.5 bg-[#E88D9F] hover:bg-[#D87085] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ บันทึกรายรับอื่นๆ</span>
          </button>

          <button
            onClick={() => openModal('expense')}
            className="px-4 py-2.5 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <MinusCircle className="w-4 h-4 text-rose-300" />
            <span>- บันทึกรายจ่าย</span>
          </button>

          <button
            onClick={handleOpenExportModal}
            className="px-4 py-2.5 bg-[#FAF0ED] hover:bg-[#F2E3E1] text-[#3D3835] border border-[#F2E3E1] font-semibold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-[#D87085]" />
            <span>ส่งออก Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Timeframe Selector Bar for Summary Stat Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#F2E3E1] shadow-2xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#E88D9F]" />
          <span className="text-xs font-bold text-[#3D3835]">
            เลือกช่วงเวลารวมยอดตัวเลข (Summary Timeframe):
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1 bg-[#FAF0ED] p-1 rounded-xl border border-[#F2E3E1]">
          <button
            onClick={() => setSummaryTimeframe('daily')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              summaryTimeframe === 'daily'
                ? 'bg-[#E88D9F] text-white shadow-2xs'
                : 'text-[#6E6763] hover:text-[#3D3835]'
            }`}
          >
            รายวัน (วันนี้)
          </button>
          <button
            onClick={() => setSummaryTimeframe('weekly')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              summaryTimeframe === 'weekly'
                ? 'bg-[#E88D9F] text-white shadow-2xs'
                : 'text-[#6E6763] hover:text-[#3D3835]'
            }`}
          >
            รายสัปดาห์ (7 วันล่าสุด)
          </button>
          <button
            onClick={() => setSummaryTimeframe('monthly')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              summaryTimeframe === 'monthly'
                ? 'bg-[#E88D9F] text-white shadow-2xs'
                : 'text-[#6E6763] hover:text-[#3D3835]'
            }`}
          >
            รายเดือน (เดือนนี้)
          </button>
          <button
            onClick={() => setSummaryTimeframe('yearly')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              summaryTimeframe === 'yearly'
                ? 'bg-[#E88D9F] text-white shadow-2xs'
                : 'text-[#6E6763] hover:text-[#3D3835]'
            }`}
          >
            รายปี (ปีนี้)
          </button>
          <button
            onClick={() => setSummaryTimeframe('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              summaryTimeframe === 'all'
                ? 'bg-[#E88D9F] text-white shadow-2xs'
                : 'text-[#6E6763] hover:text-[#3D3835]'
            }`}
          >
            ทั้งหมด (All Time)
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="p-5 bg-white rounded-2xl border border-[#F2E3E1] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6E6763] uppercase tracking-wider">
              รายรับรวมทั้งหมด (Revenue)
            </span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-mono font-extrabold text-emerald-700">
            ฿{formatCurrency(totalIncome)}
          </div>
          <p className="text-[11px] text-[#8C827A] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#E88D9F]" />
            <span>รวม {entries.filter((e) => e.type === 'income').length} รายการ</span>
          </p>
        </div>

        {/* Total Expense */}
        <div className="p-5 bg-white rounded-2xl border border-[#F2E3E1] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6E6763] uppercase tracking-wider">
              รายจ่ายรวมทั้งหมด (Expense)
            </span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-mono font-extrabold text-rose-600">
            ฿{formatCurrency(totalExpense)}
          </div>
          <p className="text-[11px] text-[#8C827A]">
            ค่าเช่าร้าน / ค่าน้ำไฟ / ค่าแรง / สต็อก
          </p>
        </div>

        {/* Net Profit */}
        <div className="p-5 bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
              กำไรสุทธิ (Net Profit)
            </span>
            <div className={`p-2 rounded-xl ${netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-mono font-extrabold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ฿{formatCurrency(netProfit)}
          </div>
          <p className="text-[11px] text-stone-400">
            {netProfit >= 0 ? 'กำไรสุทธิเป็นบวก (+ Margin Status)' : 'ขาดทุนสุทธิ (Net Loss)'}
          </p>
        </div>

        {/* Auto-Tracked Studio Revenue */}
        <div className="p-5 bg-white rounded-2xl border border-[#F2C2CE] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#D87085] uppercase tracking-wider">
              รายรับหน้าร้าน (Auto Sync)
            </span>
            <div className="p-2 bg-[#FAF0ED] rounded-xl text-[#E88D9F]">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-mono font-extrabold text-[#D87085]">
            ฿{formatCurrency(autoTrackedIncome)}
          </div>
          <p className="text-[11px] text-[#6E6763]">
            จากการเติม Coin & ยอดขายสะสมคะแนน
          </p>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="bg-white p-6 rounded-3xl border border-[#F2E3E1] shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F2E3E1] pb-4">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#3D3835] flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#E88D9F]" />
              กราฟเปรียบเทียบ รายรับ - รายจ่าย - กำไร
            </h3>
            <p className="text-xs text-[#6E6763]">
              วิเคราะห์แนวโน้มผลประกอบการย้อนหลังตามช่วงเวลา
            </p>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-[#FAF0ED] p-1 rounded-xl border border-[#F2E3E1]">
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                timeframe === 'weekly'
                  ? 'bg-[#E88D9F] text-white shadow-2xs'
                  : 'text-[#6E6763] hover:text-[#3D3835]'
              }`}
            >
              รายสัปดาห์ (7 วัน)
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                timeframe === 'monthly'
                  ? 'bg-[#E88D9F] text-white shadow-2xs'
                  : 'text-[#6E6763] hover:text-[#3D3835]'
              }`}
            >
              รายเดือน (12 เดือน)
            </button>
            <button
              onClick={() => setTimeframe('yearly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                timeframe === 'yearly'
                  ? 'bg-[#E88D9F] text-white shadow-2xs'
                  : 'text-[#6E6763] hover:text-[#3D3835]'
              }`}
            >
              รายปี (Yearly)
            </button>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="h-72 w-full pt-2">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#8C827A]">
              ยังไม่มีข้อมูลบันทึกในช่วงเวลานี้
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#8C827A" fontSize={12} tickLine={false} />
                <YAxis stroke="#8C827A" fontSize={11} tickLine={false} tickFormatter={(val) => `฿${val >= 1000 ? `${val / 1000}k` : val}`} />
                <Tooltip
                  formatter={(value: any) => [`฿${formatCurrency(Number(value))}`, '']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#F2C2CE', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="รายรับ (Income)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="รายจ่าย (Expense)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="กำไรสุทธิ (Net Profit)" fill="#E88D9F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Charts Grid for Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#F2E3E1]">
          {/* Income Breakdown */}
          <div className="p-4 bg-[#FAF0ED]/40 rounded-2xl border border-[#F2E3E1]">
            <h4 className="text-xs font-bold text-[#3D3835] mb-2 flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <span>สัดส่วนโครงสร้างรายรับ (Income Breakdown)</span>
            </h4>
            {incomePieData.length === 0 ? (
              <p className="text-xs text-[#8C827A] py-8 text-center">ยังไม่มีข้อมูลรายรับ</p>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {incomePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS_INCOME[index % PIE_COLORS_INCOME.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `฿${formatCurrency(Number(value))}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Expense Breakdown */}
          <div className="p-4 bg-[#FAF0ED]/40 rounded-2xl border border-[#F2E3E1]">
            <h4 className="text-xs font-bold text-[#3D3835] mb-2 flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-rose-500" />
              <span>สัดส่วนโครงสร้างรายจ่าย (Expense Breakdown)</span>
            </h4>
            {expensePieData.length === 0 ? (
              <p className="text-xs text-[#8C827A] py-8 text-center">ยังไม่มีข้อมูลรายจ่าย</p>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {expensePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS_EXPENSE[index % PIE_COLORS_EXPENSE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `฿${formatCurrency(Number(value))}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Records Table */}
      <div className="bg-white p-6 rounded-3xl border border-[#F2E3E1] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#3D3835]">
              ประวัติรายการบัญชีทั้งหมด (Financial Transactions)
            </h3>
            <p className="text-xs text-[#6E6763]">
              ตารางบันทึกการเงินย้อนหลัง เรียงตามลำดับล่าสุด
            </p>
          </div>

        {/* Filter Bar */}
        <div className="bg-[#FAF0ED]/60 p-4 rounded-2xl border border-[#F2E3E1] space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1">
              <Search className="w-3.5 h-3.5 text-[#8C827A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหารายการ / ชื่อลูกค้า / หมายเหตุ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-[#F2E3E1] rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
              />
            </div>

            {/* Multi-Select Category Dropdown Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#F2E3E1] rounded-xl text-xs bg-white font-medium text-[#3D3835] hover:border-[#E88D9F] transition focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
              >
                <Tag className="w-3.5 h-3.5 text-[#D87085]" />
                <span>
                  {selectedCategories.length === 0
                    ? 'ทุกหมวดหมู่ (เลือกทั้งหมด)'
                    : `เลือกแล้ว ${selectedCategories.length} หมวดหมู่`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-1" />
              </button>

              {/* Popover Dropdown */}
              {isCategoryDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsCategoryDropdownOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 w-64 max-h-72 overflow-y-auto bg-white rounded-2xl border border-[#F2E3E1] shadow-xl z-30 p-3 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-[#F2E3E1]">
                      <span className="text-[11px] font-bold text-[#3D3835]">
                        กรองตามหมวดหมู่ (Multi-select)
                      </span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setSelectedCategories([])}
                          className="text-[#E88D9F] font-bold hover:underline"
                        >
                          เลือกทั้งหมด
                        </button>
                        <span className="text-stone-300">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedCategories(['__none__'])}
                          className="text-stone-500 hover:underline"
                        >
                          ล้างเลือก
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {Object.entries(CATEGORY_LABEL_MAP).map(([catKey, meta]) => {
                        const checked = isCategoryChecked(catKey);
                        return (
                          <label
                            key={catKey}
                            onClick={(e) => {
                              e.preventDefault();
                              handleToggleCategory(catKey);
                            }}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#FAF0ED] cursor-pointer text-xs transition"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}} // handled by label onClick
                              className="w-3.5 h-3.5 rounded text-[#E88D9F] focus:ring-[#E88D9F] border-stone-300"
                            />
                            <span className={meta.isIncome ? 'text-[#059669]' : 'text-[#DC2626]'}>
                              {meta.isIncome ? '[รับ]' : '[จ่าย]'}
                            </span>
                            <span className="text-[#3D3835] font-medium truncate">
                              {meta.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-[#F2E3E1] rounded-xl text-xs bg-white font-medium text-[#3D3835] focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
            >
              <option value="all">ทุกประเภท (รายรับ & รายจ่าย)</option>
              <option value="income">เฉพาะรายรับ (+ Income)</option>
              <option value="expense">เฉพาะรายจ่าย (- Expense)</option>
            </select>
          </div>

          {/* Date Range Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F2E3E1]">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#3D3835]">
              <Calendar className="w-3.5 h-3.5 text-[#E88D9F]" />
              <span className="font-bold text-[#6E6763]">เลือกช่วงวัน:</span>

              <div className="flex items-center gap-1">
                <span className="text-stone-500 text-[11px]">ตั้งแต่วันที่</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1 border border-[#F2E3E1] rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-stone-500 text-[11px]">ถึงวันที่</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1 border border-[#F2E3E1] rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {(startDate || endDate || selectedCategories.length > 0 || typeFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSelectedCategories([]);
                  setTypeFilter('all');
                  setSearchQuery('');
                }}
                className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-[11px] rounded-lg transition"
              >
                ✕ ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-2xl border border-[#F2E3E1]">
          <table className="w-full text-left text-xs text-[#3D3835]">
            <thead className="bg-[#FAF0ED] text-[#D87085] font-bold text-[11px] uppercase tracking-wider border-b border-[#F2E3E1]">
              <tr>
                <th className="py-3 px-4">วันที่</th>
                <th className="py-3 px-4">ประเภท</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4">ชื่อรายการ / รายละเอียด</th>
                <th className="py-3 px-4 text-right">จำนวนเงิน (บาท)</th>
                <th className="py-3 px-4">ผู้บันทึก</th>
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2E3E1]">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-[#8C827A]">
                    ไม่พบรายการบัญชีที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-[#FAF0ED]/30 transition">
                    <td className="py-3 px-4 font-mono font-medium text-[#6E6763] whitespace-nowrap">
                      {e.date}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          e.type === 'income'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {e.type === 'income' ? '+' : '-'} {e.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#D87085] whitespace-nowrap">
                      {e.categoryNameTh}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-bold text-[#3D3835]">{e.title}</p>
                      {e.note && <p className="text-[11px] text-[#6E6763] truncate">{e.note}</p>}
                      {e.isAutoGenerated && (
                        <span className="inline-block mt-0.5 text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded border border-stone-200">
                          Auto Sync หน้าร้าน
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold whitespace-nowrap">
                      <span className={e.type === 'income' ? 'text-emerald-700' : 'text-rose-600'}>
                        {e.type === 'income' ? '+' : '-'}฿{formatCurrency(e.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#6E6763] whitespace-nowrap">
                      {e.createdByStaffName}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {!e.isAutoGenerated ? (
                        <button
                          onClick={() => handleDeleteEntry(e.id, e.isAutoGenerated)}
                          title="ลบรายการ"
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-stone-400 italic">ระบบ</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ENTRY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#F2C2CE] shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2E3E1] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#3D3835] flex items-center gap-2">
                {modalType === 'income' ? (
                  <PlusCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <MinusCircle className="w-5 h-5 text-rose-600" />
                )}
                <span>{modalType === 'income' ? 'บันทึกรายรับใหม่ (Add Income)' : 'บันทึกรายจ่ายใหม่ (Add Expense)'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-3.5">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">หมวดหมู่รายการ *</label>
                <select
                  value={entryCategory}
                  onChange={(e) => setEntryCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#F2E3E1] rounded-xl text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
                >
                  {Object.entries(CATEGORY_LABEL_MAP)
                    .filter(([_, meta]) => meta.isIncome === (modalType === 'income'))
                    .map(([catKey, meta]) => (
                      <option key={catKey} value={catKey}>
                        {meta.label}
                      </option>
                    ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ชื่อรายการ / รายละเอียด *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    modalType === 'income'
                      ? 'เช่น ขายคอร์สเรียนออนไลน์ นวดหน้าปรับโครงสร้าง'
                      : 'เช่น ค่าเช่าสถานที่ ประจำเดือน'
                  }
                  value={entryTitle}
                  onChange={(e) => setEntryTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#F2E3E1] rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    จำนวนเงิน (บาท) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="เช่น 3500"
                    value={entryAmount}
                    onChange={(e) =>
                      setEntryAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    วันที่บันทึก *
                  </label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  placeholder="เช่น เลขที่ใบเสร็จ หรือรายละเอียดผู้โอน"
                  value={entryNote}
                  onChange={(e) => setEntryNote(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F2E3E1]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 ${
                    modalType === 'income'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* EXPORT MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#F2C2CE] shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2E3E1] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#3D3835] flex items-center gap-2">
                <Download className="w-5 h-5 text-[#E88D9F]" />
                <span>ส่งออกรายงานทางการเงิน Excel (.CSV)</span>
              </h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#6E6763]">
              เลือกช่วงวันที่ต้องการส่งออก เพื่อป้องกันไฟล์มีขนาดใหญ่เกินไป
            </p>

            {/* Quick Date Presets */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">เลือกช่วงเวลาด่วน (Quick Presets):</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    setExportStartDate(todayStr);
                    setExportEndDate(todayStr);
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-[#FAF0ED] hover:bg-[#F2E3E1] text-[#3D3835] rounded-lg border border-[#F2E3E1] transition"
                >
                  วันนี้ (Today)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 6);
                    setExportStartDate(weekAgo.toISOString().split('T')[0]);
                    setExportEndDate(today.toISOString().split('T')[0]);
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-[#FAF0ED] hover:bg-[#F2E3E1] text-[#3D3835] rounded-lg border border-[#F2E3E1] transition"
                >
                  7 วันล่าสุด
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    setExportStartDate(todayStr.substring(0, 7) + '-01');
                    setExportEndDate(todayStr);
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-[#FAF0ED] hover:bg-[#F2E3E1] text-[#3D3835] rounded-lg border border-[#F2E3E1] transition"
                >
                  เดือนนี้ (This Month)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportStartDate(startDate);
                    setExportEndDate(endDate);
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-[#FAF0ED] hover:bg-[#F2E3E1] text-[#E88D9F] rounded-lg border border-[#F2C2CE] transition"
                >
                  ตามตารางปัจจุบัน
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportStartDate('');
                    setExportEndDate('');
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition"
                >
                  ทั้งหมด (All Time)
                </button>
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ตั้งแต่วันที่</label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#F2E3E1] rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ถึงวันที่</label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#F2E3E1] rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">ประเภทรายการ</label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value as any)}
                className="w-full px-3 py-2 border border-[#F2E3E1] rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
              >
                <option value="all">ทั้งรายรับและรายจ่าย (All)</option>
                <option value="income">เฉพาะรายรับ (+ Income)</option>
                <option value="expense">เฉพาะรายจ่าย (- Expense)</option>
              </select>
            </div>

            {/* Preview Summary */}
            <div className="bg-[#FAF0ED] p-3 rounded-2xl border border-[#F2E3E1] flex items-center justify-between text-xs">
              <span className="font-bold text-[#3D3835]">จำนวนรายการที่จะส่งออก:</span>
              <span className="font-bold text-[#E88D9F] text-sm">
                {exportFilteredEntries.length} รายการ
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F2E3E1]">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDoExportCSV}
                disabled={exportFilteredEntries.length === 0}
                className="px-5 py-2 bg-[#E88D9F] hover:bg-[#D87085] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลด Excel (.CSV)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
