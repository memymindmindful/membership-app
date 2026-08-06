import React, { useState, useRef } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  X,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Key,
  Info,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { Employee, EmployeeRole } from '../types';
import { api } from '../services/api';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStaff: Employee;
  employees: Employee[];
  onRefreshEmployees: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
];

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
  currentStaff,
  employees,
  onRefreshEmployees,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'matrix'>('list');

  // Form State for Add / Edit
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<EmployeeRole>('staff');
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB');
      return;
    }

    setIsUploadingImage(true);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        setAvatarUrl(base64);
        try {
          const uploadedUrl = await api.uploadImage(base64, file.name);
          setAvatarUrl(uploadedUrl);
        } catch {
          // Keep base64 data URL as fallback if server upload API fails
        }
      } catch {
        setErrorMsg('ไม่สามารถประมวลผลไฟล์รูปภาพได้');
      } finally {
        setIsUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
    setShowPassword(true);
  };

  const resetForm = () => {
    setEditingEmp(null);
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setDisplayName('');
    setRole('staff');
    setAvatarUrl(AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)]);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleStartEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setUsername(emp.username);
    setPassword(emp.password || '');
    setShowPassword(false);
    setDisplayName(emp.displayName);
    setRole(emp.role);
    setAvatarUrl(emp.avatarUrl || AVATAR_PRESETS[0]);
    setErrorMsg('');
    setSuccessMsg('');
    setActiveTab('add');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) {
      setErrorMsg('กรุณากรอก Username และ Display Name ให้ครบถ้วน');
      return;
    }

    if (!editingEmp && (!password.trim() || password.trim().length < 4)) {
      setErrorMsg('กรุณากำหนดรหัสผ่าน (Password) อย่างน้อย 4 ตัวอักษร');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (editingEmp) {
        await api.updateEmployee(
          editingEmp.id,
          {
            username,
            displayName,
            role,
            avatarUrl,
            ...(password.trim() ? { password: password.trim() } : {}),
          },
          currentStaff.id,
          currentStaff.displayName
        );
        setSuccessMsg(`อัปเดตข้อมูลพนักงาน "${displayName}" เรียบร้อยแล้ว`);
      } else {
        await api.createEmployee(
          { username, password: password.trim(), displayName, role, avatarUrl },
          currentStaff.id,
          currentStaff.displayName
        );
        setSuccessMsg(`เพิ่มพนักงานใหม่ "${displayName}" (${role.toUpperCase()}) เรียบร้อยแล้ว`);
      }
      onRefreshEmployees();
      setTimeout(() => {
        resetForm();
        setActiveTab('list');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (emp: Employee) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (emp.id === currentStaff.id) {
      setErrorMsg(`ไม่สามารถลบบัญชี "${emp.displayName}" ได้ เนื่องจากเป็นบัญชีที่คุณกำลังล็อกอินใช้งานอยู่ในขณะนี้ หากต้องการลบบัญชีนี้ กรุณาสลับผู้ใช้งานที่แถบเมนูด้านบนเป็นพนักงานท่านอื่นก่อนทำรายการ`);
      return;
    }

    if (!confirm(`ยืนยันการลบบัญชีผู้ใช้งาน "${emp.displayName}" (${emp.role}) ออกจากระบบถาวร?`)) {
      return;
    }

    try {
      setLoading(true);
      await api.deleteEmployee(emp.id, currentStaff.id, currentStaff.displayName);
      await onRefreshEmployees();
      setSuccessMsg(`ลบบัญชีผู้ใช้งาน "${emp.displayName}" ออกจากระบบเรียบร้อยแล้ว (ข้อมูลถูกลบถาวร)`);
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถลบบัญชีผู้ใช้งานได้');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (empRole: EmployeeRole) => {
    switch (empRole) {
      case 'admin':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-[#E88D9F] text-white rounded-full">Admin</span>;
      case 'manager':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-purple-600 text-white rounded-full">Manager</span>;
      case 'accountant':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-blue-600 text-white rounded-full">Accountant</span>;
      case 'staff':
      default:
        return <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-emerald-600 text-white rounded-full">Staff</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-[#F2C2CE] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#F2E3E1] flex items-center justify-between bg-[#FAF0ED]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E88D9F] flex items-center justify-center text-white shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#3D3835]">
                จัดการบัญชีพนักงาน & กำหนดสิทธิ์ผู้ใช้งาน
              </h2>
              <p className="text-xs text-[#6E6763]">
                สร้างบัญชีผู้ใช้งานใหม่ และตรวจสอบตารางเปรียบเทียบสิทธิ์แต่ละ Role
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-3 bg-stone-50 border-b border-[#F2E3E1]">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'list'
                ? 'bg-white text-[#D87085] shadow-xs border border-[#F2C2CE]'
                : 'text-[#6E6763] hover:text-[#3D3835]'
            }`}
          >
            <Users className="w-4 h-4 text-[#E88D9F]" />
            <span>รายชื่อพนักงานทั้งหมด ({employees.length})</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setActiveTab('add');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'add'
                ? 'bg-white text-[#D87085] shadow-xs border border-[#F2C2CE]'
                : 'text-[#6E6763] hover:text-[#3D3835]'
            }`}
          >
            <UserPlus className="w-4 h-4 text-[#E88D9F]" />
            <span>{editingEmp ? 'แก้ไขข้อมูลพนักงาน' : '+ เพิ่มพนักงานใหม่'}</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'matrix'
                ? 'bg-white text-[#D87085] shadow-xs border border-[#F2C2CE]'
                : 'text-[#6E6763] hover:text-[#3D3835]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#E88D9F]" />
            <span>ตารางคำอธิบายสิทธิ์แต่ละ Role</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-600 font-bold text-xs p-1">
                ✕
              </button>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 font-bold text-xs p-1">
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: EMPLOYEES LIST */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#3D3835]">
                  รายการผู้ใช้งานที่ลงทะเบียนในระบบ
                </span>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab('add');
                  }}
                  className="px-3 py-1.5 bg-[#E88D9F] hover:bg-[#D87085] text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>เพิ่มพนักงาน</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {employees.map((emp) => {
                  const isCurrentActive = emp.id === currentStaff.id;
                  return (
                    <div
                      key={emp.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
                        isCurrentActive
                          ? 'bg-[#FFF8F6] border-[#F2C2CE] ring-1 ring-[#E88D9F]/20'
                          : 'bg-[#FAF0ED]/60 border-[#F2E3E1] hover:border-[#F2C2CE]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={emp.avatarUrl || AVATAR_PRESETS[0]}
                          alt={emp.displayName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-xs text-[#3D3835] truncate">
                              {emp.displayName}
                            </h4>
                            {getRoleBadge(emp.role)}
                            {isCurrentActive && (
                              <span className="text-[10px] bg-[#E88D9F]/15 text-[#D87085] border border-[#F2C2CE] px-1.5 py-0.5 rounded-full font-bold">
                                บัญชีที่คุณกำลังใช้อยู่
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-[#6E6763] truncate mt-0.5">
                            Username: <span className="font-bold text-[#3D3835]">{emp.username}</span>
                            {emp.password && (
                              <span className="ml-2 text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded font-mono">
                                PW: {emp.password}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(emp)}
                          className="p-1.5 text-stone-500 hover:text-[#D87085] hover:bg-white rounded-lg transition"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(emp)}
                          className={`p-1.5 rounded-lg transition ${
                            isCurrentActive
                              ? 'text-stone-300 hover:text-red-500 hover:bg-white cursor-pointer'
                              : 'text-stone-400 hover:text-red-600 hover:bg-white'
                          }`}
                          title={isCurrentActive ? 'ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้' : 'ลบบัญชี'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ADD / EDIT EMPLOYEE FORM */}
          {activeTab === 'add' && (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto py-2">
              <div className="bg-[#FAF0ED] p-4 rounded-2xl border border-[#F2E3E1] flex items-center justify-between">
                <span className="text-xs font-bold text-[#3D3835] flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#E88D9F]" />
                  <span>{editingEmp ? 'แก้ไขข้อมูลพนักงาน' : 'สร้างบัญชีผู้ใช้งานพนักงานใหม่'}</span>
                </span>
                {editingEmp && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-[11px] text-[#E88D9F] hover:underline font-bold"
                  >
                    ยกเลิกการแก้ไข
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#3D3835] mb-1">
                    ชื่อผู้ใช้งานสำหรับล็อกอิน (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="เช่น may_manager, joy_therapist"
                    className="w-full px-3.5 py-2 border border-[#F2E3E1] rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    พนักงานจะใช้ชื่อ Username นี้ในการล็อกอินเข้าสู่ระบบ Staff Dashboard
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#3D3835]">
                      รหัสผ่านสำหรับเข้าสู่ระบบ (Password) {editingEmp ? '(กรอกหากต้องการเปลี่ยน)' : '*'}
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[10px] text-[#E88D9F] hover:text-[#D87085] font-bold flex items-center gap-1 hover:underline"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>สุ่มรหัสผ่าน</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingEmp}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingEmp ? 'เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน' : 'เช่น Mmm#8392 หรือ 123456'}
                      className="w-full pl-3.5 pr-10 py-2 border border-[#F2E3E1] rounded-xl text-xs bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">
                    แอดมินกำหนดรหัสผ่านนี้ให้พนักงานล็อกอิน หรือส่งต่อให้พนักงานเข้าใช้งานได้ทันที
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3D3835] mb-1">
                    ชื่อแสดงในระบบ (Display Name / Staff Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="เช่น Khun May (Manager), Khun Joy (Therapist)"
                    className="w-full px-3.5 py-2 border border-[#F2E3E1] rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3D3835] mb-1">
                    เลือกบทบาทและกำหนดสิทธิ์ (Role Selection) *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as EmployeeRole)}
                    className="w-full px-3.5 py-2 border border-[#F2E3E1] rounded-xl text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
                  >
                    <option value="admin">1. Admin (แอดมินสูงสุด - เข้าได้ทุกระบบรวมตั้งค่า)</option>
                    <option value="manager">2. Manager (ผู้จัดการ - ดูแลระบบสมาชิก บัญชี และ Audit Log)</option>
                    <option value="staff">3. Staff (พนักงานหน้าร้าน - ดูแลระบบสมาชิกอย่างเดียว)</option>
                    <option value="accountant">4. Accountant (ฝ่ายบัญชี - ดูแลสรุปรายรับ-รายจ่ายอย่างเดียว)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3D3835] mb-1.5">
                    รูปโปรไฟล์พนักงาน (Staff Avatar)
                  </label>

                  <div className="bg-[#FAF0ED]/60 p-3.5 rounded-2xl border border-[#F2E3E1] space-y-3">
                    <div className="flex items-center gap-4">
                      {/* Avatar Preview */}
                      <div className="relative group shrink-0">
                        <img
                          src={avatarUrl || AVATAR_PRESETS[0]}
                          alt="Avatar Preview"
                          className="w-14 h-14 rounded-full object-cover border-2 border-[#E88D9F] shadow-xs bg-white"
                          referrerPolicy="no-referrer"
                        />
                        {isUploadingImage && (
                          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={isUploadingImage}
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 bg-white hover:bg-[#FAF0ED] text-[#D87085] border border-[#F2C2CE] font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#D87085]" />
                          <span>{isUploadingImage ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพใหม่จากเครื่อง'}</span>
                        </button>
                        <p className="text-[10px] text-stone-400">
                          สามารถเลือกไฟล์รูปภาพ (JPG, PNG, WebP) ขนาดไม่เกิน 5MB
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-[#F2E3E1] pt-2.5">
                      <span className="text-[11px] text-[#6E6763] font-semibold block mb-1.5">
                        หรือเลือกจากรูปภาพสำเร็จรูป (Avatar Presets):
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {AVATAR_PRESETS.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setAvatarUrl(url)}
                            className={`relative rounded-full overflow-hidden border-2 transition ${
                              avatarUrl === url
                                ? 'border-[#E88D9F] ring-2 ring-[#E88D9F]/30 scale-105'
                                : 'border-stone-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={url} alt="preset" className="w-8 h-8 object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#E88D9F] hover:bg-[#D87085] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingEmp ? 'บันทึกการแก้ไข' : 'สร้างบัญชีผู้ใช้'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ROLE PERMISSION MATRIX TABLE */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="bg-[#FAF0ED] p-3.5 rounded-2xl border border-[#F2E3E1] flex items-center gap-2 text-xs">
                <Info className="w-5 h-5 text-[#E88D9F] shrink-0" />
                <p className="text-[#3D3835]">
                  ตารางแสดงขอบเขตสิทธิ์ของแต่ละบทบาท (Role Permission Matrix) ในระบบ Me.My.Mind เพื่อป้องกันพนักงานกดแก้ไขข้อมูลส่วนสำคัญโดยไม่ได้รับอนุญาต
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#F2E3E1] shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF0ED] border-b border-[#F2E3E1] text-[#3D3835] uppercase font-bold text-[11px]">
                    <tr>
                      <th className="p-3">ฟีเจอร์ / ระบบการทำงาน</th>
                      <th className="p-3 text-center bg-[#F2C2CE]/30">Admin</th>
                      <th className="p-3 text-center">Manager</th>
                      <th className="p-3 text-center">Staff</th>
                      <th className="p-3 text-center">Accountant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2E3E1] text-[#3D3835]">
                    {/* Row 1 */}
                    <tr className="hover:bg-[#FAF0ED]/40 transition">
                      <td className="p-3 font-semibold">
                        <div>1. ระบบจัดการสมาชิก & บริการหน้าร้าน</div>
                        <div className="text-[10px] text-[#6E6763]">
                          ดูข้อมูลสมาชิก, ค้นหา, สแกน QR, เติม Coin, ขายแพ็กเกจ/คูปอง, บันทึกบริการ
                        </div>
                      </td>
                      <td className="p-3 text-center bg-[#FAF0ED]/30">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 mr-0.5" /> อนุญาต
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 mr-0.5" /> อนุญาต
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 mr-0.5" /> อนุญาต
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <X className="w-3 h-3 mr-0.5" /> ไม่อนุญาต
                        </span>
                      </td>
                    </tr>

                    {/* Row 2 */}
                    <tr className="hover:bg-[#FAF0ED]/40 transition">
                      <td className="p-3 font-semibold">
                        <div>2. สรุปบัญชี & รายรับ-รายจ่าย (Financial Dashboard)</div>
                        <div className="text-[10px] text-[#6E6763]">
                          ดูสรุปยอดเงิน, กราฟวิเคราะห์, บันทึกรายรับ-รายจ่าย, ส่งออกรายงาน Excel
                        </div>
                      </td>
                      <td className="p-3 text-center bg-[#FAF0ED]/30">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 mr-0.5" /> อนุญาต
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 mr-0.5" /> อนุญาต
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <X className="w-3 h-3 mr-0.5" /> ไม่อนุญาต
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 mr-0.5" /> อนุญาต
                        </span>
                      </td>
                    </tr>

                    {/* Row 3 */}
                    <tr className="hover:bg-[#FAF0ED]/40 transition">
                      <td className="p-3 font-semibold">
                        <div>3. ประวัติและบันทึกการทำงาน (Audit Logs)</div>
                        <div className="text-[10px] text-[#6E6763]">
                          ดูประวัติการทำรายการย้อนหลังของพนักงานทุกคน
                        </div>
                      </td>
                      <td className="p-3 text-center bg-[#FAF0ED]/30">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 mr-0.5" /> อนุญาต
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 mr-0.5" /> อนุญาต
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <X className="w-3 h-3 mr-0.5" /> ไม่อนุญาต
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <X className="w-3 h-3 mr-0.5" /> ไม่อนุญาต
                        </span>
                      </td>
                    </tr>

                    {/* Row 4 */}
                    <tr className="hover:bg-[#FAF0ED]/40 transition">
                      <td className="p-3 font-semibold">
                        <div>4. จัดการแคตตาล็อกบริการ (Edit Catalogue)</div>
                        <div className="text-[10px] text-[#6E6763]">
                          เพิ่ม/แก้ไข/ลบ รายการบริการ, แพ็กเกจคอร์ส, และคูปองสมนาคุณ
                        </div>
                      </td>
                      <td className="p-3 text-center bg-[#FAF0ED]/30">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 mr-0.5" /> Admin เท่านั้น
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <X className="w-3 h-3 mr-0.5" /> ไม่อนุญาต
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <X className="w-3 h-3 mr-0.5" /> ไม่อนุญาต
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <X className="w-3 h-3 mr-0.5" /> ไม่อนุญาต
                        </span>
                      </td>
                    </tr>

                    {/* Row 5 */}
                    <tr className="hover:bg-[#FAF0ED]/40 transition">
                      <td className="p-3 font-semibold">
                        <div>5. ตั้งค่าแอป & จัดการพนักงาน (Brand & Staff Management)</div>
                        <div className="text-[10px] text-[#6E6763]">
                          เปลี่ยนโลโก้/ชื่อร้าน/รูปแอป และ สร้าง/แก้ไข/ลบ บัญชีผู้ใช้งานพนักงาน
                        </div>
                      </td>
                      <td className="p-3 text-center bg-[#FAF0ED]/30">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 mr-0.5" /> Admin เท่านั้น
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <X className="w-3 h-3 mr-0.5" /> ไม่อนุญาต
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <X className="w-3 h-3 mr-0.5" /> ไม่อนุญาต
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <X className="w-3 h-3 mr-0.5" /> ไม่อนุญาต
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
