import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Coins,
  Package,
  Ticket,
  Award,
  Calendar,
  DollarSign,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { ModuleSettings, AppLanguage } from '../types';
import { api } from '../services/api';

interface ModuleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: AppLanguage;
  onSettingsUpdated?: (settings: ModuleSettings) => void;
}

export const ModuleSettingsModal: React.FC<ModuleSettingsModalProps> = ({
  isOpen,
  onClose,
  lang = 'th',
  onSettingsUpdated,
}) => {
  const [settings, setSettings] = useState<ModuleSettings>({
    coin: true,
    package: true,
    coupon: true,
    points: true,
    booking: true,
    accounting: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setStatusMsg(null);
      const res = await api.getModuleSettings();
      if (res) {
        setSettings(res);
      }
    } catch (err: any) {
      console.error('Failed to load module settings:', err);
      setStatusMsg({
        type: 'error',
        text: lang === 'th' ? 'ไม่สามารถโหลดการตั้งค่าระบบได้' : 'Failed to load module settings',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof ModuleSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatusMsg(null);
      const updated = await api.updateModuleSettings(settings);
      setSettings(updated);
      setStatusMsg({
        type: 'success',
        text: lang === 'th' ? 'บันทึกการตั้งค่าโมดูลเรียบร้อยแล้ว' : 'Module settings saved successfully',
      });
      if (onSettingsUpdated) {
        onSettingsUpdated(updated);
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to save module settings:', err);
      setStatusMsg({
        type: 'error',
        text: err.message || (lang === 'th' ? 'เกิดข้อผิดพลาดในการบันทึก' : 'Error saving settings'),
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const moduleItems: {
    key: keyof ModuleSettings;
    icon: React.ElementType;
    titleTh: string;
    titleEn: string;
    descTh: string;
    descEn: string;
  }[] = [
    {
      key: 'coin',
      icon: Coins,
      titleTh: 'Cash Coin (ระบบเครดิตเงินสด)',
      titleEn: 'Cash Coin System',
      descTh: 'เติมเงิน, หัก Coin สำหรับบริการหน้าร้าน, หน้าแสดงยอดเงินและโปรโมชัน Coin',
      descEn: 'Top up, deduct coin for services, and display coin wallet',
    },
    {
      key: 'package',
      icon: Package,
      titleTh: 'Packages / คอร์สบริการ',
      titleEn: 'Package & Course System',
      descTh: 'เปิดขายแพ็กเกจคอร์ส, บันทึกการตัดใช้รอบบริการ, จัดการสถานะคอร์ส',
      descEn: 'Sell packages, record session usage, and manage course statuses',
    },
    {
      key: 'coupon',
      icon: Ticket,
      titleTh: 'Coupons / บัตรกำนัล & คูปอง',
      titleEn: 'Coupon & Voucher System',
      descTh: 'ออกคูปองส่วนลด, คูปองการตลาด CRM, สแกนและใช้สิทธิ์คูปอง',
      descEn: 'Issue discount coupons, CRM vouchers, and redeem vouchers',
    },
    {
      key: 'points',
      icon: Award,
      titleTh: 'Points & Rewards / คะแนนสะสม',
      titleEn: 'Points & Rewards System',
      descTh: 'สะสมคะแนนจากการใช้บริการ, แลกของรางวัล, ประวัติคะแนน',
      descEn: 'Accumulate reward points, redeem gift catalog, and view points ledger',
    },
    {
      key: 'booking',
      icon: Calendar,
      titleTh: 'Bookings / การจองนัดหมาย',
      titleEn: 'Booking & Appointment System',
      descTh: 'บริการจอง One-Time ล่วงหน้า, บันทึกนัดหมาย, ส่งข้อความยืนยันการจอง',
      descEn: 'One-time advance service bookings, schedules, and confirmations',
    },
    {
      key: 'accounting',
      icon: DollarSign,
      titleTh: 'Accounting / บัญชีรายรับ-รายจ่าย',
      titleEn: 'Financial Accounting System',
      descTh: 'แดชบอร์ดการเงิน, บันทึกรายได้/ค่าใช้จ่ายหน้าร้าน, รายงานสรุปผลประกอบการ',
      descEn: 'Financial dashboard, income/expense entries, and financial overview',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[#F2E3E1] space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#FAF0ED] pb-3">
          <div className="flex items-center gap-2.5 text-[#3D3835]">
            <div className="p-2 bg-[#FAF0ED] text-[#D87085] rounded-xl border border-[#F2E3E1]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#3D3835]">
                {lang === 'th' ? 'ตั้งค่าการเปิด/ปิดฟังก์ชันระบบ (Module Settings)' : 'System Modules Toggle'}
              </h3>
              <p className="text-[11px] text-[#8C6D5E]">
                {lang === 'th' ? 'เลือกเปิดหรือปิดระบบที่ต้องการใช้งานในสตูดิโอ' : 'Enable or disable features for your studio'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9C948E] hover:text-[#3D3835] p-1.5 rounded-full hover:bg-stone-100 transition text-lg font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#E88D9F]" />
            <span className="text-xs font-medium">
              {lang === 'th' ? 'กำลังโหลดการตั้งค่า...' : 'Loading settings...'}
            </span>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {moduleItems.map((item) => {
              const Icon = item.icon;
              const isEnabled = settings[item.key];

              return (
                <div
                  key={item.key}
                  onClick={() => handleToggle(item.key)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isEnabled
                      ? 'bg-white border-[#F2C2CE] shadow-2xs hover:border-[#E88D9F]'
                      : 'bg-stone-50/80 border-stone-200 opacity-60 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 transition ${
                        isEnabled
                          ? 'bg-[#FAF0ED] text-[#D87085] border border-[#F2E3E1]'
                          : 'bg-stone-200 text-stone-500 border border-stone-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#3D3835] truncate">
                          {lang === 'th' ? item.titleTh : item.titleEn}
                        </h4>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isEnabled
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {isEnabled ? (lang === 'th' ? 'เปิดใช้งาน' : 'Enabled') : (lang === 'th' ? 'ปิดใช้งาน' : 'Disabled')}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6E6763] mt-0.5 leading-snug">
                        {lang === 'th' ? item.descTh : item.descEn}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch UI */}
                  <div className="shrink-0 pl-2">
                    <div
                      className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                        isEnabled ? 'bg-[#E88D9F]' : 'bg-stone-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-[#FAF0ED] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={loadSettings}
            disabled={loading || saving}
            className="px-3 py-2 text-xs font-medium text-[#6E6763] hover:text-[#3D3835] hover:bg-[#FAF0ED] rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="รีเซ็ตการตั้งค่า"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#D87085] ${loading ? 'animate-spin' : ''}`} />
            <span>{lang === 'th' ? 'โหลดใหม่' : 'Reload'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-[#6E6763] hover:text-[#3D3835] rounded-xl transition cursor-pointer"
            >
              {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || saving}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#E88D9F] hover:bg-[#D87085] rounded-full shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{lang === 'th' ? 'กำลังบันทึก...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{lang === 'th' ? 'บันทึกการตั้งค่าโมดูล' : 'Save Module Settings'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
