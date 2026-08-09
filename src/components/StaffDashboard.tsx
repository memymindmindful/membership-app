import React, { useState } from 'react';
import {
  Search,
  Camera,
  UserPlus,
  Coins,
  Award,
  Package,
  Ticket,
  Clock,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  History,
  ShieldCheck,
  User,
  Phone,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  BookOpen,
  Settings,
  Upload,
  RefreshCw,
  Image as ImageIcon,
  DollarSign,
  PieChart,
  Users,
  KeyRound,
  Edit3,
  Save,
  FileSpreadsheet,
  Database,
  Lock,
  Trash2,
} from 'lucide-react';
import appLogo from '../assets/images/me_my_mind_logo_1785924412256.jpg';
import { FinancialDashboard } from './FinancialDashboard';
import { StaffManagementModal } from './StaffManagementModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ExportClientsModal } from './ExportClientsModal';
import { FactoryResetModal } from './FactoryResetModal';
import { BackupSettingsModal } from './BackupSettingsModal';
import { ExpiringAlertTasks } from './ExpiringAlertTasks';
import {
  AppLanguage,
  CatalogItem,
  Client,
  ClientCoupon,
  ClientPackage,
  CoinTransaction,
  Employee,
  EmployeeRole,
  PointsTransaction,
  PointsWallet,
  BrandSettings,
  BAHT_PER_POINT,
} from '../types';
import { translations, formatDate, formatShortDate, formatCurrency, translateTxNote } from '../lib/translations';
import { api, FullClientData } from '../services/api';
import { ConfirmationModal } from './ConfirmationModal';
import { QrScannerModal } from './QrScannerModal';

interface StaffDashboardProps {
  currentStaff: Employee | null;
  setCurrentStaff: (staff: Employee | null) => void;
  employees: Employee[];
  allClients: Client[];
  selectedClientData: FullClientData | null;
  onSelectClient: (clientId: string) => void;
  catalogItems: CatalogItem[];
  lang: AppLanguage;
  brandSettings?: BrandSettings;
  onUpdateBrandSettings?: (newSettings: BrandSettings) => void;
  onRefreshClient: () => void;
  onRefreshEmployees?: () => void;
  onOpenCatalog: () => void;
  onOpenAuditLogs: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  currentStaff,
  setCurrentStaff,
  employees,
  allClients,
  selectedClientData,
  onSelectClient,
  catalogItems,
  lang,
  brandSettings,
  onUpdateBrandSettings,
  onRefreshClient,
  onRefreshEmployees,
  onOpenCatalog,
  onOpenAuditLogs,
}) => {
  const t = translations[lang];

  // Primary Navigation Tab State: 'client_ops' | 'financial'
  const [activeTab, setActiveTab] = useState<'client_ops' | 'financial'>('client_ops');

  // Staff Login Modal State
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Staff Management, Export & Password Modals State
  const [isStaffManagementOpen, setIsStaffManagementOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFactoryResetOpen, setIsFactoryResetOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);

  // Staff Note Editing State
  const [isEditingStaffNote, setIsEditingStaffNote] = useState(false);
  const [staffNoteInput, setStaffNoteInput] = useState('');
  const [isSavingStaffNote, setIsSavingStaffNote] = useState(false);

  const handleSaveStaffNote = async () => {
    if (!selectedClientData) return;
    setIsSavingStaffNote(true);
    try {
      await api.updateClientNotes(
        selectedClientData.client.id,
        staffNoteInput,
        currentStaff.id,
        currentStaff.displayName
      );
      onRefreshClient();
      setIsEditingStaffNote(false);
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถบันทึก Staff Note ได้');
    } finally {
      setIsSavingStaffNote(false);
    }
  };

  // App Branding & Logo Customization Modal State
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editBrandName, setEditBrandName] = useState('');
  const [editBrandTagline, setEditBrandTagline] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editPromoPosterUrl, setEditPromoPosterUrl] = useState('');
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [posterUploadError, setPosterUploadError] = useState<string | null>(null);

  const handleOpenBrandModal = () => {
    setEditBrandName(brandSettings?.brandName || 'Me.My.Mind Membership');
    setEditBrandTagline(brandSettings?.brandTagline || 'Your Daily Ritual of Self-Love');
    setEditLogoUrl(brandSettings?.logoUrl || appLogo);
    setEditPromoPosterUrl(brandSettings?.promoPosterUrl || '');
    setLogoUploadError(null);
    setPosterUploadError(null);
    setShowBrandModal(true);
  };

  const handlePosterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setPosterUploadError('ขนาดไฟล์โปสเตอร์ต้องไม่เกิน 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditPromoPosterUrl(reader.result);
        setPosterUploadError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadError('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditLogoUrl(reader.result);
        setLogoUploadError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBrandSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateBrandSettings) {
      onUpdateBrandSettings({
        brandName: editBrandName.trim() || 'Me.My.Mind Membership',
        brandTagline: editBrandTagline.trim() || 'Your Daily Ritual of Self-Love',
        logoUrl: editLogoUrl || appLogo,
        promoPosterUrl: editPromoPosterUrl.trim(),
      });
    }
    setShowBrandModal(false);
  };

  // Search & Camera QR State
  const [searchQuery, setSearchQuery] = useState('');
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  // New Client Creation State
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientNickname, setNewClientNickname] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientBirthday, setNewClientBirthday] = useState('');
  const [newClientNotes, setNewClientNotes] = useState('');

  // Action Modals State
  const [activeModal, setActiveModal] = useState<
    'add_coin' | 'deduct_coin' | 'add_pts' | 'deduct_pts' | 'sell_pkg' | 'issue_cpn' | 'reverse_tx' | null
  >(null);

  // Action Fields
  const [coinAmount, setCoinAmount] = useState<number | ''>(1000);
  const [isBonusCoin, setIsBonusCoin] = useState<boolean>(false);
  const [usedServiceName, setUsedServiceName] = useState('');
  const [actionNote, setActionNote] = useState('');

  const [pointsAmount, setPointsAmount] = useState<number | ''>(100);
  const [ptsServiceName, setPtsServiceName] = useState('');
  const [ptsSpendAmount, setPtsSpendAmount] = useState<number | ''>('');
  const [ptsRedeemTierItem, setPtsRedeemTierItem] = useState('');
  const [ptsPaymentMethod, setPtsPaymentMethod] = useState('เงินสดหน้างาน (Cash Direct)');

  // Package / Coupon Issuance Fields
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [customSessions, setCustomSessions] = useState<number | ''>(10);
  const [customQuantity, setCustomQuantity] = useState<number | ''>(1);
  const [customPrice, setCustomPrice] = useState<number | ''>(0);
  const [customValidity, setCustomValidity] = useState<number | ''>(90);

  // Reversal
  const [targetTxId, setTargetTxId] = useState<string>('');
  const [targetTxCategory, setTargetTxCategory] = useState<'coin' | 'points'>('coin');
  const [reversalReason, setReversalReason] = useState('');

  // Single Session / Unit Usage Confirmation Modal
  const [useTargetItem, setUseTargetItem] = useState<{
    type: 'package' | 'coupon';
    id: string;
    name: string;
    code?: string;
  } | null>(null);

  // Filter clients by search query
  const filteredClients = allClients.filter(
    (c) =>
      c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.memberCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Permission derivation based on current logged in staff role
  const role = currentStaff?.role || 'staff';
  const canEditCatalog = role === 'admin';
  const canManageBrand = role === 'admin';
  const canViewAuditLogs = role === 'admin' || role === 'manager';
  const canAccessClientOps = role === 'admin' || role === 'manager' || role === 'staff';
  const canAccessFinancial = role === 'admin' || role === 'manager' || role === 'accountant';

  // Automatically enforce accessible activeTab whenever currentStaff or role changes
  React.useEffect(() => {
    if (currentStaff) {
      if (!canAccessClientOps && canAccessFinancial) {
        setActiveTab('financial');
      } else if (canAccessClientOps && !canAccessFinancial) {
        setActiveTab('client_ops');
      }
    }
  }, [currentStaff?.id, currentStaff?.role, canAccessClientOps, canAccessFinancial]);

  // Handle Staff Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await api.verifyStaffPin(loginPassword, loginUsername);
      if (res.staff) {
        setCurrentStaff(res.staff);
      } else {
        const found = employees.find((emp) => emp.username.toLowerCase() === loginUsername.trim().toLowerCase());
        if (found) setCurrentStaff(found);
      }
    } catch (err: any) {
      setLoginError(err.message || 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านของคุณอีกครั้ง');
    }
  };

  // STAFF LOGIN SCREEN (IF NOT LOGGED IN)
  if (!currentStaff) {
    return (
      <div className="min-h-screen bg-[#FAF6F2] flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-3xl shadow-lg border border-[#F2E3E1] space-y-6">
          <div className="text-center space-y-2">
            <img
              src={brandSettings?.logoUrl || appLogo}
              alt="Me.My.Mind Logo"
              className="w-20 h-20 rounded-full object-cover border-2 border-[#E88D9F] shadow-sm mx-auto"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-xl font-serif font-bold text-[#3D3835]">{t.staffDashboardTitle}</h1>
            <p className="text-xs text-[#6E6763]">เข้าสู่ระบบสำหรับพนักงาน (Staff Portal Sign In)</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 pt-2">
            {loginError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3D3835] mb-1">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin / manager / staff / accountant"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#F2E3E1] rounded-xl text-sm text-[#3D3835] focus:outline-none focus:ring-2 focus:ring-[#E88D9F] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3D3835] mb-1">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านเพื่อเข้าสู่ระบบ"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#F2E3E1] rounded-xl text-sm text-[#3D3835] focus:outline-none focus:ring-2 focus:ring-[#E88D9F] focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#E88D9F] hover:bg-[#D87085] text-white font-bold text-sm rounded-full shadow-md transition flex items-center justify-center gap-2 mt-2"
            >
              <Lock className="w-4 h-4" />
              <span>เข้าสู่ระบบ (Sign In)</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Create Client Submit Handler
  const handleCreateClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    try {
      const created = await api.createClient(
        {
          displayName: newClientName.trim(),
          nickname: newClientNickname.trim(),
          phone: newClientPhone.trim(),
          birthday: newClientBirthday || undefined,
          notes: newClientNotes.trim(),
        },
        currentStaff.id,
        currentStaff.displayName
      );

      setShowCreateClientModal(false);
      setNewClientName('');
      setNewClientNickname('');
      setNewClientPhone('');
      setNewClientBirthday('');
      setNewClientNotes('');
      onSelectClient(created.id);
    } catch (err: any) {
      alert(lang === 'th' ? `เกิดข้อผิดพลาดในการสร้างบัญชีลูกค้า: ${err.message}` : `Error creating client: ${err.message}`);
    }
  };

  // Catalog Item Selection Change Handler
  const handleCatalogSelectChange = (catId: string) => {
    setSelectedCatalogId(catId);
    const found = catalogItems.find((c) => c.id === catId);
    if (found) {
      setCustomPrice(found.price);
      setCustomValidity(found.validityDays);
      if (found.type === 'package') {
        setCustomSessions(found.defaultSessions || 10);
      } else {
        setCustomQuantity(1);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Staff Control Action Header Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#F2E3E1] shadow-2xs flex flex-wrap items-center justify-between gap-3 relative">
        {/* Left / Primary Quick Actions (Highlighted prominently) */}
        {canAccessClientOps && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsQrScannerOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#E88D9F] hover:bg-[#D87085] text-white text-xs font-bold rounded-xl shadow-2xs transition transform active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>{t.scanQrBtn}</span>
            </button>

            <button
              onClick={() => setShowCreateClientModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#E88D9F] hover:bg-[#D87085] text-white text-xs font-bold rounded-xl shadow-2xs transition transform active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t.addNewClientBtn}</span>
            </button>
          </div>
        )}

        {/* Right / Management & Settings Dropdown Menu */}
        <div className="relative ml-auto">
          <button
            onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FAF0ED] hover:bg-[#F2E3E1] text-[#3D3835] text-xs font-bold rounded-xl border border-[#F2E3E1] transition shadow-2xs"
          >
            <Settings className="w-4 h-4 text-[#D87085]" />
            <span>{lang === 'th' ? 'การจัดการระบบ & ตั้งค่า' : 'Management & Settings'}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#6E6763] transition-transform duration-200 ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu Overlay */}
          {isToolsMenuOpen && (
            <>
              {/* Backdrop to close menu when clicking outside */}
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsToolsMenuOpen(false)}
              />

              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#F2E3E1] z-30 p-2 space-y-1.5 divide-y divide-[#FAF0ED]">
                {/* Section 1: Operations & Catalog */}
                <div className="p-1.5 space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-[#A89F91] uppercase tracking-wider">
                    {lang === 'th' ? 'ข้อมูล & งานบริการ' : 'Services & Reports'}
                  </div>

                  {canEditCatalog && (
                    <button
                      onClick={() => {
                        onOpenCatalog();
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#3D3835] hover:bg-[#FAF0ED] hover:text-[#D87085] rounded-xl transition text-left"
                    >
                      <BookOpen className="w-4 h-4 text-[#D87085] shrink-0" />
                      <span>{t.viewCatalogBtn}</span>
                    </button>
                  )}

                  {canViewAuditLogs && (
                    <button
                      onClick={() => {
                        onOpenAuditLogs();
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#3D3835] hover:bg-[#FAF0ED] hover:text-[#D87085] rounded-xl transition text-left"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#D87085] shrink-0" />
                      <span>{t.viewAuditLogBtn}</span>
                    </button>
                  )}

                  {(role === 'admin' || role === 'manager') && (
                    <button
                      onClick={() => {
                        setIsExportModalOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#3D3835] hover:bg-[#FAF0ED] hover:text-[#D87085] rounded-xl transition text-left"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#D87085] shrink-0" />
                      <span>Export ข้อมูลลูกค้า (Excel)</span>
                    </button>
                  )}
                </div>

                {/* Section 2: Management & Roles */}
                <div className="p-1.5 pt-2 space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-[#A89F91] uppercase tracking-wider">
                    {lang === 'th' ? 'จัดการระบบ & สิทธิ์' : 'Admin & Permissions'}
                  </div>

                  {canManageBrand && (
                    <>
                      <button
                        onClick={() => {
                          setIsStaffManagementOpen(true);
                          setIsToolsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#3D3835] hover:bg-[#FAF0ED] hover:text-[#D87085] rounded-xl transition text-left"
                      >
                        <Users className="w-4 h-4 text-[#D87085] shrink-0" />
                        <span>{lang === 'th' ? 'จัดการบัญชีพนักงาน & สิทธิ์' : 'Staff & Roles'}</span>
                      </button>

                      <button
                        onClick={() => {
                          handleOpenBrandModal();
                          setIsToolsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#3D3835] hover:bg-[#FAF0ED] hover:text-[#D87085] rounded-xl transition text-left"
                      >
                        <Settings className="w-4 h-4 text-[#D87085] shrink-0" />
                        <span>{lang === 'th' ? 'ตั้งค่าโลโก้ & ชื่อแอป' : 'Brand Settings'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsBackupModalOpen(true);
                          setIsToolsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#3D3835] hover:bg-[#FAF0ED] hover:text-[#D87085] rounded-xl transition text-left"
                      >
                        <Database className="w-4 h-4 text-[#D87085] shrink-0" />
                        <span>{lang === 'th' ? 'สำรองข้อมูล & รายงานอัตโนมัติ' : 'Auto Backup & Reports'}</span>
                      </button>
                    </>
                  )}

                  {/* Admin Only: Factory Reset / Data Purge Button */}
                  {role === 'admin' && (
                    <button
                      onClick={() => {
                        setIsFactoryResetOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-xl transition text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <RotateCcw className="w-4 h-4 text-rose-600 shrink-0 group-hover:rotate-180 transition-transform duration-300" />
                        <span className="font-bold">{lang === 'th' ? 'ล้างข้อมูลระบบ (Factory Reset)' : 'Factory Reset Data'}</span>
                      </div>
                      <span className="text-[9px] bg-rose-100 text-rose-700 font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                        Admin
                      </span>
                    </button>
                  )}

                  {currentStaff && (
                    <button
                      onClick={() => {
                        setIsChangePasswordOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#3D3835] hover:bg-[#FAF0ED] hover:text-[#D87085] rounded-xl transition text-left"
                    >
                      <KeyRound className="w-4 h-4 text-[#D87085] shrink-0" />
                      <span>{lang === 'th' ? 'เปลี่ยนรหัสผ่านส่วนตัว' : 'Change Password'}</span>
                    </button>
                  )}
                </div>

                {/* Staff Role Badge Info */}
                <div className="px-3 py-2 bg-[#FAF0ED] rounded-xl text-[11px] text-[#6E6763] flex items-center justify-between">
                  <span>สิทธิ์ปัจจุบัน:</span>
                  <span className="font-bold text-[#D87085] bg-white px-2 py-0.5 rounded-md border border-[#F2C2CE] uppercase text-[10px]">
                    {role}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Primary Tab Switcher Bar */}
      {canAccessClientOps && canAccessFinancial ? (
        <div className="flex items-center gap-2 bg-[#FAF0ED] p-1.5 rounded-2xl border border-[#F2E3E1]">
          <button
            onClick={() => setActiveTab('client_ops')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'client_ops'
                ? 'bg-white text-[#D87085] shadow-xs border border-[#F2C2CE]'
                : 'text-[#6E6763] hover:text-[#3D3835]'
            }`}
          >
            <User className="w-4 h-4 text-[#E88D9F]" />
            <span>ระบบจัดการสมาชิก & บริการหน้าร้าน (Client & Operations)</span>
          </button>

          <button
            onClick={() => setActiveTab('financial')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'financial'
                ? 'bg-white text-[#D87085] shadow-xs border border-[#F2C2CE]'
                : 'text-[#6E6763] hover:text-[#3D3835]'
            }`}
          >
            <PieChart className="w-4 h-4 text-[#E88D9F]" />
            <span>สรุปบัญชี & รายรับ-รายจ่าย (Financial Dashboard)</span>
          </button>
        </div>
      ) : (
        <div className="bg-[#FAF0ED] px-4 py-2.5 rounded-2xl border border-[#F2E3E1] flex items-center justify-between text-xs">
          <span className="font-bold text-[#3D3835] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E88D9F] animate-pulse" />
            <span>
              {role === 'staff'
                ? 'เข้าใช้งานในบทบาท: พนักงานหน้าร้าน (Staff View - ระบบจัดการสมาชิกเท่านั้น)'
                : role === 'accountant'
                ? 'เข้าใช้งานในบทบาท: ฝ่ายบัญชี (Accountant View - สรุปบัญชี รายรับ-รายจ่ายเท่านั้น)'
                : 'เข้าใช้งานในบทบาทจำกัดสิทธิ์'}
            </span>
          </span>
          <span className="text-[11px] font-mono font-bold text-[#D87085] bg-white px-2.5 py-1 rounded-lg border border-[#F2C2CE]">
            Role: {role.toUpperCase()}
          </span>
        </div>
      )}

      {activeTab === 'financial' ? (
        <FinancialDashboard currentStaff={currentStaff || { id: 'EMP-01', username: 'staff', displayName: 'Staff', role: 'staff' }} lang={lang} />
      ) : (
      <div className="space-y-6">
        {/* EXPIRING PACKAGES & VOUCHERS ALERT TASK BOARD */}
        <ExpiringAlertTasks
          currentStaff={currentStaff || { id: 'EMP-01', username: 'staff', displayName: 'Staff', role: 'staff' }}
          onSelectClient={onSelectClient}
          onRefreshData={() => {
            if (selectedClientData) {
              onSelectClient(selectedClientData.client.id);
            }
          }}
        />

        {/* Main Workspace Layout: Left Sidebar Client Search, Right Main Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Client Search & Selection (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                {t.clientLookupTitle}
              </h2>
              {(role === 'admin' || role === 'manager') && (
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="text-[11px] font-semibold text-[#3D3835] bg-[#FAF0ED] hover:bg-[#F2E3E1] border border-[#F2E3E1] px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  title="ส่งออกข้อมูลลูกค้าเป็น Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#D87085]" />
                  <span>Export Excel</span>
                </button>
              )}
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
              />
            </div>

            {/* Client List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredClients.length === 0 ? (
                <p className="text-xs text-stone-400 py-6 text-center">No clients match your search query</p>
              ) : (
                filteredClients.map((client) => {
                  const isSelected = selectedClientData?.client.id === client.id;
                  return (
                    <button
                      key={client.id}
                      onClick={() => onSelectClient(client.id)}
                      className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#FAF0ED] border-[#E88D9F] shadow-2xs'
                          : 'bg-white border-[#F2E3E1] hover:bg-[#FAF0ED]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={client.profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={client.displayName}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-stone-300"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-stone-800 truncate">{client.displayName}</p>
                          <p className="text-[11px] font-mono text-amber-900 font-semibold">{client.memberCode}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-mono">
                          {client.phone}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Client Profile Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedClientData ? (
            <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center text-stone-400 space-y-2">
              <User className="w-12 h-12 text-stone-300 mx-auto" />
              <p className="text-sm font-medium">Select a client from the search list or scan Member QR code</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in">
              {/* Client Profile Header Card */}
              <div className="bg-gradient-to-r from-white via-[#FAF0ED]/60 to-white p-5 rounded-2xl border border-[#F2E3E1] shadow-2xs space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedClientData.client.profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                      alt={selectedClientData.client.displayName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#E88D9F] shadow-xs"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold font-serif text-[#D87085] flex items-center gap-1.5">
                          {selectedClientData.client.displayName}
                          <Sparkles className="w-4 h-4 text-[#E88D9F]" />
                        </h2>
                        {selectedClientData.client.nickname && (
                          <span className="text-xs bg-[#FAF0ED] text-[#D87085] px-2.5 py-0.5 rounded-full font-semibold border border-[#F2E3E1]">
                            "{selectedClientData.client.nickname}"
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 mt-1.5 font-mono">
                        <span className="font-bold text-[#D87085] bg-[#FAF0ED] px-2.5 py-0.5 rounded-md border border-[#F2E3E1]">
                          {selectedClientData.client.memberCode}
                        </span>
                        <span className="flex items-center gap-1 text-[#6E6763]">
                          <Phone className="w-3.5 h-3.5 text-[#D87085]" />
                          {selectedClientData.client.phone}
                        </span>
                        {selectedClientData.client.birthday && (
                          <span className="flex items-center gap-1 text-[#6E6763]">
                            <Calendar className="w-3.5 h-3.5 text-[#D87085]" />
                            {selectedClientData.client.birthday}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* LINE Connected Badge */}
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-pink-50 text-[#D87085] px-3 py-1 rounded-full border border-pink-200">
                      <span className="w-2 h-2 rounded-full bg-[#E88D9F] animate-pulse" />
                      {t.lineConnected}
                    </span>
                    <p className="text-[10px] text-[#9C948E] mt-1">
                      {t.registeredOn}: {formatShortDate(selectedClientData.client.createdAt, lang)}
                    </p>
                  </div>
                </div>

                {/* Staff Note Card with Edit Capability */}
                <div className="p-3 bg-[#FAF0ED]/80 rounded-xl border border-[#F2E3E1] text-xs text-[#3D3835]">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#D87085]">
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>Staff Note (บันทึกสำหรับพนักงาน)</span>
                    </div>
                    {!isEditingStaffNote && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingStaffNote(true);
                          setStaffNoteInput(selectedClientData.client.notes || '');
                        }}
                        className="text-[11px] font-bold text-[#E88D9F] hover:text-[#D87085] flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-lg border border-[#F2E3E1] shadow-2xs hover:bg-[#FAF0ED] transition cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>แก้ไข</span>
                      </button>
                    )}
                  </div>

                  {isEditingStaffNote ? (
                    <div className="space-y-2 mt-2">
                      <textarea
                        rows={2}
                        value={staffNoteInput}
                        onChange={(e) => setStaffNoteInput(e.target.value)}
                        placeholder="ระบุข้อความบันทึกภายในสำหรับพนักงาน..."
                        className="w-full p-2.5 text-xs border border-[#F2E3E1] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#E88D9F] text-[#3D3835]"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingStaffNote(false)}
                          disabled={isSavingStaffNote}
                          className="px-3 py-1 text-[11px] font-semibold bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveStaffNote}
                          disabled={isSavingStaffNote}
                          className="px-3.5 py-1 text-[11px] font-bold bg-[#E88D9F] hover:bg-[#D87085] text-white rounded-lg shadow-2xs transition flex items-center gap-1 disabled:opacity-50"
                        >
                          <Save className="w-3 h-3" />
                          <span>{isSavingStaffNote ? 'กำลังบันทึก...' : 'บันทึก'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[#3D3835] pl-5">
                      {selectedClientData.client.notes ? (
                        selectedClientData.client.notes
                      ) : (
                        <span className="text-stone-400 italic">ยังไม่มีข้อความบันทึก (กดปุ่ม "แก้ไข" เพื่อเพิ่มบันทึก)</span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Wallets Row: Coin & Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Coin Wallet Card */}
                <div className="bg-gradient-to-br from-[#E88D9F] via-[#DF7B8F] to-[#D87085] text-white p-5 rounded-2xl shadow-sm border border-[#E07A90] space-y-4">
                  <div className="flex justify-between items-center text-xs text-rose-100 font-medium">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Coins className="w-4 h-4 text-white" />
                      {t.coinBalanceTitle}
                    </span>
                    <span className="text-[10px] bg-white/25 px-2.5 py-0.5 rounded-full text-white font-bold border border-white/30 backdrop-blur-xs">
                      In-Store Credit
                    </span>
                  </div>

                  <div className="text-3xl font-extrabold tracking-tight">
                    {formatCurrency(selectedClientData.coinBalance)} <span className="text-sm font-normal text-rose-100">{t.currencyUnit}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20">
                    <button
                      onClick={() => setActiveModal('add_coin')}
                      className="py-2 px-3 bg-white text-[#D87085] hover:bg-rose-50 text-xs font-bold rounded-xl shadow-2xs transition flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.addCoinBtn}</span>
                    </button>

                    <button
                      onClick={() => {
                        setUsedServiceName('');
                        setActionNote('');
                        setActiveModal('deduct_coin');
                      }}
                      className="py-2 px-3 bg-[#FAF0ED] text-[#D87085] hover:bg-white text-xs font-bold rounded-xl border border-rose-200 transition flex items-center justify-center gap-1"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>{t.deductCoinBtn}</span>
                    </button>
                  </div>
                </div>

                {/* Points Wallet Card */}
                <div className="bg-gradient-to-br from-[#FAF0ED] via-[#F8E2E6] to-[#F2D5DD] text-[#3D3835] p-5 rounded-2xl shadow-sm border border-[#F2C2CE] space-y-4">
                  <div className="flex justify-between items-center text-xs text-[#D87085] font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#E88D9F]" />
                      {t.pointsTitle}
                    </span>
                    <span className="bg-[#E88D9F] text-white px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                      {selectedClientData.pointsWallet.tier} Tier
                    </span>
                  </div>

                  <div className="text-3xl font-extrabold tracking-tight text-[#3D3835]">
                    {selectedClientData.pointsWallet.balance} <span className="text-sm font-normal text-[#6E6763]">{t.pointsUnit}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F2C2CE]/60">
                    <button
                      onClick={() => {
                        setPtsServiceName('');
                        setPtsSpendAmount('');
                        setPointsAmount('');
                        setActionNote('');
                        setPtsPaymentMethod('เงินสดหน้างาน (Cash Direct)');
                        setActiveModal('add_pts');
                      }}
                      className="py-2 px-3 bg-[#E88D9F] hover:bg-[#D87085] text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.awardPointsBtn}</span>
                    </button>

                    <button
                      onClick={() => {
                        setPtsRedeemTierItem('');
                        setPointsAmount(100);
                        setActionNote('');
                        setActiveModal('deduct_pts');
                      }}
                      className="py-2 px-3 bg-white hover:bg-[#FAF0ED] text-[#D87085] text-xs font-bold rounded-xl border border-[#F2C2CE] transition flex items-center justify-center gap-1"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>{t.deductPointsBtn}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Packages Panel */}
              <div className="bg-white rounded-2xl p-5 border border-[#F2E3E1] shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#FAF0ED]">
                  <h3 className="text-sm font-bold text-[#3D3835] flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#E88D9F]" />
                    Active Packages ({selectedClientData.packages.filter((p) => p.status !== 'used_up').length})
                  </h3>

                  <button
                    onClick={() => {
                      const firstPkg = catalogItems.find((c) => c.type === 'package');
                      if (firstPkg) handleCatalogSelectChange(firstPkg.id);
                      setActiveModal('sell_pkg');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E88D9F] hover:bg-[#D87085] text-white text-xs font-bold rounded-xl shadow-2xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.sellPackageBtn}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedClientData.packages.filter((p) => p.status !== 'used_up').length === 0 ? (
                    <p className="text-xs text-[#9C948E] py-3 text-center">{t.noActivePackages}</p>
                  ) : (
                    selectedClientData.packages
                      .filter((p) => p.status !== 'used_up')
                      .map((pkg) => (
                        <div
                          key={pkg.id}
                          className="p-3.5 bg-[#FAF0ED]/60 rounded-2xl border border-[#F2E3E1] flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={pkg.imageUrl || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=200&q=80'}
                              alt={pkg.name}
                              className="w-12 h-12 rounded-xl object-cover border border-[#F2E3E1]"
                            />
                            <div>
                              <h4 className="text-xs font-bold text-[#3D3835]">{pkg.name}</h4>
                              <p className="text-[11px] text-[#6E6763]">
                                {lang === 'th' ? `คงเหลือ ${pkg.remainingSessions} จากทั้งหมด ${pkg.totalSessions} ครั้ง` : `${pkg.remainingSessions} of ${pkg.totalSessions} sessions remaining`}
                              </p>
                              <p className="text-[10px] text-[#9C948E]">
                                {lang === 'th' ? 'หมดอายุ:' : 'Expires:'} {formatShortDate(pkg.expiryDate, lang)}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              setUseTargetItem({
                                type: 'package',
                                id: pkg.id,
                                name: pkg.name,
                              })
                            }
                            className="px-3.5 py-2 bg-[#E88D9F] hover:bg-[#D87085] text-white text-xs font-bold rounded-xl shadow-2xs transition"
                          >
                            {t.useOneSessionBtn}
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Active Coupons Panel */}
              <div className="bg-white rounded-2xl p-5 border border-[#F2E3E1] shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#FAF0ED]">
                  <h3 className="text-sm font-bold text-[#3D3835] flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-[#E88D9F]" />
                    {lang === 'th' ? 'คูปองที่ใช้งานได้อยู่' : 'Active Coupons'} ({selectedClientData.coupons.filter((c) => c.status !== 'used_up').length})
                  </h3>

                  <button
                    onClick={() => {
                      const firstCpn = catalogItems.find((c) => c.type === 'coupon');
                      if (firstCpn) handleCatalogSelectChange(firstCpn.id);
                      setActiveModal('issue_cpn');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E88D9F] hover:bg-[#D87085] text-white text-xs font-bold rounded-xl shadow-2xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.sellCouponBtn}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedClientData.coupons.filter((c) => c.status !== 'used_up').length === 0 ? (
                    <p className="text-xs text-[#9C948E] py-3 text-center">{t.noActiveCoupons}</p>
                  ) : (
                    selectedClientData.coupons
                      .filter((c) => c.status !== 'used_up')
                      .map((cpn) => (
                        <div
                          key={cpn.id}
                          className="p-3.5 bg-[#FAF0ED]/60 rounded-2xl border border-[#F2E3E1] flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={cpn.imageUrl || 'https://images.unsplash.com/photo-1512290900673-3f149ff93ff2?auto=format&fit=crop&w=200&q=80'}
                              alt={cpn.name}
                              className="w-12 h-12 rounded-xl object-cover border border-[#F2E3E1]"
                            />
                            <div>
                              <h4 className="text-xs font-bold text-[#3D3835]">{cpn.name}</h4>
                              <p className="text-[11px] font-mono text-[#D87085] font-bold">
                                {lang === 'th' ? 'รหัสคูปอง:' : 'Code:'} {cpn.couponCode}
                              </p>
                              <p className="text-[10px] text-[#9C948E]">
                                {lang === 'th' ? 'จำนวน:' : 'Qty:'} {cpn.remainingQuantity} / {cpn.totalQuantity} | {lang === 'th' ? 'หมดอายุ:' : 'Exp:'} {formatShortDate(cpn.expiryDate, lang)}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              setUseTargetItem({
                                type: 'coupon',
                                id: cpn.id,
                                name: cpn.name,
                                code: cpn.couponCode,
                              })
                            }
                            className="px-3.5 py-2 bg-[#E88D9F] hover:bg-[#D87085] text-white text-xs font-bold rounded-xl shadow-2xs transition"
                          >
                            {t.useOneCouponBtn}
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* ALWAYS-VISIBLE & EXPANDED: COMPLETED (USED-UP) ITEMS HISTORY SECTION */}
              <div className="bg-white text-[#3D3835] rounded-2xl p-5 shadow-2xs border border-[#F2E3E1] space-y-4">
                <div className="flex items-center justify-between border-b border-[#FAF0ED] pb-3">
                  <h3 className="text-sm font-bold text-[#3D3835] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D87085]" />
                    {t.completedItemsTitle}
                  </h3>
                  <span className="text-[10px] bg-[#FAF0ED] text-[#D87085] font-bold px-2.5 py-0.5 rounded-full border border-[#F2E3E1]">
                    {lang === 'th' ? 'ประวัติย้อนหลังทั้งหมด' : 'Full Historical Record'}
                  </span>
                </div>

                {selectedClientData.packages.filter((p) => p.status === 'used_up').length === 0 &&
                selectedClientData.coupons.filter((c) => c.status === 'used_up').length === 0 ? (
                  <p className="text-xs text-[#9C948E] py-4 text-center">{t.noCompletedItems}</p>
                ) : (
                  <div className="space-y-3">
                    {/* Completed Packages */}
                    {selectedClientData.packages
                      .filter((p) => p.status === 'used_up')
                      .map((pkg) => (
                        <div
                          key={pkg.id}
                          className="p-3.5 bg-[#FAF0ED]/50 rounded-xl border border-[#F2E3E1] text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#3D3835]">{pkg.name} ({lang === 'th' ? 'แพ็กเกจ' : 'Package'})</span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                              {lang === 'th' ? 'ใช้ครบแล้วเมื่อ' : 'Completed'} {formatShortDate(pkg.usedUpAt || pkg.expiryDate, lang)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-[#6E6763] font-mono">
                            <span>{lang === 'th' ? 'จำนวนทั้งหมด:' : 'Total Sessions:'} {pkg.totalSessions} {lang === 'th' ? 'ครั้ง' : ''}</span>
                            <span>{t.pricePaidLabel}: ฿{formatCurrency(pkg.pricePaid)}</span>
                            <span>{lang === 'th' ? 'ซื้อเมื่อ:' : 'Purchased:'} {formatShortDate(pkg.purchaseDate, lang)}</span>
                          </div>
                        </div>
                      ))}

                    {/* Completed Coupons */}
                    {selectedClientData.coupons
                      .filter((c) => c.status === 'used_up')
                      .map((cpn) => (
                        <div
                          key={cpn.id}
                          className="p-3.5 bg-[#FAF0ED]/50 rounded-xl border border-[#F2E3E1] text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#3D3835]">{cpn.name} ({lang === 'th' ? 'รหัสคูปอง' : 'Coupon Code'}: {cpn.couponCode})</span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                              {lang === 'th' ? 'ใช้ครบแล้วเมื่อ' : 'Completed'} {formatShortDate(cpn.usedUpAt || cpn.expiryDate, lang)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-[#6E6763] font-mono">
                            <span>{lang === 'th' ? 'จำนวนทั้งหมด:' : 'Quantity:'} {cpn.totalQuantity} {lang === 'th' ? 'สิทธิ์' : ''}</span>
                            <span>{lang === 'th' ? 'ได้รับ/ซื้อเมื่อ:' : 'Purchased:'} {formatShortDate(cpn.purchaseDate, lang)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Transaction History & Reversal ("Undo") Links */}
              <div className="bg-white rounded-2xl p-5 border border-[#F2E3E1] shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-[#3D3835] border-b border-[#FAF0ED] pb-2 flex items-center gap-2">
                  <History className="w-4 h-4 text-[#E88D9F]" />
                  {lang === 'th' ? 'ประวัติธุรกรรม Coin & คะแนนสะสมของลูกค้า' : 'Client Financial & Points Transactions'}
                </h3>

                <div className="space-y-3">
                  {[
                    ...selectedClientData.coinTransactions.map((tx) => ({ ...tx, category: 'coin' as const })),
                    ...selectedClientData.pointsTransactions.map((tx) => ({ ...tx, category: 'points' as const })),
                  ]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((tx) => (
                      <div
                        key={tx.id}
                        className={`p-3 bg-[#FAF0ED]/40 rounded-xl border border-[#F2E3E1] text-xs flex items-center justify-between gap-3 ${
                          tx.reversed ? 'opacity-50 line-through' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                tx.category === 'coin' ? 'bg-pink-100 text-[#D87085]' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {tx.category === 'coin' ? (lang === 'th' ? 'Coin Wallet' : 'COIN') : (lang === 'th' ? 'คะแนนสะสม' : 'POINTS')}
                            </span>
                            <span className="font-semibold text-[#3D3835]">
                              {translateTxNote(tx.note, lang)}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#9C948E] mt-0.5">
                            {formatDate(tx.createdAt, lang)} • {lang === 'th' ? 'โดย:' : 'By:'} {tx.createdByStaffName}
                          </p>
                          {tx.reversed && (
                            <p className="text-[10px] text-red-600 font-bold mt-0.5">
                              {lang === 'th' ? 'ยกเลิกแล้ว:' : 'Reversed:'} {tx.reversalReason}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold font-mono text-sm text-[#3D3835]">
                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount} {tx.category === 'coin' ? t.currency : 'pts'}
                          </span>

                          {/* Admin Reversal Trigger Button */}
                          {currentStaff.role === 'admin' && !tx.reversed && (
                            <div>
                              <button
                                onClick={() => {
                                  setTargetTxId(tx.id);
                                  setTargetTxCategory(tx.category);
                                  setActiveModal('reverse_tx');
                                }}
                                className="text-[10px] text-[#D87085] hover:underline flex items-center gap-0.5 ml-auto font-semibold"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>{t.reversalBtn}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
      </div>
      )}

      {/* QR SCANNER CAMERA MODAL */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanSuccess={(code) => {
          const client = allClients.find((c) => c.memberCode === code || c.id === code);
          if (client) {
            onSelectClient(client.id);
          } else {
            alert(`Member code "${code}" not found`);
          }
        }}
        lang={lang}
      />

      {/* CREATE NEW CLIENT MODAL */}
      {showCreateClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl border border-stone-200 animate-in fade-in">
            <h3 className="text-lg font-bold text-stone-800 border-b border-stone-100 pb-3">
              {t.createClientTitle}
            </h3>

            <form onSubmit={handleCreateClientSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t.clientDisplayName} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Khun Napat Srisawat"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t.clientNickname}</label>
                <input
                  type="text"
                  placeholder="e.g. Napat"
                  value={newClientNickname}
                  onChange={(e) => setNewClientNickname(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t.clientPhone} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 081-999-8877"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t.clientBirthday}</label>
                <input
                  type="date"
                  value={newClientBirthday}
                  onChange={(e) => setNewClientBirthday(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t.clientNotes}</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Sensitive skin preferences..."
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateClientModal(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#E88D9F] hover:bg-[#D87085] rounded-full shadow-2xs transition"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR ADD COIN CREDIT (RECORD PAYMENT) */}
      {selectedClientData && (
        <ConfirmationModal
          isOpen={activeModal === 'add_coin'}
          title={isBonusCoin
            ? (lang === 'th' ? 'เติม Bonus Coins (CRM Marketing)' : 'Top Up Bonus Coins (CRM Marketing)')
            : t.recordPaymentTitle}
          message={isBonusCoin
            ? (lang === 'th' 
              ? 'Bonus Coins จะเพิ่มเข้ากระเป๋าลูกค้า แต่ระบบหลังบ้านจะบันทึกเป็น "ค่าใช้จ่าย Bonus Coins (CRM Marketing)" โดยอัตโนมัติ ไม่นับเป็นรายรับ' 
              : 'Bonus coins will be added to client balance, but recorded as CRM Marketing Expense in financial reports.')
            : t.recordPaymentNote}
          lang={lang}
          onClose={() => {
            setActiveModal(null);
            setIsBonusCoin(false);
            setActionNote('');
          }}
          onConfirm={async () => {
            if (!coinAmount || Number(coinAmount) <= 0) return;
            await api.addCoinCredit(
              selectedClientData.client.id,
              Number(coinAmount),
              actionNote || (isBonusCoin 
                ? (lang === 'th' ? 'แจก Bonus Coins ให้ลูกค้า (CRM Marketing)' : 'Bonus Coins CRM Marketing')
                : 'Staff recorded store payment'),
              currentStaff.id,
              currentStaff.displayName,
              isBonusCoin
            );
            onRefreshClient();
            setActionNote('');
            setIsBonusCoin(false);
          }}
        >
          <div className="space-y-3.5">
            {/* Bonus Coins Checkbox Option */}
            <div className={`p-3.5 rounded-xl border transition ${isBonusCoin ? 'bg-[#FAF0ED] border-[#E88D9F] ring-1 ring-[#E88D9F]/30' : 'bg-stone-50 border-stone-200'}`}>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBonusCoin}
                  onChange={(e) => setIsBonusCoin(e.target.checked)}
                  className="mt-0.5 w-4.5 h-4.5 text-[#E88D9F] accent-[#E88D9F] rounded focus:ring-[#E88D9F]"
                />
                <div className="text-xs">
                  <span className="font-bold text-[#3D3835] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#E88D9F]" />
                    <span>{lang === 'th' ? 'เติมเป็น Bonus Coins (ค่าใช้จ่าย CRM Marketing)' : 'Top up as Bonus Coins (CRM Marketing Expense)'}</span>
                  </span>
                  <p className="text-[11px] text-[#6E6763] mt-0.5 leading-relaxed">
                    {lang === 'th'
                      ? 'สำหรับแจกเป็นส่วนลดพิเศษ/โปรโมชัน ยอดจะรวมเข้ากระเป๋าลูกค้า แต่งบหลังบ้านจะไม่ถูกหักเป็นรายรับ แต่จะถูกหักเป็นรายจ่าย Bonus Coins (CRM Marketing) ที่บริษัทออกให้แทน'
                      : 'Coins will be added to client balance, but recorded as CRM Marketing expense instead of revenue.'}
                  </p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {isBonusCoin
                  ? (lang === 'th' ? 'จำนวน Bonus Coins ที่แจก (บาท) *' : 'Bonus Coins Amount (THB) *')
                  : t.amountLabel}
              </label>
              <input
                type="number"
                min="1"
                value={coinAmount}
                onChange={(e) => setCoinAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">{t.actionNoteLabel}</label>
              <input
                type="text"
                placeholder={isBonusCoin
                  ? (lang === 'th' ? 'เช่น โบนัสต้อนรับสมาชิกใหม่, ชดเชยการบริการ, ของขวัญวันเกิด' : 'e.g. Welcome bonus, Service apology, Birthday promo')
                  : 'เช่น พนักงานยืนยันการโอนเงินเข้าบัญชีธนาคาร หรือรับเงินสดหน้าร้าน'}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
              />
            </div>
          </div>
        </ConfirmationModal>
      )}

      {/* CONFIRMATION MODAL FOR DEDUCT COIN CREDIT */}
      {selectedClientData && (
        <ConfirmationModal
          isOpen={activeModal === 'deduct_coin'}
          title={t.deductCoinTitle}
          lang={lang}
          onClose={() => {
            setActiveModal(null);
            setUsedServiceName('');
            setActionNote('');
          }}
          onConfirm={async () => {
            if (!coinAmount || Number(coinAmount) <= 0) return;
            const fullNote = usedServiceName.trim()
              ? `บริการที่ใช้: ${usedServiceName.trim()}${actionNote.trim() ? ` (${actionNote.trim()})` : ''}`
              : (actionNote.trim() || 'บริการในสตูดิโอ');
            await api.deductCoinCredit(
              selectedClientData.client.id,
              Number(coinAmount),
              fullNote,
              currentStaff.id,
              currentStaff.displayName
            );
            onRefreshClient();
            setActionNote('');
            setUsedServiceName('');
          }}
        >
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ระบุบริการที่ลูกค้าใช้บริการ (Service Item) *
              </label>
              <input
                type="text"
                required
                placeholder="เช่น นวดหน้า ออร์แกนิค กัวซา, นวดอโรม่าผ่อนคลาย"
                value={usedServiceName}
                onChange={(e) => setUsedServiceName(e.target.value)}
                className="w-full px-3 py-2 border border-[#F2E3E1] rounded-xl text-xs font-medium text-[#3D3835] bg-[#FAF0ED]/50 focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
              />

              {/* Quick Select Dropdown & Quick Buttons from Catalog */}
              {catalogItems.length > 0 && (
                <div className="mt-2.5 space-y-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#D87085] font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#E88D9F]" />
                      <span>เลือกด่วนจากรายการบริการรายครั้ง (One-Time Services):</span>
                    </label>
                    <select
                      value={usedServiceName}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        setUsedServiceName(selectedName);
                        const match = catalogItems.find((c) => c.name === selectedName);
                        if (match && match.price > 0) {
                          setCoinAmount(match.price);
                        }
                      }}
                      className="w-full px-3 py-2 border border-[#F2E3E1] rounded-xl text-xs font-semibold text-[#3D3835] bg-white focus:outline-none focus:ring-2 focus:ring-[#E88D9F] shadow-2xs"
                    >
                      <option value="">-- พิมพ์ชื่อเอง หรือเลือกบริการจากรายการ --</option>
                      <optgroup label="✨ บริการรายครั้ง (One-Time Services - แนะนำตัด Coin)">
                        {catalogItems
                          .filter((c) => c.active && (c.type === 'onetime' || !c.type))
                          .map((cat) => (
                            <option key={cat.id} value={cat.name}>
                              {cat.name} — ฿{formatCurrency(cat.price)}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="📦 คอร์ส & แพ็กเกจอื่น ๆ (Packages)">
                        {catalogItems
                          .filter((c) => c.active && c.type === 'package')
                          .map((cat) => (
                            <option key={cat.id} value={cat.name}>
                              {cat.name} — ฿{formatCurrency(cat.price)}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* One-Time Services Quick Buttons */}
                  <div className="pt-1">
                    <span className="text-[10px] text-[#6E6763] block font-semibold mb-1">
                      ปุ่มลัดเลือกบริการรายครั้ง (One-Time Quick Select):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {catalogItems
                        .filter((c) => c.active && (c.type === 'onetime' || !c.type))
                        .map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setUsedServiceName(cat.name);
                              if (cat.price && cat.price > 0) {
                                setCoinAmount(cat.price);
                              }
                            }}
                            className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition text-left flex items-center gap-1.5 ${
                              usedServiceName === cat.name
                                ? 'bg-[#E88D9F] text-white border-[#D87085] font-bold shadow-2xs ring-2 ring-[#E88D9F]/30'
                                : 'bg-[#FAF0ED] text-[#D87085] border-[#F2E3E1] hover:bg-[#F2E3E1] font-medium'
                            }`}
                          >
                            <Sparkles className="w-3 h-3 text-[#E88D9F] shrink-0" />
                            <span>{cat.name}</span>
                            <span className="opacity-90 font-mono text-[10px] bg-white/70 text-[#D87085] px-1 py-0.2 rounded font-bold">
                              ฿{formatCurrency(cat.price)}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {t.amountLabel} (จำนวน Coin ที่ตัด) *
              </label>
              <input
                type="number"
                min="1"
                value={coinAmount}
                onChange={(e) => setCoinAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {t.actionNoteLabel} (บันทึกเพิ่มเติม)
              </label>
              <input
                type="text"
                placeholder="เช่น ช่างผู้ให้บริการ, เลขที่ห้อง, หรือหมายเหตุเพิ่มเติม"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </ConfirmationModal>
      )}

      {/* CONFIRMATION MODAL FOR AWARD POINTS (ADD POINTS) */}
      {selectedClientData && (
        <ConfirmationModal
          isOpen={activeModal === 'add_pts'}
          title="ให้คะแนนสะสมลูกค้า (ชำระเงินสด / โอนตรงหน้างาน)"
          lang={lang}
          onClose={() => {
            setActiveModal(null);
            setPtsServiceName('');
            setPtsSpendAmount('');
            setPointsAmount('');
            setActionNote('');
          }}
          onConfirm={async () => {
            const pts = Number(pointsAmount);
            if (!pts || pts <= 0) {
              alert(lang === 'th' ? 'กรุณาระบุจำนวนคะแนนสะสมที่จะบันทึก' : 'Please enter points amount to award');
              return;
            }

            const parts: string[] = [];
            if (ptsServiceName.trim()) {
              parts.push(`บริการ: ${ptsServiceName.trim()}`);
            }
            if (ptsSpendAmount && Number(ptsSpendAmount) > 0) {
              parts.push(`ยอดชำระ: ฿${formatCurrency(Number(ptsSpendAmount))}`);
            }
            if (ptsPaymentMethod) {
              parts.push(`ช่องทาง: ${ptsPaymentMethod}`);
            }
            if (actionNote.trim()) {
              parts.push(`หมายเหตุ: ${actionNote.trim()}`);
            }

            const fullNote = parts.length > 0 ? parts.join(' | ') : 'ให้คะแนนสะสม (ชำระเงินสด/โอนตรง)';

            await api.addPoints(
              selectedClientData.client.id,
              pts,
              fullNote,
              currentStaff.id,
              currentStaff.displayName
            );
            onRefreshClient();
            setActiveModal(null);
            setPtsServiceName('');
            setPtsSpendAmount('');
            setPointsAmount('');
            setActionNote('');
          }}
        >
          <div className="space-y-3.5">
            {/* Service Name Input & Quick Select from Catalog */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ระบุบริการ / รายการที่ลูกค้าชำระเงิน (Service Item)
              </label>
              <input
                type="text"
                placeholder="เช่น นวดหน้า ออร์แกนิค กัวซา (หรือเลือกจากด้านล่าง)"
                value={ptsServiceName}
                onChange={(e) => setPtsServiceName(e.target.value)}
                className="w-full px-3 py-2 border border-[#F2E3E1] rounded-xl text-xs font-medium text-[#3D3835] bg-[#FAF0ED]/50 focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
              />

              {/* Catalog Quick Select */}
              {catalogItems.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <label className="text-[11px] text-[#D87085] font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#E88D9F]" />
                    <span>เลือกด่วนจากรายการบริการในสตูดิโอ (Catalog):</span>
                  </label>
                  <select
                    value={ptsServiceName}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      setPtsServiceName(selectedName);
                      const match = catalogItems.find((c) => c.name === selectedName);
                      if (match && match.price > 0) {
                        setPtsSpendAmount(match.price);
                        // Auto-calculate points (1 pt per BAHT_PER_POINT THB)
                        setPointsAmount(Math.floor(match.price / BAHT_PER_POINT));
                      }
                    }}
                    className="w-full px-3 py-2 border border-[#F2E3E1] rounded-xl text-xs font-semibold text-[#3D3835] bg-white focus:outline-none focus:ring-2 focus:ring-[#E88D9F] shadow-2xs"
                  >
                    <option value="">-- พิมพ์ชื่อเอง หรือเลือกบริการจากรายการ --</option>
                    {catalogItems
                      .filter((c) => c.active)
                      .map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name} — ฿{formatCurrency(cat.price)}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Spending Amount & Points Calculation */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ยอดชำระหน้างาน (บาท)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="เช่น 1500"
                  value={ptsSpendAmount}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setPtsSpendAmount(val);
                    if (typeof val === 'number' && val > 0) {
                      setPointsAmount(Math.floor(val / BAHT_PER_POINT));
                    }
                  }}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#D87085] mb-1">
                  คะแนนสะสมที่ได้รับ (Points) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="เช่น 150"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border-2 border-[#E88D9F] bg-[#FAF0ED] rounded-xl text-sm font-mono font-bold text-[#D87085] focus:outline-none"
                />
              </div>
            </div>

            {/* Payment Channel */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ช่องทางชำระเงิน
              </label>
              <select
                value={ptsPaymentMethod}
                onChange={(e) => setPtsPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white font-medium"
              >
                <option value="เงินสดหน้างาน">เงินสดหน้างาน (Cash Direct)</option>
                <option value="โอนเงินผ่าน PromptPay / ธนาคาร">โอนเงินผ่าน PromptPay / ธนาคาร</option>
                <option value="บัตรเครดิต">บัตรเครดิต (Credit Card)</option>
                <option value="ชำระตรงอื่นๆ">ชำระตรงอื่นๆ</option>
              </select>
            </div>

            {/* Action Note */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                หมายเหตุเพิ่มเติม
              </label>
              <input
                type="text"
                placeholder="เช่น สมาชิกพรีเมียมรับคะแนนโบนัส"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
              />
            </div>

            {/* Preview box */}
            {pointsAmount && Number(pointsAmount) > 0 && (
              <div className="p-3 bg-gradient-to-r from-[#FAF0ED] to-[#F8E2E6] rounded-xl border border-[#F2C2CE] text-xs text-[#3D3835] space-y-1">
                <p className="font-bold text-[#D87085] flex items-center gap-1">
                  <Award className="w-4 h-4 text-[#E88D9F]" />
                  สรุปคะแนนที่จะบันทึก:
                </p>
                <p className="font-mono text-sm font-extrabold text-[#D87085]">
                  +{pointsAmount} คะแนน <span className="text-xs font-normal text-[#6E6763]">(สะสมรวม {selectedClientData.pointsWallet.balance} ➔ {selectedClientData.pointsWallet.balance + Number(pointsAmount)} pts)</span>
                </p>
              </div>
            )}
          </div>
        </ConfirmationModal>
      )}

      {/* CONFIRMATION MODAL FOR DEDUCT / REDEEM POINTS */}
      {selectedClientData && (
        <ConfirmationModal
          isOpen={activeModal === 'deduct_pts'}
          title="ตัดคะแนนสะสมแลกสิทธิ์ (Redeem Points / Tier Benefit)"
          lang={lang}
          onClose={() => {
            setActiveModal(null);
            setPtsRedeemTierItem('');
            setPointsAmount(100);
            setActionNote('');
          }}
          onConfirm={async () => {
            const pts = Number(pointsAmount);
            if (!pts || pts <= 0) {
              alert(lang === 'th' ? 'กรุณาระบุจำนวนคะแนนที่ต้องการตัด' : 'Please enter points amount to deduct');
              return;
            }
            if (pts > selectedClientData.pointsWallet.balance) {
              alert(
                lang === 'th'
                  ? `คะแนนสะสมไม่พอ! ลูกค้ามีคะแนนคงเหลือ ${selectedClientData.pointsWallet.balance} pts`
                  : `Insufficient points! Client has ${selectedClientData.pointsWallet.balance} pts remaining`
              );
              return;
            }

            const parts: string[] = [];
            if (ptsRedeemTierItem.trim()) {
              parts.push(`แลกสิทธิ์/Tier: ${ptsRedeemTierItem.trim()}`);
            }
            if (actionNote.trim()) {
              parts.push(`หมายเหตุ: ${actionNote.trim()}`);
            }
            const fullNote = parts.length > 0 ? parts.join(' | ') : `แลกรับสิทธิ์ประโยชน์ (${selectedClientData.pointsWallet.tier} Tier)`;

            await api.redeemPoints(
              selectedClientData.client.id,
              pts,
              fullNote,
              currentStaff.id,
              currentStaff.displayName
            );
            onRefreshClient();
            setActiveModal(null);
            setPtsRedeemTierItem('');
            setPointsAmount(100);
            setActionNote('');
          }}
        >
          <div className="space-y-3.5">
            {/* Current Tier & Balance Badge */}
            <div className="flex items-center justify-between p-3 bg-[#FAF0ED] rounded-xl border border-[#F2E3E1]">
              <div>
                <span className="text-[10px] text-[#D87085] font-bold block uppercase tracking-wider">
                  ระดับสมาชิกปัจจุบัน (Current Tier)
                </span>
                <span className="font-serif font-bold text-sm text-[#3D3835]">
                  {selectedClientData.pointsWallet.tier} Tier
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#6E6763] font-bold block">คะแนนคงเหลือ</span>
                <span className="font-mono font-extrabold text-sm text-[#D87085]">
                  {selectedClientData.pointsWallet.balance} pts
                </span>
              </div>
            </div>

            {/* Select / Input Tier Benefit or Reward Item */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ระบุสิทธิ์ประโยชน์ / Tier Reward ที่แลกรับ *
              </label>
              <input
                type="text"
                required
                placeholder="เช่น แลกรับส่วนลด 15% (Gold Tier), แลกนวดหน้า 1 ครั้ง"
                value={ptsRedeemTierItem}
                onChange={(e) => setPtsRedeemTierItem(e.target.value)}
                className="w-full px-3 py-2 border border-[#F2E3E1] rounded-xl text-xs font-medium text-[#3D3835] bg-white focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
              />

              {/* Preset Tier Quick Selection Buttons */}
              <div className="mt-2 space-y-1">
                <span className="text-[10px] font-bold text-[#D87085] block">
                  ตัวเลือกด่วนตาม Tier / สิทธิ์ประโยชน์:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: `สิทธิ์ ${selectedClientData.pointsWallet.tier} Tier: ส่วนลดบริการ 10%`, pts: 100 },
                    { label: `สิทธิ์ ${selectedClientData.pointsWallet.tier} Tier: ส่วนลดบริการ 15%`, pts: 200 },
                    { label: `แลกรับบริการนวดหน้าฟรี 1 ครั้ง`, pts: 500 },
                    { label: `แลกคูปองส่วนลด 100 บาท`, pts: 100 },
                    { label: `แลกคูปองส่วนลด 300 บาท`, pts: 300 },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPtsRedeemTierItem(preset.label);
                        setPointsAmount(preset.pts);
                      }}
                      className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition text-left ${
                        ptsRedeemTierItem === preset.label
                          ? 'bg-[#E88D9F] text-white border-[#D87085] font-bold shadow-2xs'
                          : 'bg-[#FAF0ED] text-[#D87085] border-[#F2E3E1] hover:bg-[#F2E3E1] font-medium'
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className="ml-1 opacity-90 font-mono text-[10px]">({preset.pts} pts)</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Points Amount */}
            <div>
              <label className="block text-xs font-bold text-[#D87085] mb-1">
                จำนวนคะแนนที่ตัด (Points to Deduct) *
              </label>
              <input
                type="number"
                min="1"
                max={selectedClientData.pointsWallet.balance}
                required
                placeholder="เช่น 100"
                value={pointsAmount}
                onChange={(e) => setPointsAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-rose-300 bg-rose-50/50 rounded-xl text-sm font-mono font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
              />
            </div>

            {/* Action Note */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                หมายเหตุเพิ่มเติม
              </label>
              <input
                type="text"
                placeholder="เช่น เลขที่ใบเสร็จรับเงิน หรือรายละเอียดเพิ่มเติม"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E88D9F]"
              />
            </div>

            {/* Warning/Preview */}
            {pointsAmount && Number(pointsAmount) > 0 && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-[#3D3835] space-y-1 font-mono">
                <p className="font-bold text-rose-600 flex items-center gap-1">
                  <Minus className="w-4 h-4 text-rose-500" />
                  สรุปการตัดคะแนน: -{pointsAmount} pts
                </p>
                <p className="text-[11px] text-[#6E6763]">
                  คะแนนคงเหลือหลังตัด: {selectedClientData.pointsWallet.balance - Number(pointsAmount)} pts
                </p>
              </div>
            )}
          </div>
        </ConfirmationModal>
      )}

      {/* CONFIRMATION MODAL FOR SELL PACKAGE */}
      {selectedClientData && (
        <ConfirmationModal
          isOpen={activeModal === 'sell_pkg'}
          title={t.sellPackageTitle}
          lang={lang}
          onClose={() => setActiveModal(null)}
          onConfirm={async () => {
            if (!selectedCatalogId || !customSessions) return;
            await api.sellPackage(
              selectedClientData.client.id,
              selectedCatalogId,
              Number(customSessions),
              Number(customPrice) || 0,
              Number(customValidity) || 90,
              currentStaff.id,
              currentStaff.displayName
            );
            onRefreshClient();
          }}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">{t.selectCatalogTemplate}</label>
              <select
                value={selectedCatalogId}
                onChange={(e) => handleCatalogSelectChange(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white font-medium"
              >
                {catalogItems
                  .filter((c) => c.type === 'package' && c.active)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.defaultSessions} sessions - ฿{formatCurrency(item.price)})
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t.customSessionsLabel}</label>
                <input
                  type="number"
                  min="1"
                  value={customSessions}
                  onChange={(e) => setCustomSessions(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t.customPriceLabel}</label>
                <input
                  type="number"
                  min="0"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">{t.customValidityLabel}</label>
              <input
                type="number"
                min="1"
                value={customValidity}
                onChange={(e) => setCustomValidity(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
              />
            </div>
          </div>
        </ConfirmationModal>
      )}

      {/* CONFIRMATION MODAL FOR ISSUE COUPON */}
      {selectedClientData && (
        <ConfirmationModal
          isOpen={activeModal === 'issue_cpn'}
          title={t.sellCouponTitle}
          lang={lang}
          onClose={() => setActiveModal(null)}
          onConfirm={async () => {
            if (!selectedCatalogId || !customQuantity) return;
            await api.issueCoupon(
              selectedClientData.client.id,
              selectedCatalogId,
              Number(customQuantity),
              Number(customPrice) || 0,
              Number(customValidity) || 30,
              currentStaff.id,
              currentStaff.displayName
            );
            onRefreshClient();
          }}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">{t.selectCatalogTemplate}</label>
              <select
                value={selectedCatalogId}
                onChange={(e) => handleCatalogSelectChange(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white font-medium"
              >
                {catalogItems
                  .filter((c) => c.type === 'coupon' && c.active)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t.customQuantityLabel}</label>
                <input
                  type="number"
                  min="1"
                  value={customQuantity}
                  onChange={(e) => setCustomQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">{t.customValidityLabel}</label>
                <input
                  type="number"
                  min="1"
                  value={customValidity}
                  onChange={(e) => setCustomValidity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>
        </ConfirmationModal>
      )}

      {/* CONFIRMATION MODAL FOR SINGLE SESSION / COUPON USE */}
      {useTargetItem && selectedClientData && (
        <ConfirmationModal
          isOpen={!!useTargetItem}
          title={
            useTargetItem.type === 'package' ? t.useSessionConfirmTitle : t.useCouponConfirmTitle
          }
          message={
            useTargetItem.type === 'package'
              ? t.useSessionConfirmMessage
                  .replace('{name}', useTargetItem.name)
                  .replace('{clientName}', selectedClientData.client.displayName)
              : t.useCouponConfirmMessage
                  .replace('{name}', useTargetItem.name)
                  .replace('{code}', useTargetItem.code || '')
                  .replace('{clientName}', selectedClientData.client.displayName)
          }
          lang={lang}
          onClose={() => setUseTargetItem(null)}
          onConfirm={async () => {
            if (useTargetItem.type === 'package') {
              await api.usePackageSession(
                useTargetItem.id,
                '1 session deducted in studio',
                currentStaff.id,
                currentStaff.displayName
              );
            } else {
              await api.redeemCoupon(
                useTargetItem.id,
                '1 coupon unit redeemed in studio',
                currentStaff.id,
                currentStaff.displayName
              );
            }
            onRefreshClient();
            setUseTargetItem(null);
          }}
        />
      )}

      {/* REVERSAL MODAL (ADMIN ONLY) */}
      {activeModal === 'reverse_tx' && (
        <ConfirmationModal
          isOpen={true}
          isDanger={true}
          title={t.reversalConfirmTitle}
          message={t.reversalNotice}
          lang={lang}
          onClose={() => setActiveModal(null)}
          onConfirm={async () => {
            if (!reversalReason.trim()) {
              alert(t.reasonRequired);
              return;
            }
            if (targetTxCategory === 'coin') {
              await api.reverseCoinTransaction(
                targetTxId,
                reversalReason.trim(),
                currentStaff.id,
                currentStaff.displayName
              );
            } else {
              await api.reversePointsTransaction(
                targetTxId,
                reversalReason.trim(),
                currentStaff.id,
                currentStaff.displayName
              );
            }
            onRefreshClient();
            setReversalReason('');
          }}
        >
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {t.reversalReasonLabel} *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Correcting duplicate entry error"
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs"
            />
          </div>
        </ConfirmationModal>
      )}

      {/* BRAND & LOGO SETTINGS MODAL */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-xl border border-[#F2E3E1] space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#FAF0ED] pb-3">
              <div className="flex items-center gap-2 text-[#3D3835]">
                <Settings className="w-5 h-5 text-[#E88D9F]" />
                <h3 className="text-base font-serif font-bold">
                  {lang === 'th' ? 'ตั้งค่าโลโก้และชื่อสตูดิโอ' : 'App Branding & Logo Settings'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBrandModal(false)}
                className="text-[#9C948E] hover:text-[#3D3835] p-1 rounded-full text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBrandSettings} className="space-y-5">
              {/* Live Preview Card */}
              <div className="bg-[#FAF0ED]/60 p-4 rounded-2xl border border-[#F2E3E1] space-y-2">
                <span className="text-[11px] font-bold text-[#D87085] uppercase tracking-wider block">
                  {lang === 'th' ? 'ตัวอย่างการแสดงผล (Live Preview)' : 'Live Preview'}
                </span>
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#F2E3E1] shadow-2xs">
                  <img
                    src={editLogoUrl || appLogo}
                    alt="Logo Preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#E88D9F] shadow-2xs bg-white shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = appLogo;
                    }}
                  />
                  <div>
                    <h4 className="font-serif font-bold text-[#3D3835] text-sm flex items-center gap-1">
                      {editBrandName || 'Me.My.Mind Membership'}
                      <Sparkles className="w-3.5 h-3.5 text-[#E88D9F]" />
                    </h4>
                    <p className="text-[11px] text-[#D87085] font-medium">
                      {editBrandTagline || 'Your Daily Ritual of Self-Love'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Logo Selection & Upload Options */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#3D3835]">
                  {lang === 'th' ? 'เลือกรูปโลโก้ (Logo Image)' : 'Logo Image'}
                </label>

                {/* File Upload Trigger Button */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="cursor-pointer flex items-center justify-center gap-2 p-3 bg-[#FAF0ED] hover:bg-[#F2E3E1] border-2 border-dashed border-[#E88D9F] rounded-xl text-xs font-bold text-[#D87085] transition">
                    <Upload className="w-4 h-4" />
                    <span>{lang === 'th' ? 'อัปโหลดรูปภาพใหม่' : 'Upload Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setEditLogoUrl(appLogo)}
                    className="flex items-center justify-center gap-2 p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-semibold text-[#3D3835] transition"
                  >
                    <RefreshCw className="w-4 h-4 text-[#6E6763]" />
                    <span>{lang === 'th' ? 'รีเซ็ตกลับรูปเดิม' : 'Reset Default Logo'}</span>
                  </button>
                </div>

                {logoUploadError && (
                  <p className="text-xs text-red-500 font-semibold">{logoUploadError}</p>
                )}

                {/* Direct Image URL Input */}
                <div className="space-y-1">
                  <span className="text-[11px] text-[#6E6763]">
                    {lang === 'th' ? 'หรือใส่ URL รูปภาพ:' : 'Or enter Image URL:'}
                  </span>
                  <input
                    type="text"
                    placeholder="https://example.com/logo.png"
                    value={editLogoUrl}
                    onChange={(e) => setEditLogoUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#F2E3E1] rounded-xl focus:outline-none focus:border-[#E88D9F] font-mono"
                  />
                </div>
              </div>

              {/* App Name Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#3D3835]">
                  {lang === 'th' ? 'ชื่อแอปพลิเคชัน (App Name)' : 'App Title'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Me.My.Mind Membership"
                  value={editBrandName}
                  onChange={(e) => setEditBrandName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#F2E3E1] rounded-xl focus:outline-none focus:border-[#E88D9F] font-semibold text-[#3D3835]"
                />
              </div>

              {/* Tagline Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#3D3835]">
                  {lang === 'th' ? 'สโลแกน / บรรทัดล่าง (Tagline)' : 'Tagline'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Your Daily Ritual of Self-Love"
                  value={editBrandTagline}
                  onChange={(e) => setEditBrandTagline(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#F2E3E1] rounded-xl focus:outline-none focus:border-[#E88D9F] text-[#3D3835]"
                />
              </div>

              {/* Promotion Poster Upload Section (For Customer Coin Page) */}
              <div className="space-y-2 pt-2 border-t border-[#FAF0ED]">
                <label className="block text-xs font-bold text-[#3D3835]">
                  {lang === 'th' ? 'รูปภาพ Promotion Poster (แสดงในหน้า Coin ของลูกค้า)' : 'Promotion Poster Image (Shown on Customer Coin Page)'}
                </label>
                
                {editPromoPosterUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[#F2E3E1] bg-stone-50 max-h-48 flex items-center justify-center">
                    <img
                      src={editPromoPosterUrl}
                      alt="Promotion Poster Preview"
                      className="max-h-48 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setEditPromoPosterUrl('')}
                      className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full hover:bg-rose-600 shadow-md transition cursor-pointer"
                      title="ลบรูปโปสเตอร์"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-[#8C827A] italic bg-[#FAF0ED]/50 p-2.5 rounded-xl border border-dashed border-[#F2E3E1]">
                    {lang === 'th' ? 'ยังไม่ได้ตั้งค่ารูปโปรโมชัน (หน้า Coin จะไม่แสดงกล่องโปสเตอร์)' : 'No poster configured (Coin page will omit the poster banner)'}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <label className="cursor-pointer px-3 py-1.5 bg-[#FAF0ED] hover:bg-[#F2E3E1] text-[#D87085] rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-[#F2E3E1]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{lang === 'th' ? 'อัปโหลดรูปโปสเตอร์' : 'Upload Poster Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePosterFileUpload}
                      className="hidden"
                    />
                  </label>

                  {editPromoPosterUrl && (
                    <button
                      type="button"
                      onClick={() => setEditPromoPosterUrl('')}
                      className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                    >
                      {lang === 'th' ? 'ลบรูปออก' : 'Clear Poster'}
                    </button>
                  )}
                </div>

                {posterUploadError && (
                  <p className="text-xs text-red-500 font-semibold">{posterUploadError}</p>
                )}

                <div className="space-y-1">
                  <span className="text-[11px] text-[#6E6763]">
                    {lang === 'th' ? 'หรือใส่ URL รูปภาพโปรโมชัน:' : 'Or enter Promotion Poster Image URL:'}
                  </span>
                  <input
                    type="text"
                    placeholder="https://example.com/poster.jpg"
                    value={editPromoPosterUrl}
                    onChange={(e) => setEditPromoPosterUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#F2E3E1] rounded-xl focus:outline-none focus:border-[#E88D9F] font-mono"
                  />
                </div>
              </div>

              {/* Actions Buttons */}
              <div className="pt-2 border-t border-[#FAF0ED] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBrandModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#6E6763] hover:text-[#3D3835] rounded-xl transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#E88D9F] hover:bg-[#D87085] rounded-full shadow-2xs transition"
                >
                  {lang === 'th' ? 'บันทึกการตั้งค่า' : 'Save Brand Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Management Modal */}
      {currentStaff && (
        <StaffManagementModal
          isOpen={isStaffManagementOpen}
          onClose={() => setIsStaffManagementOpen(false)}
          currentStaff={currentStaff}
          employees={employees}
          onRefreshEmployees={() => {
            if (onRefreshEmployees) onRefreshEmployees();
          }}
        />
      )}

      {/* Change Password Modal */}
      {currentStaff && (
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          currentStaff={currentStaff}
          onRefreshEmployees={() => {
            if (onRefreshEmployees) onRefreshEmployees();
          }}
        />
      )}

      {/* Export Clients Modal */}
      <ExportClientsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        staffRole={role}
      />

      {/* Factory Reset Modal (Admin Only) */}
      <FactoryResetModal
        isOpen={isFactoryResetOpen}
        onClose={() => setIsFactoryResetOpen(false)}
        currentStaff={currentStaff}
        onSuccess={() => {
          onRefreshClient();
          if (onRefreshEmployees) onRefreshEmployees();
        }}
      />

      {/* Backup & Auto-Report Settings Modal */}
      <BackupSettingsModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />

    </div>
  );
};
