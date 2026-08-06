import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Check,
  ShieldAlert,
  Users,
  BookOpen,
  FileSpreadsheet,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Employee } from '../types';
import { api } from '../services/api';

interface FactoryResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStaff: Employee | null;
  onSuccess: () => void;
}

export const FactoryResetModal: React.FC<FactoryResetModalProps> = ({
  isOpen,
  onClose,
  currentStaff,
  onSuccess,
}) => {
  const [deleteClients, setDeleteClients] = useState(true);
  const [deleteCatalog, setDeleteCatalog] = useState(false);
  const [deleteTransactions, setDeleteTransactions] = useState(true);

  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const isAllSelected = deleteClients && deleteCatalog && deleteTransactions;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setDeleteClients(false);
      setDeleteCatalog(false);
      setDeleteTransactions(false);
    } else {
      setDeleteClients(true);
      setDeleteCatalog(true);
      setDeleteTransactions(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentStaff) {
      setErrorMsg('ไม่พบข้อมูลผู้ใช้งานพนักงาน');
      return;
    }

    if (currentStaff.role !== 'admin') {
      setErrorMsg('สิทธิ์ไม่เพียงพอ! เฉพาะ Admin เท่านั้นที่สามารถทำการล้างข้อมูลระบบได้');
      return;
    }

    if (!deleteClients && !deleteCatalog && !deleteTransactions) {
      setErrorMsg('กรุณาเลือกอย่างน้อย 1 หัวข้อที่ต้องการล้างข้อมูล');
      return;
    }

    if (!adminPassword) {
      setErrorMsg('กรุณากรอกรหัสผ่านบัญชี Admin ของคุณเพื่อยืนยัน');
      return;
    }

    try {
      setLoading(true);
      const res = await api.purgeSystemData(currentStaff.id, adminPassword, {
        deleteClients,
        deleteCatalog,
        deleteTransactions,
      });

      setSuccessMsg(res.message || 'ล้างข้อมูลระบบเรียบร้อยแล้ว');
      setTimeout(() => {
        onSuccess();
        onClose();
        setAdminPassword('');
        setSuccessMsg('');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาด ไม่สามารถล้างข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-rose-100 flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-rose-500 to-red-600 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">ล้างข้อมูลระบบ (Factory Reset)</h3>
                <span className="bg-white/20 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-0.5">
                เลือกหัวข้อข้อมูลที่ต้องการล้างเพื่อเริ่มต้นใช้งานระบบใหม่
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 hover:bg-white/20 rounded-full transition text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Quick Warning Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3 text-amber-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">คำเตือนสำคัญ:</span> การล้างข้อมูลจะเป็นการลบอย่างถาวรและไม่สามารถกู้คืนกลับมาได้ กรุณาตรวจสอบให้แน่ใจก่อนกดยืนยัน
            </div>
          </div>

          {/* Target Selection Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#3D3835] uppercase tracking-wider">
                เลือกข้อมูลที่ต้องการลบ:
              </label>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition"
              >
                {isAllSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                <span>{isAllSelected ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด (Full Reset)'}</span>
              </button>
            </div>

            {/* Item 1: Clients */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border transition cursor-pointer ${
                deleteClients
                  ? 'bg-rose-50/70 border-rose-300 text-rose-950 shadow-xs'
                  : 'bg-gray-50/50 border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={deleteClients}
                onChange={(e) => setDeleteClients(e.target.checked)}
                className="mt-1 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-bold text-xs text-[#3D3835]">
                  <Users className="w-4 h-4 text-rose-500" />
                  <span>1. ข้อมูลสมาชิก & ลูกค้าทั้งหมด</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  ลบข้อมูลสมาชิกทุกท่าน, ยอด Coin คงเหลือ, แต้มสะสม, ประวัติคอร์สแพ็กเกจ และคูปองที่ถืออยู่ทั้งหมด
                </p>
              </div>
            </label>

            {/* Item 2: Catalog & Services */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border transition cursor-pointer ${
                deleteCatalog
                  ? 'bg-rose-50/70 border-rose-300 text-rose-950 shadow-xs'
                  : 'bg-gray-50/50 border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={deleteCatalog}
                onChange={(e) => setDeleteCatalog(e.target.checked)}
                className="mt-1 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-bold text-xs text-[#3D3835]">
                  <BookOpen className="w-4 h-4 text-rose-500" />
                  <span>2. แคตตาล็อกบริการ & รายการของรางวัล</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  ลบรายการคอร์สแพ็กเกจ, คูปองส่วนลดหน้าร้าน, บริการรายครั้ง และของรางวัลแลกแต้มทั้งหมด
                </p>
              </div>
            </label>

            {/* Item 3: Transactions & Audit Logs */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border transition cursor-pointer ${
                deleteTransactions
                  ? 'bg-rose-50/70 border-rose-300 text-rose-950 shadow-xs'
                  : 'bg-gray-50/50 border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={deleteTransactions}
                onChange={(e) => setDeleteTransactions(e.target.checked)}
                className="mt-1 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-bold text-xs text-[#3D3835]">
                  <FileSpreadsheet className="w-4 h-4 text-rose-500" />
                  <span>3. ประวัติธุรกรรม, บัญชีรายรับ-รายจ่าย & Audit Logs</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  ลบประวัติการเติม/ตัด Coin, การสะสมแต้ม, บันทึกการเงินหน้าร้าน และบันทึกประวัติการทำงานพนักงาน
                </p>
              </div>
            </label>
          </div>

          {/* Admin Verification Section */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <label className="block text-xs font-bold text-[#3D3835]">
              ยืนยันรหัสผ่านของบัญชี Admin ({currentStaff?.displayName || 'Admin'}):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านของคุณเพื่อกดยืนยัน"
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#3D3835] focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error & Success Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={loading || !adminPassword || (!deleteClients && !deleteCatalog && !deleteTransactions)}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังล้างข้อมูล...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>ยืนยันล้างข้อมูลที่เลือก</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
