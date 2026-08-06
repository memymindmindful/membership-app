import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Mail,
  Calendar,
  Clock,
  HardDrive,
  Download,
  Send,
  Save,
  Check,
  AlertCircle,
  FileText,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';

interface BackupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupSettingsModal: React.FC<BackupSettingsModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('me.my.mind.facialmassage@gmail.com');
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [scheduleTime, setScheduleTime] = useState('00:00');
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState('1'); // 1 = Mon
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState('1');
  const [googleDriveAutoUpload, setGoogleDriveAutoUpload] = useState(true);
  const [googleDriveFolder, setGoogleDriveFolder] = useState('Me.My.Mind_Membership_Backups');
  const [includeClients, setIncludeClients] = useState(true);
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeCatalog, setIncludeCatalog] = useState(true);

  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getBackupSettings();
      if (res) {
        setEmail(res.email || 'me.my.mind.facialmassage@gmail.com');
        setScheduleFrequency(res.scheduleFrequency || 'daily');
        setScheduleTime(res.scheduleTime || '00:00');
        setScheduleDayOfWeek(res.scheduleDayOfWeek || '1');
        setScheduleDayOfMonth(res.scheduleDayOfMonth || '1');
        setGoogleDriveAutoUpload(res.googleDriveAutoUpload !== false);
        setGoogleDriveFolder(res.googleDriveFolder || 'Me.My.Mind_Membership_Backups');
        setIncludeClients(res.includeClients !== false);
        setIncludeTransactions(res.includeTransactions !== false);
        setIncludeCatalog(res.includeCatalog !== false);
        setLastBackupAt(res.lastBackupAt || null);
      }
    } catch (e) {
      console.error('Failed to load backup settings', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      setLoading(true);
      const res = await api.saveBackupSettings({
        email,
        scheduleFrequency,
        scheduleTime,
        scheduleDayOfWeek,
        scheduleDayOfMonth,
        googleDriveAutoUpload,
        googleDriveFolder,
        includeClients,
        includeTransactions,
        includeCatalog,
      });
      setMsg({ type: 'success', text: res.message || 'บันทึกการตั้งค่าสำรองข้อมูลสำเร็จเรียบร้อยแล้ว' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackupJson = async () => {
    try {
      setDownloading(true);
      const data = await api.getBackupExportData();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `MMM_Backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setMsg({ type: 'success', text: 'ดาวน์โหลดไฟล์ JSON สำรองข้อมูลเรียบร้อยแล้ว' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'ไม่สามารถดาวน์โหลดไฟล์สำรองข้อมูลได้' });
    } finally {
      setDownloading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!email) {
      setMsg({ type: 'error', text: 'กรุณากรอกอีเมลผู้รับสำรองข้อมูล' });
      return;
    }
    try {
      setSendingEmail(true);
      setMsg(null);
      const res = await api.sendBackupEmail(email);
      setLastBackupAt(res.timestamp);
      setMsg({ type: 'success', text: res.message || 'ส่งอีเมลรายงานสำรองข้อมูลสำเร็จ!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'ไม่สามารถส่งอีเมลได้' });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-[#F2E3E1] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#D87085] to-[#E88D9F] p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">สำรองข้อมูล & รายงานอัตโนมัติ (Auto-Backup & Reports)</h3>
              <p className="text-xs text-rose-100 mt-0.5">
                ตั้งค่าส่งรายงานอีเมลอัตโนมัติ และอัปโหลดไฟล์ backup ขึ้น Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveSettings} className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Status Bar */}
          <div className="bg-[#FAF0ED] p-3.5 rounded-2xl border border-[#F2E3E1] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#3D3835]">
              <Clock className="w-4 h-4 text-[#D87085]" />
              <span>สำรองข้อมูลล่าสุด:</span>
              <span className="font-bold text-[#D87085]">
                {lastBackupAt ? new Date(lastBackupAt).toLocaleString('th-TH') : 'ยังไม่มีการส่งล่าสุด'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={sendingEmail}
              className="px-3 py-1.5 bg-white hover:bg-rose-50 text-[#D87085] border border-[#F2C2CE] font-bold rounded-xl transition text-[11px] flex items-center gap-1.5"
            >
              {sendingEmail ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังส่ง...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>ส่งรายงานเข้าอีเมลทันที</span>
                </>
              )}
            </button>
          </div>

          {/* Section 1: Target Email */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#3D3835] uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#D87085]" />
              <span>1. อีเมลสำหรับรับรายงาน & ไฟล์สำรองข้อมูล (Recipient Email)</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#3D3835] focus:outline-none focus:ring-2 focus:ring-[#E88D9F] focus:bg-white"
            />
          </div>

          {/* Section 2: Automated Schedule */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <label className="block text-xs font-bold text-[#3D3835] uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D87085]" />
              <span>2. กำหนดรอบเวลาส่งอัตโนมัติ (Automated Backup Schedule)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Frequency buttons */}
              <button
                type="button"
                onClick={() => setScheduleFrequency('daily')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  scheduleFrequency === 'daily'
                    ? 'bg-[#E88D9F] text-white border-[#E88D9F] shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>ทุกวัน (Daily)</span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleFrequency('weekly')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  scheduleFrequency === 'weekly'
                    ? 'bg-[#E88D9F] text-white border-[#E88D9F] shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>ทุกสัปดาห์ (Weekly)</span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleFrequency('monthly')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  scheduleFrequency === 'monthly'
                    ? 'bg-[#E88D9F] text-white border-[#E88D9F] shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>ทุกเดือน (Monthly)</span>
              </button>
            </div>

            {/* Time & Day selectors depending on frequency */}
            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Day Selection if Weekly */}
              {scheduleFrequency === 'weekly' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">เลือกวันในสัปดาห์:</label>
                  <select
                    value={scheduleDayOfWeek}
                    onChange={(e) => setScheduleDayOfWeek(e.target.value)}
                    className="w-full py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#E88D9F]"
                  >
                    <option value="1">ทุกวันจันทร์ (Monday)</option>
                    <option value="2">ทุกวันอังคาร (Tuesday)</option>
                    <option value="3">ทุกวันพุธ (Wednesday)</option>
                    <option value="4">ทุกวันพฤหัสบดี (Thursday)</option>
                    <option value="5">ทุกวันศุกร์ (Friday)</option>
                    <option value="6">ทุกวันเสาร์ (Saturday)</option>
                    <option value="0">ทุกวันอาทิตย์ (Sunday)</option>
                  </select>
                </div>
              )}

              {/* Day Selection if Monthly */}
              {scheduleFrequency === 'monthly' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">เลือกวันที่ของเดือน:</label>
                  <select
                    value={scheduleDayOfMonth}
                    onChange={(e) => setScheduleDayOfMonth(e.target.value)}
                    className="w-full py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#E88D9F]"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        วันที่ {d} ของทุกเดือน
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Time Selector */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">เลือกเวลาดำเนินการ:</label>
                <select
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#E88D9F]"
                >
                  <option value="00:00">00:00 น. (เที่ยงคืน)</option>
                  <option value="06:00">06:00 น. (เช้า)</option>
                  <option value="08:00">08:00 น. (ก่อนเปิดร้าน)</option>
                  <option value="12:00">12:00 น. (เที่ยงวัน)</option>
                  <option value="18:00">18:00 น. (ค่ำ)</option>
                  <option value="22:00">22:00 น. (ปิดร้าน)</option>
                </select>
              </div>

            </div>
          </div>

          {/* Section 3: Google Drive Integration */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#3D3835] uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-600" />
                <span>3. เชื่อมต่ออัปโหลดอัตโนมัติลง Google Drive</span>
              </label>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={googleDriveAutoUpload}
                  onChange={(e) => setGoogleDriveAutoUpload(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {googleDriveAutoUpload && (
              <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">สถานะการเชื่อมต่อ:</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Google Workspace Sync Ready
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-950 mb-1">ชื่อโฟลเดอร์บน Google Drive:</label>
                  <input
                    type="text"
                    value={googleDriveFolder}
                    onChange={(e) => setGoogleDriveFolder(e.target.value)}
                    placeholder="Me.My.Mind_Membership_Backups"
                    className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs text-emerald-950 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-emerald-700">
                  ระบบจะสร้างไฟล์สำรองข้อมูลในชื่อ <span className="font-mono bg-white/80 px-1 py-0.5 rounded border border-emerald-200">MMM_Backup_YYYY-MM-DD.json</span> และบันทึกลงในโฟลเดอร์นี้โดยอัตโนมัติ
                </p>
              </div>
            )}
          </div>

          {/* Messages */}
          {msg && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                msg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {msg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleDownloadBackupJson}
              disabled={downloading}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-gray-600" />
              <span>{downloading ? 'กำลังสร้างไฟล์...' : 'ดาวน์โหลด JSON เก็บไว้ในเครื่อง'}</span>
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
              >
                ปิด
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#E88D9F] hover:bg-[#D87085] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการตั้งค่า</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
