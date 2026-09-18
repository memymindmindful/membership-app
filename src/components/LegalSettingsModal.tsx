import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Building2,
  ShieldCheck,
  FileCheck,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { LegalSettings, AppLanguage } from '../types';
import { api } from '../services/api';

interface LegalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: AppLanguage;
  onSettingsUpdated?: (settings: LegalSettings) => void;
}

const defaultLegalSettings: LegalSettings = {
  businessInfo: {
    businessName: '',
    address: '',
    website: '',
    contactPerson: '',
    email: '',
    phone: '',
    lineId: '',
  },
  pdpa: {
    useCustom: false,
    customTextTh: '',
    customTextEn: '',
  },
  terms: {
    useCustom: false,
    customTextTh: '',
    customTextEn: '',
  },
};

export const LegalSettingsModal: React.FC<LegalSettingsModalProps> = ({
  isOpen,
  onClose,
  lang = 'th',
  onSettingsUpdated,
}) => {
  const [settings, setSettings] = useState<LegalSettings>(defaultLegalSettings);
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
      const res = await api.getLegalSettings();
      if (res) {
        setSettings({
          businessInfo: { ...defaultLegalSettings.businessInfo, ...(res.businessInfo || {}) },
          pdpa: { ...defaultLegalSettings.pdpa, ...(res.pdpa || {}) },
          terms: { ...defaultLegalSettings.terms, ...(res.terms || {}) },
        });
      }
    } catch (err: any) {
      console.error('Failed to load legal settings:', err);
      setStatusMsg({
        type: 'error',
        text: lang === 'th' ? 'ไม่สามารถโหลดการตั้งค่าเอกสารกฎหมายได้' : 'Failed to load legal settings',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessInfoChange = (field: keyof LegalSettings['businessInfo'], value: string) => {
    setSettings((prev) => ({
      ...prev,
      businessInfo: {
        ...prev.businessInfo,
        [field]: value,
      },
    }));
  };

  const handlePdpaToggle = (useCustom: boolean) => {
    setSettings((prev) => ({
      ...prev,
      pdpa: {
        ...prev.pdpa,
        useCustom,
      },
    }));
  };

  const handleTermsToggle = (useCustom: boolean) => {
    setSettings((prev) => ({
      ...prev,
      terms: {
        ...prev.terms,
        useCustom,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatusMsg(null);
      const updated = await api.updateLegalSettings(settings);
      setSettings(updated);
      setStatusMsg({
        type: 'success',
        text: lang === 'th' ? 'บันทึกการตั้งค่าเอกสารกฎหมายเรียบร้อยแล้ว' : 'Legal settings saved successfully',
      });
      if (onSettingsUpdated) {
        onSettingsUpdated(updated);
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to save legal settings:', err);
      setStatusMsg({
        type: 'error',
        text: err.message || (lang === 'th' ? 'เกิดข้อผิดพลาดในการบันทึก' : 'Error saving settings'),
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-[#F2E3E1] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#FAF0ED] flex items-center justify-between shrink-0 bg-gradient-to-r from-[#FAF0ED]/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF0ED] flex items-center justify-center text-[#D87085] shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#3D3835]">
                {lang === 'th' ? 'ตั้งค่าเอกสารกฎหมาย (PDPA / Terms)' : 'Legal Documents Settings'}
              </h3>
              <p className="text-xs text-[#6E6763] mt-0.5">
                {lang === 'th'
                  ? 'จัดการข้อมูลธุรกิจและปรับแต่งนโยบายความเป็นส่วนตัว / ข้อกำหนดการใช้งาน'
                  : 'Manage business identity and customize Privacy Policy / Terms of Use'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6E6763] hover:bg-[#FAF0ED] hover:text-[#3D3835] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
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
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-500">
              <Loader2 className="w-6 h-6 animate-spin text-[#E88D9F]" />
              <p className="text-xs">{lang === 'th' ? 'กำลังโหลดข้อมูล...' : 'Loading settings...'}</p>
            </div>
          ) : (
            <>
              {/* Section A: Business Information */}
              <div className="bg-[#FAF0ED]/40 border border-[#F2E3E1] rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#F2E3E1]">
                  <Building2 className="w-4 h-4 text-[#D87085]" />
                  <h4 className="font-bold text-sm text-[#3D3835]">
                    {lang === 'th' ? 'ข้อมูลธุรกิจ (Business Information)' : 'Business Information'}
                  </h4>
                </div>
                <p className="text-[11px] text-[#6E6763] leading-relaxed">
                  {lang === 'th'
                    ? 'ข้อมูลนี้จะถูกนำไปแสดงในเอกสาร PDPA และ Terms of Use แทนที่ข้อมูลตัวอย่าง หากไม่กรอกระบบจะแสดงเป็นขีด (-) หรือชื่อทั่วไป'
                    : 'This info will be displayed in PDPA and Terms of Use documents replacing placeholder details.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6763] mb-1">
                      {lang === 'th' ? 'ชื่อธุรกิจ / นิติบุคคล' : 'Business Name'}
                    </label>
                    <input
                      type="text"
                      value={settings.businessInfo.businessName}
                      onChange={(e) => handleBusinessInfoChange('businessName', e.target.value)}
                      placeholder={lang === 'th' ? 'เช่น Me.My.Mind Mindfulness Studio' : 'e.g. My Wellness Studio'}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#EBE4E0] rounded-xl text-[#3D3835] focus:outline-none focus:border-[#E88D9F] focus:ring-1 focus:ring-[#E88D9F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6763] mb-1">
                      {lang === 'th' ? 'ชื่อผู้ติดต่อ / ผู้ควบคุมข้อมูล' : 'Contact Person'}
                    </label>
                    <input
                      type="text"
                      value={settings.businessInfo.contactPerson}
                      onChange={(e) => handleBusinessInfoChange('contactPerson', e.target.value)}
                      placeholder={lang === 'th' ? 'เช่น สุภาภิชญ์ ทรายแก้ว' : 'e.g. Supapit Saikaew'}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#EBE4E0] rounded-xl text-[#3D3835] focus:outline-none focus:border-[#E88D9F] focus:ring-1 focus:ring-[#E88D9F]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-[#6E6763] mb-1">
                      {lang === 'th' ? 'ที่อยู่สถานประกอบการ' : 'Address'}
                    </label>
                    <input
                      type="text"
                      value={settings.businessInfo.address}
                      onChange={(e) => handleBusinessInfoChange('address', e.target.value)}
                      placeholder={lang === 'th' ? 'เช่น 43/2 ม.1 ต.วัดไทรย์ อ.เมือง นครสวรรค์' : 'e.g. 123 Sukhumvit Rd, Bangkok'}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#EBE4E0] rounded-xl text-[#3D3835] focus:outline-none focus:border-[#E88D9F] focus:ring-1 focus:ring-[#E88D9F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6763] mb-1">
                      {lang === 'th' ? 'เว็บไซต์' : 'Website'}
                    </label>
                    <input
                      type="text"
                      value={settings.businessInfo.website}
                      onChange={(e) => handleBusinessInfoChange('website', e.target.value)}
                      placeholder="e.g. www.me-my-mind.com"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#EBE4E0] rounded-xl text-[#3D3835] focus:outline-none focus:border-[#E88D9F] focus:ring-1 focus:ring-[#E88D9F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6763] mb-1">
                      {lang === 'th' ? 'อีเมลสำหรับติดต่อ' : 'Email'}
                    </label>
                    <input
                      type="email"
                      value={settings.businessInfo.email}
                      onChange={(e) => handleBusinessInfoChange('email', e.target.value)}
                      placeholder="e.g. contact@example.com"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#EBE4E0] rounded-xl text-[#3D3835] focus:outline-none focus:border-[#E88D9F] focus:ring-1 focus:ring-[#E88D9F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6763] mb-1">
                      {lang === 'th' ? 'เบอร์โทรศัพท์' : 'Phone'}
                    </label>
                    <input
                      type="text"
                      value={settings.businessInfo.phone}
                      onChange={(e) => handleBusinessInfoChange('phone', e.target.value)}
                      placeholder="e.g. 084-974-1697"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#EBE4E0] rounded-xl text-[#3D3835] focus:outline-none focus:border-[#E88D9F] focus:ring-1 focus:ring-[#E88D9F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6763] mb-1">
                      {lang === 'th' ? 'LINE ID / LINE Official' : 'LINE ID'}
                    </label>
                    <input
                      type="text"
                      value={settings.businessInfo.lineId}
                      onChange={(e) => handleBusinessInfoChange('lineId', e.target.value)}
                      placeholder="e.g. @me.my.mind.mindful"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#EBE4E0] rounded-xl text-[#3D3835] focus:outline-none focus:border-[#E88D9F] focus:ring-1 focus:ring-[#E88D9F]"
                    />
                  </div>
                </div>
              </div>

              {/* Section B: PDPA Privacy Policy */}
              <div className="bg-white border border-[#F2E3E1] rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#FAF0ED]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#D87085]" />
                    <h4 className="font-bold text-sm text-[#3D3835]">
                      {lang === 'th' ? 'นโยบายความเป็นส่วนตัว (PDPA)' : 'Privacy Policy (PDPA)'}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      settings.pdpa.useCustom
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {settings.pdpa.useCustom
                      ? (lang === 'th' ? 'เขียนเนื้อหาเอง' : 'Custom Text')
                      : (lang === 'th' ? 'เทมเพลตมาตรฐาน' : 'Standard Template')}
                  </span>
                </div>

                {/* Toggle selection */}
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pdpaMode"
                      checked={!settings.pdpa.useCustom}
                      onChange={() => handlePdpaToggle(false)}
                      className="text-[#E88D9F] focus:ring-[#E88D9F]"
                    />
                    <span className="text-[#3D3835] font-medium">
                      {lang === 'th' ? 'ใช้เทมเพลตมาตรฐาน (แนะนำ)' : 'Use standard template (Recommended)'}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pdpaMode"
                      checked={settings.pdpa.useCustom}
                      onChange={() => handlePdpaToggle(true)}
                      className="text-[#E88D9F] focus:ring-[#E88D9F]"
                    />
                    <span className="text-[#3D3835] font-medium">
                      {lang === 'th' ? 'เขียนเนื้อหาเองทั้งหมด' : 'Write custom policy'}
                    </span>
                  </label>
                </div>

                {settings.pdpa.useCustom && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6763] mb-1">
                        {lang === 'th' ? 'เนื้อหานโยบายความเป็นส่วนตัว (ภาษาไทย)' : 'Privacy Policy Content (Thai)'}
                      </label>
                      <textarea
                        rows={6}
                        value={settings.pdpa.customTextTh}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            pdpa: { ...prev.pdpa, customTextTh: e.target.value },
                          }))
                        }
                        placeholder={lang === 'th' ? 'กรอกข้อความนโยบายความเป็นส่วนตัวภาษาไทย...' : 'Enter Thai privacy policy...'}
                        className="w-full px-3 py-2 text-xs border border-[#EBE4E0] rounded-xl text-[#3D3835] focus:outline-none focus:border-[#E88D9F] focus:ring-1 focus:ring-[#E88D9F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6763] mb-1">
                        {lang === 'th' ? 'เนื้อหานโยบายความเป็นส่วนตัว (English)' : 'Privacy Policy Content (English)'}
                      </label>
                      <textarea
                        rows={6}
                        value={settings.pdpa.customTextEn}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            pdpa: { ...prev.pdpa, customTextEn: e.target.value },
                          }))
                        }
                        placeholder="Enter English privacy policy text..."
                        className="w-full px-3 py-2 text-xs border border-[#EBE4E0] rounded-xl text-[#3D3835] focus:outline-none focus:border-[#E88D9F] focus:ring-1 focus:ring-[#E88D9F]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section C: Terms of Use */}
              <div className="bg-white border border-[#F2E3E1] rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#FAF0ED]">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#D87085]" />
                    <h4 className="font-bold text-sm text-[#3D3835]">
                      {lang === 'th' ? 'ข้อกำหนดการใช้งาน (Terms of Use)' : 'Terms of Use'}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      settings.terms.useCustom
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {settings.terms.useCustom
                      ? (lang === 'th' ? 'เขียนเนื้อหาเอง' : 'Custom Text')
                      : (lang === 'th' ? 'เทมเพลตมาตรฐาน' : 'Standard Template')}
                  </span>
                </div>

                {/* Toggle selection */}
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="termsMode"
                      checked={!settings.terms.useCustom}
                      onChange={() => handleTermsToggle(false)}
                      className="text-[#E88D9F] focus:ring-[#E88D9F]"
                    />
                    <span className="text-[#3D3835] font-medium">
                      {lang === 'th' ? 'ใช้เทมเพลตมาตรฐาน (แนะนำ)' : 'Use standard template (Recommended)'}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="termsMode"
                      checked={settings.terms.useCustom}
                      onChange={() => handleTermsToggle(true)}
                      className="text-[#E88D9F] focus:ring-[#E88D9F]"
                    />
                    <span className="text-[#3D3835] font-medium">
                      {lang === 'th' ? 'เขียนเนื้อหาเองทั้งหมด' : 'Write custom terms'}
                    </span>
                  </label>
                </div>

                {settings.terms.useCustom && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6763] mb-1">
                        {lang === 'th' ? 'ข้อกำหนดการใช้งาน (ภาษาไทย)' : 'Terms of Use Content (Thai)'}
                      </label>
                      <textarea
                        rows={6}
                        value={settings.terms.customTextTh}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            terms: { ...prev.terms, customTextTh: e.target.value },
                          }))
                        }
                        placeholder={lang === 'th' ? 'กรอกข้อกำหนดการใช้งานภาษาไทย...' : 'Enter Thai terms of use...'}
                        className="w-full px-3 py-2 text-xs border border-[#EBE4E0] rounded-xl text-[#3D3835] focus:outline-none focus:border-[#E88D9F] focus:ring-1 focus:ring-[#E88D9F]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6E6763] mb-1">
                        {lang === 'th' ? 'ข้อกำหนดการใช้งาน (English)' : 'Terms of Use Content (English)'}
                      </label>
                      <textarea
                        rows={6}
                        value={settings.terms.customTextEn}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            terms: { ...prev.terms, customTextEn: e.target.value },
                          }))
                        }
                        placeholder="Enter English terms of use text..."
                        className="w-full px-3 py-2 text-xs border border-[#EBE4E0] rounded-xl text-[#3D3835] focus:outline-none focus:border-[#E88D9F] focus:ring-1 focus:ring-[#E88D9F]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-[#FAF0ED] flex items-center justify-between gap-2 shrink-0 bg-white">
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
                  <span>{lang === 'th' ? 'บันทึกการตั้งค่าเอกสารกฎหมาย' : 'Save Legal Settings'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
