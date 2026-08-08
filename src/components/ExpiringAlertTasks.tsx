import React, { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Clock3,
  Filter,
  MessageSquare,
  Phone,
  Search,
  User,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Save,
  Tag,
  AlertTriangle,
  RefreshCw,
  Send,
} from 'lucide-react';
import { ExpiringItemTask, FollowUpStatus, Employee } from '../types';
import { api } from '../services/api';

interface ExpiringAlertTasksProps {
  currentStaff: Employee;
  onSelectClient: (clientId: string) => void;
  onRefreshData?: () => void;
}

export const ExpiringAlertTasks: React.FC<ExpiringAlertTasksProps> = ({
  currentStaff,
  onSelectClient,
  onRefreshData,
}) => {
  const [tasks, setTasks] = useState<ExpiringItemTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Filter States
  const [timeframeFilter, setTimeframeFilter] = useState<'14' | '30' | '60' | 'expired' | 'all'>('30');
  const [typeFilter, setTypeFilter] = useState<'all' | 'package' | 'coupon'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_contacted' | 'contacted' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Local editing note state: map taskId -> note string
  const [notesState, setNotesState] = useState<Record<string, string>>({});
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getExpiringTasks();
      setTasks(data);

      // Initialize notes state
      const initialNotes: Record<string, string> = {};
      data.forEach((t) => {
        initialNotes[t.id] = t.followUpNote || '';
      });
      setNotesState(initialNotes);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลแจ้งเตือนได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleNoteChange = (taskId: string, text: string) => {
    setNotesState((prev) => ({ ...prev, [taskId]: text }));
  };

  const handleUpdateFollowUp = async (
    task: ExpiringItemTask,
    newStatus: FollowUpStatus,
    noteToSave?: string
  ) => {
    setSavingTaskId(task.id);
    const note = noteToSave !== undefined ? noteToSave : (notesState[task.id] || '');
    try {
      if (task.itemType === 'package') {
        await api.updatePackageFollowUp(
          task.id,
          newStatus,
          note,
          currentStaff.id,
          currentStaff.displayName
        );
      } else {
        await api.updateCouponFollowUp(
          task.id,
          newStatus,
          note,
          currentStaff.id,
          currentStaff.displayName
        );
      }

      // Update local task state
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                followUpStatus: newStatus,
                followUpNote: note,
                followUpUpdatedAt: new Date().toISOString(),
                followUpUpdatedByStaffName: currentStaff.displayName,
              }
            : t
        )
      );

      setSuccessMessage(`อัปเดตสถานะการติดตามเรียบร้อยแล้ว`);
      setTimeout(() => setSuccessMessage(null), 3000);

      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setSavingTaskId(null);
    }
  };

  // Filter Logic
  const filteredTasks = tasks.filter((t) => {
    // 1. Timeframe
    if (timeframeFilter === '14' && t.daysRemaining > 14) return false;
    if (timeframeFilter === '30' && t.daysRemaining > 30) return false;
    if (timeframeFilter === '60' && t.daysRemaining > 60) return false;
    if (timeframeFilter === 'expired' && t.daysRemaining > 0) return false;

    // 2. Type
    if (typeFilter !== 'all' && t.itemType !== typeFilter) return false;

    // 3. Follow-up Status
    if (statusFilter !== 'all' && t.followUpStatus !== statusFilter) return false;

    // 4. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = t.clientName.toLowerCase().includes(q);
      const matchNickname = t.clientNickname.toLowerCase().includes(q);
      const matchCode = t.memberCode.toLowerCase().includes(q);
      const matchPhone = t.clientPhone.includes(q);
      const matchItem = t.name.toLowerCase().includes(q);
      if (!matchName && !matchNickname && !matchCode && !matchPhone && !matchItem) return false;
    }

    return true;
  });

  // Task Count Statistics
  const notContactedCount = tasks.filter((t) => t.followUpStatus === 'not_contacted' && t.daysRemaining <= 30).length;
  const contactedCount = tasks.filter((t) => t.followUpStatus === 'contacted' && t.daysRemaining <= 30).length;
  const resolvedCount = tasks.filter((t) => t.followUpStatus === 'resolved' && t.daysRemaining <= 30).length;

  return (
    <div className="bg-white rounded-2xl border border-[#F2E3E1] shadow-xs overflow-hidden transition-all">
      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-[#FAF0ED] via-[#FFF9F6] to-[#FAF0ED] p-4 border-b border-[#F2E3E1] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E88D9F] text-white flex items-center justify-center shadow-xs shrink-0 relative">
            <Bell className="w-5 h-5 animate-bounce" />
            {notContactedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {notContactedCount}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#3D3835]">
                งานติดตามการหมดอายุ Package & Voucher (Expiring Tasks)
              </h2>
              <span className="text-[10px] font-bold bg-[#E88D9F] text-white px-2 py-0.5 rounded-full">
                {tasks.length} รายการ
              </span>
            </div>
            <p className="text-xs text-[#6E6763]">
              แจ้งเตือนล่วงหน้าสำหรับพนักงานติดตามทักหาลูกค้าก่อนแพ็กเกจหรือคูปองหมดอายุ
            </p>
          </div>
        </div>

        {/* Counter Summary Pills & Collapse Toggle */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium">
            <span className="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              ยังไม่ได้ทัก: <strong>{notContactedCount}</strong>
            </span>
            <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              ทักแล้ว: <strong>{contactedCount}</strong>
            </span>
            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              เรียบร้อย: <strong>{resolvedCount}</strong>
            </span>
          </div>

          <button
            onClick={fetchTasks}
            className="p-2 text-[#6E6763] hover:text-[#D87085] hover:bg-white rounded-xl transition border border-transparent hover:border-[#F2E3E1]"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-[#3D3835] hover:bg-white rounded-xl transition border border-[#F2E3E1] flex items-center gap-1 text-xs font-semibold"
          >
            {isExpanded ? (
              <>
                <span>ซ่อน</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>แสดง</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-[#FAF6F2]/30">
          {/* Toast Notification */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* FILTER CONTROLS BAR */}
          <div className="bg-white p-3 rounded-xl border border-[#F2E3E1] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {/* Filter 1: Timeframe */}
              <div>
                <label className="text-[11px] font-bold text-[#6E6763] mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#D87085]" />
                  <span>ระยะเวลาหมดอายุ</span>
                </label>
                <select
                  value={timeframeFilter}
                  onChange={(e: any) => setTimeframeFilter(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-[#FAF6F2] font-medium focus:ring-2 focus:ring-[#E88D9F] focus:outline-none"
                >
                  <option value="14">ภายใน 2 สัปดาห์ (14 วัน)</option>
                  <option value="30">ภายใน 1 เดือน (30 วัน)</option>
                  <option value="60">ภายใน 2 เดือน (60 วัน)</option>
                  <option value="expired">หมดอายุแล้ว</option>
                  <option value="all">ทั้งหมด (ไม่จำกัดวัน)</option>
                </select>
              </div>

              {/* Filter 2: Service Type */}
              <div>
                <label className="text-[11px] font-bold text-[#6E6763] mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#D87085]" />
                  <span>ประเภทบริการ</span>
                </label>
                <select
                  value={typeFilter}
                  onChange={(e: any) => setTypeFilter(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-[#FAF6F2] font-medium focus:ring-2 focus:ring-[#E88D9F] focus:outline-none"
                >
                  <option value="all">ทั้งหมด (Package + Voucher)</option>
                  <option value="package">แพ็กเกจคอร์สบริการ</option>
                  <option value="coupon">คูปอง / วอเชอร์ส่วนลด</option>
                </select>
              </div>

              {/* Filter 3: Follow-Up Status */}
              <div>
                <label className="text-[11px] font-bold text-[#6E6763] mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-[#D87085]" />
                  <span>สถานะการติดตาม</span>
                </label>
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-[#FAF6F2] font-medium focus:ring-2 focus:ring-[#E88D9F] focus:outline-none"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="not_contacted">🔴 ยังไม่ได้ทัก (Pending)</option>
                  <option value="contacted">🟡 ทักแล้ว (Contacted)</option>
                  <option value="resolved">🟢 ต่ออายุ/เรียบร้อย (Resolved)</option>
                </select>
              </div>

              {/* Filter 4: Search Box */}
              <div>
                <label className="text-[11px] font-bold text-[#6E6763] mb-1 flex items-center gap-1">
                  <Search className="w-3 h-3 text-[#D87085]" />
                  <span>ค้นหาตามชื่อ/เบอร์โทร</span>
                </label>
                <input
                  type="text"
                  placeholder="พิมพ์ชื่อ, เบอร์, MMM-code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-200 rounded-lg bg-[#FAF6F2] font-medium focus:ring-2 focus:ring-[#E88D9F] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* TASK LIST */}
          {loading ? (
            <div className="py-8 text-center text-xs text-[#6E6763] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#D87085]" />
              <span>กำลังโหลดข้อมูลการแจ้งเตือน...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-dashed border-stone-200 text-center text-stone-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-[#3D3835]">ไม่มีรายการแจ้งเตือนตามเงื่อนไขที่เลือก</p>
              <p className="text-[11px]">ไม่พบรายการใกล้หมดอายุที่ต้องการติดตามในช่วงเวลานี้</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredTasks.map((task) => {
                const isSaving = savingTaskId === task.id;
                const noteValue = notesState[task.id] !== undefined ? notesState[task.id] : (task.followUpNote || '');

                // Days remaining badge formatting
                let daysBadge;
                if (task.daysRemaining < 0) {
                  daysBadge = (
                    <span className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-stone-200 flex items-center gap-1">
                      <Clock3 className="w-3 h-3 text-stone-500" />
                      หมดอายุเมื่อ {Math.abs(task.daysRemaining)} วันก่อน
                    </span>
                  );
                } else if (task.daysRemaining <= 7) {
                  daysBadge = (
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-300 flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      🔴 เหลืออีก {task.daysRemaining} วัน
                    </span>
                  );
                } else if (task.daysRemaining <= 30) {
                  daysBadge = (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      🟡 เหลืออีก {task.daysRemaining} วัน
                    </span>
                  );
                } else {
                  daysBadge = (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      🟢 เหลืออีก {task.daysRemaining} วัน
                    </span>
                  );
                }

                return (
                  <div
                    key={`${task.itemType}-${task.id}`}
                    className={`bg-white p-4 rounded-xl border transition shadow-2xs space-y-3 ${
                      task.followUpStatus === 'not_contacted'
                        ? 'border-rose-200 hover:border-rose-300'
                        : task.followUpStatus === 'contacted'
                        ? 'border-amber-200 hover:border-amber-300'
                        : 'border-emerald-200 bg-emerald-50/20'
                    }`}
                  >
                    {/* TOP ROW: Customer & Item Basic Info */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      {/* Customer Info */}
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            task.clientProfilePic ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                          }
                          alt={task.clientName}
                          className="w-10 h-10 rounded-full object-cover border border-[#E88D9F] shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-[#3D3835]">
                              {task.clientName}
                            </h3>
                            {task.clientNickname && (
                              <span className="text-[10px] bg-[#FAF0ED] text-[#D87085] px-1.5 py-0.2 rounded font-medium">
                                "{task.clientNickname}"
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#6E6763] font-mono mt-0.5">
                            <span className="font-bold text-[#D87085]">{task.memberCode}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#D87085]" />
                              {task.clientPhone}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action: Select Client Profile */}
                      <button
                        onClick={() => onSelectClient(task.clientId)}
                        className="text-xs font-semibold text-[#D87085] bg-[#FAF0ED] hover:bg-[#F2E3E1] border border-[#F2C2CE] px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>ดูข้อมูลสมาชิก</span>
                      </button>
                    </div>

                    {/* MIDDLE ROW: Item Details Card */}
                    <div className="bg-[#FAF6F2] p-3 rounded-lg border border-[#F2E3E1] flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase shrink-0 ${
                            task.itemType === 'package'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {task.itemType === 'package' ? 'Package' : 'Coupon'}
                        </span>
                        <span className="font-bold text-[#3D3835] truncate">{task.name}</span>
                        <span className="text-[11px] font-semibold text-[#D87085] bg-white px-2 py-0.5 rounded border border-[#F2E3E1] shrink-0">
                          {task.remainingDetails}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-[#6E6763] flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#D87085]" />
                          หมดอายุ: {new Date(task.expiryDate).toLocaleDateString('th-TH')}
                        </span>
                        {daysBadge}
                      </div>
                    </div>

                    {/* BOTTOM ROW: Follow-Up Status Buttons & Note Field */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-1 items-center">
                      {/* Status Selector Buttons (4 cols) */}
                      <div className="md:col-span-5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateFollowUp(task, 'not_contacted')}
                          disabled={isSaving}
                          className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg border transition ${
                            task.followUpStatus === 'not_contacted'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                              : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                          }`}
                        >
                          🔴 ยังไม่ได้ทัก
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateFollowUp(task, 'contacted')}
                          disabled={isSaving}
                          className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg border transition ${
                            task.followUpStatus === 'contacted'
                              ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                              : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                          }`}
                        >
                          🟡 ทักแล้ว
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateFollowUp(task, 'resolved')}
                          disabled={isSaving}
                          className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg border transition ${
                            task.followUpStatus === 'resolved'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          🟢 เรียบร้อย
                        </button>
                      </div>

                      {/* Note Input & Save Button (7 cols) */}
                      <div className="md:col-span-7 flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="เพิ่มโน้ตติดตาม..."
                            value={noteValue}
                            onChange={(e) => handleNoteChange(task.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateFollowUp(task, task.followUpStatus, noteValue);
                              }
                            }}
                            className="w-full text-xs pl-8 pr-2 py-1.5 border border-stone-200 rounded-lg focus:ring-1 focus:ring-[#E88D9F] focus:outline-none bg-stone-50"
                          />
                          <MessageSquare className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUpdateFollowUp(task, task.followUpStatus, noteValue)}
                          disabled={isSaving}
                          className="px-3 py-1.5 bg-[#3D3835] hover:bg-[#2A2624] text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shrink-0 disabled:opacity-50"
                        >
                          {isSaving ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Save className="w-3 h-3" />
                          )}
                          <span>บันทึก Note</span>
                        </button>
                      </div>
                    </div>

                    {/* Staff Update Footer Info */}
                    {task.followUpUpdatedAt && (
                      <div className="text-[10px] text-[#A89F91] text-right font-mono italic">
                        บันทึกการติดตามล่าสุดโดย: {task.followUpUpdatedByStaffName || 'Staff'} (
                        {new Date(task.followUpUpdatedAt).toLocaleString('th-TH')})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
