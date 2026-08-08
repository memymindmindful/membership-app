import React, { useState } from 'react';
import { User, Phone, Calendar, Gift, Check, Sparkles, Loader2, Info, X } from 'lucide-react';
import { Client } from '../types';
import { api } from '../services/api';

interface ProfileSetupModalProps {
  isOpen: boolean;
  client: Client;
  onSaved: (updatedClient: Client) => void;
  onClose?: () => void;
  allowClose?: boolean;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  isOpen,
  client,
  onSaved,
  onClose,
  allowClose = false,
}) => {
  const [phone, setPhone] = useState(client.phone || '');
  const [birthday, setBirthday] = useState(client.birthday || '');
  const [nickname, setNickname] = useState(client.nickname || '');
  const [displayName, setDisplayName] = useState(client.displayName || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMessage('กรุณาระบุเบอร์โทรศัพท์ให้ถูกต้อง (เช่น 0812345678)');
      return;
    }

    if (!birthday) {
      setErrorMessage('กรุณาเลือกวันเกิด เพื่อรับสิทธิประโยชน์เดือนเกิด');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await api.updateClientProfile(client.id, {
        phone: cleanPhone,
        birthday,
        nickname: nickname.trim(),
        displayName: displayName.trim() || client.displayName,
      });

      onSaved(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full flex flex-col border border-[#F2E3E1] overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E88D9F] via-[#DF7B8F] to-[#D87085] text-white p-5 relative">
          {allowClose && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Gift className="w-6 h-6 text-rose-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-white/30">
                  Profile Setup
                </span>
                <Sparkles className="w-3.5 h-3.5 text-rose-100" />
              </div>
              <h2 className="font-serif font-bold text-lg text-white mt-0.5">
                กรอกข้อมูลสมาชิกเพิ่มเติม
              </h2>
              <p className="text-xs text-rose-100 leading-tight">
                รับสิทธิประโยชน์วันเกิดสุดพิเศษ & สะดวกในการใช้บริการที่ร้าน
              </p>
            </div>
          </div>
        </div>

        {/* LINE API Explanatory Banner */}
        <div className="p-4 bg-[#FFF8F7] border-b border-[#F2E3E1] space-y-2">
          <div className="flex items-start gap-2.5 text-xs text-[#6E6763] leading-relaxed">
            <Info className="w-4 h-4 text-[#D87085] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#3D3835] mb-0.5">
                ทำไมต้องกรอกเบอร์โทรและวันเกิด? (Why required?)
              </p>
              <p className="text-[11px] text-[#6E6763]">
                ระบบ LINE Login Standard API ไม่สามารถเข้าถึงเบอร์โทรและวันเกิดของท่านได้โดยตรงตามนโยบาย PDPA
                การระบุข้อมูลตรงนี้จะช่วยให้พนักงานค้นหาประวัติได้รวดเร็วเมื่อมาใช้บริการที่ร้าน และเพื่อรับของขวัญวันเกิดฟรี!
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-white text-xs text-[#3D3835]">
          {errorMessage && (
            <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 font-semibold text-xs animate-shake">
              {errorMessage}
            </div>
          )}

          {/* Member Profile Card Preview */}
          <div className="p-3 bg-[#FAF0ED] rounded-2xl border border-[#F2E3E1] flex items-center gap-3">
            <img
              src={client.profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt={client.displayName}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-2xs shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-[#8C6D5E] font-bold uppercase tracking-wider block">
                LINE Account
              </span>
              <p className="font-serif font-bold text-sm text-[#3D3835] truncate">
                {client.displayName}
              </p>
              <p className="text-[10px] font-mono text-[#6E6763]">
                รหัสสมาชิก: <span className="font-bold text-[#D87085]">{client.memberCode}</span>
              </p>
            </div>
          </div>

          {/* Phone Number Field */}
          <div>
            <label className="block font-bold text-[#3D3835] mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#D87085]" />
                เบอร์โทรศัพท์ (Phone Number) <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-[#A39C98] font-normal">สำหรับค้นหาประวัติที่หน้าร้าน</span>
            </label>
            <input
              type="tel"
              required
              placeholder="08x-xxx-xxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#F2E3E1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E88D9F] font-mono"
            />
          </div>

          {/* Birthday Field */}
          <div>
            <label className="block font-bold text-[#3D3835] mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#D87085]" />
                วัน/เดือน/ปีเกิด (Date of Birth) <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-[#A39C98] font-normal">เพื่อรับสิทธิพิเศษสัปดาห์เกิด</span>
            </label>
            <input
              type="date"
              required
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#F2E3E1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
            />
          </div>

          {/* Nickname Field */}
          <div>
            <label className="block font-bold text-[#3D3835] mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#D87085]" />
                ชื่อเล่นที่ต้องการให้ร้านเรียก (Preferred Name)
              </span>
              <span className="text-[10px] text-[#A39C98] font-normal">ไม่บังคับ</span>
            </label>
            <input
              type="text"
              placeholder="เช่น คุณแอน, คุณมายด์"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF6F2] border border-[#F2E3E1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
            />
          </div>

          {/* Birthday Perk Highlight Box */}
          <div className="p-3 bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl border border-amber-200/60 flex items-start gap-2 text-[11px] text-amber-900 leading-tight">
            <Gift className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">🎁 สิทธิพิเศษเฉพาะสมาชิก Me.My.Mind</p>
              <p className="text-amber-800/80 mt-0.5">
                เมื่อถึงเดือนเกิดของคุณ ระบบจะส่งคูปองส่วนลดพิเศษ / คะแนนโบนัสวันเกิดฟรีให้อัตโนมัติ!
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#E88D9F] via-[#DF7B8F] to-[#D87085] hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังบันทึกข้อมูล...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>บันทึกข้อมูลสมาชิก และเริ่มใช้งาน</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
