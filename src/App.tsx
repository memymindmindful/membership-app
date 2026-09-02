import React, { useState, useEffect, useCallback } from 'react';
import liff from '@line/liff';
import {
  AppLanguage,
  CatalogItem,
  Client,
  Employee,
  RewardCatalogItem,
  AuditLog,
  BrandSettings,
} from './types';
import { api, FullClientData } from './services/api';
import { Header } from './components/Header';
import { CustomerApp } from './components/CustomerApp';
import { StaffDashboard } from './components/StaffDashboard';
import { CatalogManagement } from './components/CatalogManagement';
import { AuditLogView } from './components/AuditLogView';
import { BookingsOverview } from './components/BookingsOverview';
import { ConsentModal } from './components/ConsentModal';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { ConnectingScreen } from './components/ConnectingScreen';
import {
  Loader2,
  Calendar,
  User,
  PieChart,
  Package,
  Settings,
  BookOpen,
  ShieldCheck,
  FileSpreadsheet,
  Users,
  Database,
  RotateCcw,
  KeyRound,
} from 'lucide-react';
import { StaffManagementModal } from './components/StaffManagementModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { ExportClientsModal } from './components/ExportClientsModal';
import { FactoryResetModal } from './components/FactoryResetModal';
import { BackupSettingsModal } from './components/BackupSettingsModal';
import { translations } from './lib/translations';
import defaultAppLogo from './assets/images/me_my_mind_logo_1785924412256.jpg';

const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  brandName: 'Me.My.Mind Membership',
  brandTagline: 'Your Daily Ritual of Self-Love',
  logoUrl: defaultAppLogo,
};

export default function App() {
  const [viewMode, setViewMode] = useState<'customer' | 'staff'>(() => {
    if (window.location.search.includes('mode=staff') || window.location.search.includes('staff=true')) {
      return 'staff';
    }
    return 'customer';
  });
  const [activeSubView, setActiveSubView] = useState<'main' | 'catalog' | 'audit' | 'bookings'>('main');
  const [lang, setLang] = useState<AppLanguage>('th');
  const [isLiffLoggedIn, setIsLiffLoggedIn] = useState(false);
  const [isLiffApp, setIsLiffApp] = useState(false);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isLiffInitializing, setIsLiffInitializing] = useState(true);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showProfileSetupModal, setShowProfileSetupModal] = useState(false);

  // Lifted Staff Navigation & Modal States
  const [activeTab, setActiveTab] = useState<'client_ops' | 'financial'>('client_ops');
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isStaffManagementOpen, setIsStaffManagementOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFactoryResetOpen, setIsFactoryResetOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  const [brandSettings, setBrandSettings] = useState<BrandSettings>(() => {
    try {
      const saved = localStorage.getItem('MMM_BRAND_SETTINGS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.brandName || parsed.logoUrl) {
          return {
            brandName: parsed.brandName || DEFAULT_BRAND_SETTINGS.brandName,
            brandTagline: parsed.brandTagline || DEFAULT_BRAND_SETTINGS.brandTagline,
            logoUrl: parsed.logoUrl || DEFAULT_BRAND_SETTINGS.logoUrl,
            promoPosterUrl: parsed.promoPosterUrl || '',
            updatedAt: parsed.updatedAt || Date.now(),
          };
        }
      }
    } catch (e) {
      console.error('Failed to parse saved brand settings', e);
    }
    return DEFAULT_BRAND_SETTINGS;
  });

  const handleUpdateBrandSettings = async (newSettings: BrandSettings) => {
    try {
      const updated = await api.updateBrandSettings(
        newSettings,
        currentStaff?.id || 'EMP-01',
        currentStaff?.displayName || 'Admin'
      );
      const merged: BrandSettings = {
        brandName: updated.brandName || DEFAULT_BRAND_SETTINGS.brandName,
        brandTagline: updated.brandTagline || DEFAULT_BRAND_SETTINGS.brandTagline,
        logoUrl: updated.logoUrl || DEFAULT_BRAND_SETTINGS.logoUrl,
        promoPosterUrl: updated.promoPosterUrl || '',
        updatedAt: updated.updatedAt || Date.now(),
      };
      setBrandSettings(merged);
      try {
        localStorage.setItem('MMM_BRAND_SETTINGS', JSON.stringify(merged));
      } catch (e) {
        console.warn('Failed to cache brand settings in localStorage:', e);
      }
    } catch (e) {
      console.error('Failed to save brand settings to backend:', e);
      // Fallback local update if backend call fails
      const fallback = { ...newSettings, updatedAt: Date.now() };
      setBrandSettings(fallback);
    }
  };

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentStaff, setCurrentStaff] = useState<Employee | null>(null);

  const [allClients, setAllClients] = useState<Client[]>([]);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [clientData, setClientData] = useState<FullClientData | null>(null);

  // Dedicated separate state for staff viewing client in Staff Dashboard
  const [selectedStaffClient, setSelectedStaffClient] = useState<Client | null>(null);
  const [staffClientData, setStaffClientData] = useState<FullClientData | null>(null);

  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [rewardCatalog, setRewardCatalog] = useState<RewardCatalogItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // Load Initial Base Data
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const isStaffMode = window.location.search.includes('mode=staff') || window.location.search.includes('staff=true');
      const isDemoMode = window.location.search.includes('demo=true') || window.location.search.includes('dev=true');

      // Sync Brand Settings from Backend Server
      try {
        const serverBrand = await api.getBrandSettings();
        if (serverBrand && (serverBrand.brandName || serverBrand.logoUrl || serverBrand.promoPosterUrl)) {
          const merged: BrandSettings = {
            brandName: serverBrand.brandName || DEFAULT_BRAND_SETTINGS.brandName,
            brandTagline: serverBrand.brandTagline || DEFAULT_BRAND_SETTINGS.brandTagline,
            logoUrl: serverBrand.logoUrl || DEFAULT_BRAND_SETTINGS.logoUrl,
            promoPosterUrl: serverBrand.promoPosterUrl || '',
            updatedAt: serverBrand.updatedAt || Date.now(),
          };
          setBrandSettings(merged);
          try {
            localStorage.setItem('MMM_BRAND_SETTINGS', JSON.stringify(merged));
          } catch (e) {
            console.warn('Failed to save merged settings to localStorage:', e);
          }
        }
      } catch (e) {
        console.warn('Could not load brand settings from backend:', e);
      }

      const [catList, rewardList] = await Promise.all([
        api.getCatalog().catch(() => []),
        api.getRewards().catch(() => []),
      ]);
      setCatalogItems(catList);
      setRewardCatalog(rewardList);

      let clientList: Client[] = [];
      if (isStaffMode || isDemoMode) {
        const [empList, fetchedClients] = await Promise.all([
          api.getEmployees().catch(() => []),
          api.getClients().catch(() => []),
        ]);
        clientList = fetchedClients;
        if (empList.length > 0) setEmployees(empList);
        if (clientList.length > 0) {
          setAllClients(clientList);
          if (!selectedStaffClient) {
            setSelectedStaffClient(clientList[0]);
          }
        }
      }

      // Check if there is a previously verified session in sessionStorage
      const storedClientId = sessionStorage.getItem('mmm_logged_in_client_id');
      if (storedClientId) {
        try {
          const restoredData = await api.getClientById(storedClientId);
          if (restoredData && restoredData.client) {
            setCurrentClient(restoredData.client);
            setClientData(restoredData);
          }
        } catch (e) {
          console.warn('Could not restore client session from sessionStorage:', e);
          sessionStorage.removeItem('mmm_logged_in_client_id');
          sessionStorage.removeItem('mmm_logged_in_line_user_id');
        }
      } else if (isDemoMode && clientList.length > 0) {
        // Default to first client ONLY for explicit web demo mode (?demo=true)
        const defaultClient = clientList[0];
        setCurrentClient(defaultClient);
        api.getClientById(defaultClient.id).then(setClientData).catch(console.error);
      }
    } catch (err) {
      console.error('Failed to load initial app data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStaffClient]);

  // Ensure staff directory is loaded when switching to staff dashboard or staff logs in
  const ensureStaffData = useCallback(async () => {
    try {
      const [empList, clientList] = await Promise.all([
        api.getEmployees().catch(() => []),
        api.getClients().catch(() => []),
      ]);
      if (empList.length > 0) setEmployees(empList);
      if (clientList.length > 0) {
        setAllClients(clientList);
        if (!selectedStaffClient) {
          setSelectedStaffClient(clientList[0]);
        }
      }
    } catch (err) {
      console.error('Error loading staff background data:', err);
    }
  }, [selectedStaffClient]);

  useEffect(() => {
    if (viewMode === 'staff' || currentStaff) {
      ensureStaffData();
    }
  }, [viewMode, currentStaff, ensureStaffData]);

  // Fetch Full Client Data whenever currentClient changes (for Customer view)
  const refreshCurrentClientData = useCallback(async () => {
    if (!currentClient) return;
    try {
      const fullData = await api.getClientById(currentClient.id);
      setClientData(fullData);
    } catch (err) {
      console.error('Error fetching customer client data:', err);
    }
  }, [currentClient]);

  // Fetch Full Client Data whenever selectedStaffClient changes (for Staff Dashboard)
  const refreshStaffClientData = useCallback(async (clientToFetch?: Client) => {
    const target = clientToFetch || selectedStaffClient;
    if (!target) {
      setStaffClientData(null);
      return;
    }
    try {
      const fullData = await api.getClientById(target.id);
      setStaffClientData(fullData);
    } catch (err) {
      console.error('Error fetching staff selected client data:', err);
    }
  }, [selectedStaffClient]);

  useEffect(() => {
    if (selectedStaffClient) {
      refreshStaffClientData();
    } else {
      setStaffClientData(null);
    }
  }, [selectedStaffClient, refreshStaffClientData]);

  // Load audit logs when opening audit log view
  const loadAuditLogs = useCallback(async () => {
    try {
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    }
  }, []);

  // Initialize LINE LIFF SDK
  const initLiff = useCallback(async () => {
    // Staff mode bypasses LINE LIFF completely
    const isStaff = viewMode === 'staff' || window.location.search.includes('mode=staff') || window.location.search.includes('staff=true');
    if (isStaff) {
      setIsLiffInitializing(false);
      return;
    }

    const isInIframe = window.self !== window.top;
    const liffId = import.meta.env.VITE_LIFF_ID || '2010995653-rGihQSbt';
    if (!liffId) {
      setIsLiffInitializing(false);
      return;
    }

    try {
      setIsLiffInitializing(true);
      setLiffError(null);
      // Immediately reset client state to null before token retrieval or login verification
      setCurrentClient(null);
      setClientData(null);

      await liff.init({ liffId });
      setIsLiffApp(true);

      if (liff.isLoggedIn()) {
        const profile = await liff.getProfile();
        const idToken = liff.getIDToken();
        if (profile && profile.userId) {
          const fullData = await api.lineLogin({
            idToken: idToken || undefined,
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
          });
          setIsLiffLoggedIn(true);
          setCurrentClient(fullData.client);
          setClientData(fullData);
          if (fullData.token || fullData.sessionToken) {
            sessionStorage.setItem('mmm_session_token', fullData.token || fullData.sessionToken || '');
          }
          sessionStorage.setItem('mmm_logged_in_client_id', fullData.client.id);
          sessionStorage.setItem('mmm_logged_in_line_user_id', fullData.client.lineUserId || profile.userId);
          if (!window.location.search.includes('staff=true')) {
            setViewMode('customer');
          }
        } else {
          setIsLiffLoggedIn(false);
        }
      } else {
        // Clear stale client data if user is not logged into LINE
        setCurrentClient(null);
        setClientData(null);
        setIsLiffLoggedIn(false);
        // User is not logged into LINE yet
        // NEVER auto-trigger liff.login() inside an iframe or external web preview,
        // because LINE's security header (X-Frame-Options: DENY) blocks access.line.me in iframes!
        if (liff.isInClient() && !isInIframe) {
          liff.login();
        }
      }
    } catch (err: any) {
      console.warn('LIFF init warning:', err);
      setLiffError(err?.message || 'ไม่สามารถเชื่อมต่อกับ LINE SDK ได้');
    } finally {
      setIsLiffInitializing(false);
    }
  }, [viewMode]);

  const handleManualLineLogin = useCallback(() => {
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      // If inside iframe preview, open LIFF Mini App URL in a new tab to avoid iframe blocking
      window.open('https://miniapp.line.me/2010995653-rGihQSbt', '_blank');
      return;
    }

    try {
      if (liff.isLoggedIn()) {
        initLiff();
      } else {
        liff.login({ redirectUri: window.location.href });
      }
    } catch (err) {
      console.warn('Manual LINE login exception:', err);
      initLiff();
    }
  }, [initLiff]);

  const handleEnableDemoMode = useCallback(async () => {
    try {
      setIsLoading(true);
      const clients = await api.getClients();
      if (clients.length > 0) {
        setCurrentClient(clients[0]);
        const fullData = await api.getClientById(clients[0].id);
        setClientData(fullData);
      }
    } catch (err) {
      console.error('Demo mode error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
    initLiff();
  }, [loadInitialData, initLiff]);

  // Fallback ONLY for explicit demo mode in web browser (?demo=true)
  useEffect(() => {
    const isDemoMode = window.location.search.includes('demo=true');
    if (isDemoMode && viewMode === 'customer' && !clientData && !isLiffLoggedIn && !isLoading) {
      api.getClients().then((clients) => {
        if (clients.length > 0) {
          setCurrentClient(clients[0]);
          api.getClientById(clients[0].id).then(setClientData).catch(console.error);
        }
      }).catch(console.error);
    }
  }, [viewMode, clientData, isLiffLoggedIn, isLoading]);

  // Staff permissions & accessible tabs
  const staffRole = currentStaff?.role || 'staff';
  const canEditCatalog = staffRole === 'admin';
  const canManageBrand = staffRole === 'admin';
  const canViewAuditLogs = staffRole === 'admin' || staffRole === 'manager';
  const canAccessClientOps = staffRole === 'admin' || staffRole === 'manager' || staffRole === 'staff';
  const canAccessFinancial = staffRole === 'admin' || staffRole === 'manager' || staffRole === 'accountant';

  useEffect(() => {
    if (currentStaff) {
      if (!canAccessClientOps && canAccessFinancial) {
        setActiveTab('financial');
      } else if (canAccessClientOps && !canAccessFinancial) {
        setActiveTab('client_ops');
      }
    }
  }, [currentStaff?.id, currentStaff?.role, canAccessClientOps, canAccessFinancial]);

  useEffect(() => {
    if (viewMode === 'customer' && currentClient) {
      if (!currentClient.consentAccepted) {
        setShowConsentModal(true);
      } else if (!currentClient.phone || !currentClient.birthday) {
        setShowProfileSetupModal(true);
      }
    }
  }, [viewMode, currentClient]);

  useEffect(() => {
    if (currentClient) {
      refreshCurrentClientData();
    }
  }, [currentClient, refreshCurrentClientData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 font-sans text-stone-700">
        <div className="w-12 h-12 rounded-2xl bg-amber-800 text-amber-100 flex items-center justify-center font-serif text-2xl font-bold mb-3 shadow-inner">
          M
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Loader2 className="w-5 h-5 text-amber-800 animate-spin" />
          <span>Loading Me.My.Mind Membership App...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-800 selection:bg-amber-200 selection:text-amber-900">
      {/* Universal Top Header Bar */}
      <Header
        viewMode={viewMode}
        setViewMode={(mode) => {
          setViewMode(mode);
          setActiveSubView('main');
        }}
        lang={lang}
        setLang={setLang}
        currentStaff={currentStaff}
        setCurrentStaff={setCurrentStaff}
        employees={employees}
        currentClient={currentClient}
        setCurrentClient={(client) => {
          setCurrentClient(client);
        }}
        allClients={allClients}
        brandSettings={brandSettings}
        onOpenBookings={() => setActiveSubView('bookings')}
        onOpenCatalog={() => setActiveSubView('catalog')}
        onOpenAuditLogs={() => {
          loadAuditLogs();
          setActiveSubView('audit');
        }}
        isLiffLoggedIn={isLiffLoggedIn}
        isLiffApp={isLiffApp}
        onRefreshStaffData={async () => {
          const [freshClients, freshEmps] = await Promise.all([
            api.getClients().catch(() => []),
            api.getEmployees().catch(() => []),
          ]);
          if (freshClients.length > 0) setAllClients(freshClients);
          if (freshEmps.length > 0) setEmployees(freshEmps);
          await refreshStaffClientData();
        }}
      />

      {/* Main Body View Switching */}
      <main className={`py-4 ${viewMode === 'staff' && currentStaff ? 'pb-24' : ''}`}>
        {activeSubView === 'bookings' && currentStaff && currentStaff.role !== 'accountant' ? (
          <BookingsOverview
            lang={lang}
            currentStaff={currentStaff || { id: 'EMP-01', username: 'staff', displayName: 'Staff', role: 'staff' }}
            onBack={() => setActiveSubView('main')}
            onSelectClient={(clientId: string) => {
              const found = allClients.find((c) => c.id === clientId);
              if (found) {
                setSelectedStaffClient(found);
                refreshStaffClientData(found);
              }
              setActiveSubView('main');
            }}
          />
        ) : activeSubView === 'catalog' && currentStaff && currentStaff.role === 'admin' ? (
          <CatalogManagement
            catalogItems={catalogItems}
            currentStaff={currentStaff}
            lang={lang}
            onBack={() => setActiveSubView('main')}
            onRefreshCatalog={async () => {
              const freshCat = await api.getCatalog();
              setCatalogItems(freshCat);
            }}
          />
        ) : activeSubView === 'audit' && currentStaff && (currentStaff.role === 'admin' || currentStaff.role === 'manager') ? (
          <AuditLogView
            logs={auditLogs}
            lang={lang}
            onBack={() => setActiveSubView('main')}
          />
        ) : viewMode === 'customer' ? (
          clientData ? (
            <CustomerApp
              client={clientData.client}
              coinBalance={clientData.coinBalance}
              coinTransactions={clientData.coinTransactions}
              pointsWallet={clientData.pointsWallet}
              pointsTransactions={clientData.pointsTransactions}
              packages={clientData.packages}
              coupons={clientData.coupons}
              oneTimeBookings={clientData.oneTimeBookings}
              notifications={clientData.notifications}
              rewardCatalog={rewardCatalog}
              lang={lang}
              brandSettings={brandSettings}
              onRefresh={refreshCurrentClientData}
              onOpenConsent={() => setShowConsentModal(true)}
              onOpenProfileSetup={() => setShowProfileSetupModal(true)}
            />
          ) : (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-stone-50">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mb-4 shadow-sm border border-amber-200/60">
                <Loader2 className="w-7 h-7 animate-spin text-[#E88D9F]" />
              </div>
              <p className="text-sm font-medium text-stone-700 max-w-xs leading-relaxed">
                {lang === 'th'
                  ? 'กำลังเชื่อมต่อข้อมูลสมาชิกของคุณ กรุณารอสักครู่...'
                  : 'Connecting to your membership account, please wait...'}
              </p>
            </div>
          )
        ) : (
          <StaffDashboard
            currentStaff={currentStaff}
            setCurrentStaff={setCurrentStaff}
            employees={employees}
            allClients={allClients}
            selectedClientData={staffClientData}
            onSelectClient={(clientId) => {
              const found = allClients.find((c) => c.id === clientId);
              if (found) {
                setSelectedStaffClient(found);
                refreshStaffClientData(found);
              }
            }}
            catalogItems={catalogItems}
            rewardCatalog={rewardCatalog}
            lang={lang}
            brandSettings={brandSettings}
            onUpdateBrandSettings={handleUpdateBrandSettings}
            onRefreshClient={async () => {
              const freshClients = await api.getClients();
              setAllClients(freshClients);
              await refreshStaffClientData();
            }}
            onRefreshEmployees={async () => {
              const emps = await api.getEmployees();
              setEmployees(emps);
            }}
            onOpenBookings={() => setActiveSubView('bookings')}
            onOpenCatalog={() => setActiveSubView('catalog')}
            onOpenAuditLogs={() => {
              loadAuditLogs();
              setActiveSubView('audit');
            }}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isBrandModalOpen={isBrandModalOpen}
            setIsBrandModalOpen={setIsBrandModalOpen}
            onOpenExportClients={() => setIsExportModalOpen(true)}
          />
        )}
      </main>

      {/* Consent Modal for First-time Customers */}
      <ConsentModal
        isOpen={showConsentModal}
        initialLang={lang}
        onAccept={async () => {
          let updatedClient = currentClient;
          if (currentClient) {
            try {
              updatedClient = await api.acceptConsent(currentClient.id);
              setCurrentClient(updatedClient);
            } catch (err) {
              console.error('Failed to save consent on server:', err);
            }
          }
          setShowConsentModal(false);
          const targetClient = updatedClient || currentClient;
          if (targetClient && (!targetClient.phone || !targetClient.birthday)) {
            setShowProfileSetupModal(true);
          }
        }}
      />

      {/* Profile Setup Modal for Phone & Birthdate */}
      {currentClient && (
        <ProfileSetupModal
          isOpen={showProfileSetupModal && !showConsentModal}
          client={currentClient}
          allowClose={Boolean(currentClient.phone && currentClient.birthday)}
          onClose={() => setShowProfileSetupModal(false)}
          onSaved={(updatedClient) => {
            setCurrentClient(updatedClient);
            setShowProfileSetupModal(false);
            refreshCurrentClientData();
          }}
        />
      )}

      {/* Universal Staff Management Modals */}
      {viewMode === 'staff' && currentStaff && (
        <>
          <StaffManagementModal
            isOpen={isStaffManagementOpen}
            onClose={() => setIsStaffManagementOpen(false)}
            currentStaff={currentStaff}
            employees={employees}
            onRefreshEmployees={async () => {
              const emps = await api.getEmployees();
              setEmployees(emps);
            }}
          />

          <ChangePasswordModal
            isOpen={isChangePasswordOpen}
            onClose={() => setIsChangePasswordOpen(false)}
            currentStaff={currentStaff}
            onRefreshEmployees={async () => {
              const emps = await api.getEmployees();
              setEmployees(emps);
            }}
          />

          <ExportClientsModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            staffRole={staffRole}
          />

          <FactoryResetModal
            isOpen={isFactoryResetOpen}
            onClose={() => setIsFactoryResetOpen(false)}
            currentStaff={currentStaff}
            onSuccess={async () => {
              const freshClients = await api.getClients();
              setAllClients(freshClients);
              const emps = await api.getEmployees();
              setEmployees(emps);
              await refreshStaffClientData();
            }}
          />

          <BackupSettingsModal
            isOpen={isBackupModalOpen}
            onClose={() => setIsBackupModalOpen(false)}
          />
        </>
      )}

      {/* Universal Fixed Bottom Navigation Bar & Tools Menu for Staff */}
      {viewMode === 'staff' && currentStaff && (
        <>
          {/* Backdrop for Tools Menu Popup */}
          {isToolsMenuOpen && (
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-2xs z-40"
              onClick={() => setIsToolsMenuOpen(false)}
            />
          )}

          {/* Tools / Management Menu (Popup upwards from bottom bar) */}
          {isToolsMenuOpen && (
            <div className="fixed bottom-16 right-4 sm:right-10 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-[#F2E3E1] z-50 p-2.5 space-y-2 divide-y divide-[#FAF0ED] animate-in slide-in-from-bottom-5 duration-200">
              {/* Section 1: Operations & Catalog */}
              <div className="p-1.5 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold text-[#A89F91] uppercase tracking-wider">
                  {lang === 'th' ? 'ข้อมูล & งานบริการ' : 'Services & Reports'}
                </div>

                {staffRole !== 'accountant' && (
                  <button
                    onClick={() => {
                      setActiveSubView('bookings');
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#3D3835] hover:bg-[#FAF0ED] hover:text-[#D87085] rounded-xl transition text-left cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-[#D87085] shrink-0" />
                    <span>{lang === 'th' ? 'ภาพรวมการจอง (Bookings)' : 'Bookings Overview'}</span>
                  </button>
                )}

                {canEditCatalog && (
                  <button
                    onClick={() => {
                      setActiveSubView('catalog');
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#3D3835] hover:bg-[#FAF0ED] hover:text-[#D87085] rounded-xl transition text-left cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-[#D87085] shrink-0" />
                    <span>{translations[lang].viewCatalogBtn}</span>
                  </button>
                )}

                {canViewAuditLogs && (
                  <button
                    onClick={() => {
                      loadAuditLogs();
                      setActiveSubView('audit');
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#3D3835] hover:bg-[#FAF0ED] hover:text-[#D87085] rounded-xl transition text-left cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#D87085] shrink-0" />
                    <span>{translations[lang].viewAuditLogBtn}</span>
                  </button>
                )}

                {(staffRole === 'admin' || staffRole === 'manager') && (
                  <button
                    onClick={() => {
                      setIsExportModalOpen(true);
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#3D3835] hover:bg-[#FAF0ED] hover:text-[#D87085] rounded-xl transition text-left cursor-pointer"
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
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#3D3835] hover:bg-[#FAF0ED] hover:text-[#D87085] rounded-xl transition text-left cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-[#D87085] shrink-0" />
                      <span>{lang === 'th' ? 'จัดการบัญชีพนักงาน & สิทธิ์' : 'Staff & Roles'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveSubView('main');
                        setIsBrandModalOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#3D3835] hover:bg-[#FAF0ED] hover:text-[#D87085] rounded-xl transition text-left cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-[#D87085] shrink-0" />
                      <span>{lang === 'th' ? 'ตั้งค่าโลโก้ & ชื่อแอป' : 'Brand Settings'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsBackupModalOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#3D3835] hover:bg-[#FAF0ED] hover:text-[#D87085] rounded-xl transition text-left cursor-pointer"
                    >
                      <Database className="w-4 h-4 text-[#D87085] shrink-0" />
                      <span>{lang === 'th' ? 'สำรองข้อมูล & รายงานอัตโนมัติ' : 'Auto Backup & Reports'}</span>
                    </button>
                  </>
                )}

                {/* Admin Only: Factory Reset / Data Purge Button */}
                {staffRole === 'admin' && (
                  <button
                    onClick={() => {
                      setIsFactoryResetOpen(true);
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-xl transition text-left group cursor-pointer"
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#3D3835] hover:bg-[#FAF0ED] hover:text-[#D87085] rounded-xl transition text-left cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-[#D87085] shrink-0" />
                    <span>{lang === 'th' ? 'เปลี่ยนรหัสผ่านส่วนตัว' : 'Change Password'}</span>
                  </button>
                )}
              </div>

              {/* Staff Role Badge Info */}
              <div className="px-3 py-2 bg-[#FAF0ED] rounded-xl text-[11px] text-[#6E6763] flex items-center justify-between">
                <span>{lang === 'th' ? 'สิทธิ์ปัจจุบัน:' : 'Current Role:'}</span>
                <span className="font-bold text-[#D87085] bg-white px-2 py-0.5 rounded-md border border-[#F2C2CE] uppercase text-[10px]">
                  {staffRole}
                </span>
              </div>
            </div>
          )}

          {/* Universal Fixed Bottom Navigation Bar (Visible across all subviews in staff mode) */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#F2E3E1] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-40 px-3 py-2">
            <div className="max-w-3xl mx-auto flex items-center justify-around gap-1">
              {/* 1. Bookings Overview */}
              {staffRole !== 'accountant' && (
                <button
                  onClick={() => {
                    setActiveSubView('bookings');
                    setIsToolsMenuOpen(false);
                  }}
                  className={`flex-1 flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] sm:text-xs font-bold transition cursor-pointer ${
                    activeSubView === 'bookings'
                      ? 'text-[#D87085] bg-[#FAF0ED] shadow-2xs font-extrabold'
                      : 'text-[#6E6763] hover:text-[#D87085] hover:bg-[#FAF0ED]'
                  }`}
                >
                  <Calendar className={`w-5 h-5 ${activeSubView === 'bookings' ? 'text-[#D87085]' : 'text-[#8C6D5E]'}`} />
                  <span className="truncate">{lang === 'th' ? 'การจอง' : 'Bookings'}</span>
                </button>
              )}

              {/* 2. Client Management (Active Tab) */}
              {canAccessClientOps && (
                <button
                  onClick={() => {
                    setActiveSubView('main');
                    setActiveTab('client_ops');
                    setIsToolsMenuOpen(false);
                  }}
                  className={`flex-1 flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] sm:text-xs font-bold transition cursor-pointer ${
                    activeSubView === 'main' && activeTab === 'client_ops'
                      ? 'text-[#D87085] bg-[#FAF0ED] shadow-2xs font-extrabold'
                      : 'text-[#6E6763] hover:text-[#D87085] hover:bg-[#FAF0ED]'
                  }`}
                >
                  <User className={`w-5 h-5 ${activeSubView === 'main' && activeTab === 'client_ops' ? 'text-[#D87085]' : 'text-[#8C6D5E]'}`} />
                  <span className="truncate">{lang === 'th' ? 'ลูกค้า' : 'Clients'}</span>
                </button>
              )}

              {/* 3. Financial Dashboard */}
              {canAccessFinancial && (
                <button
                  onClick={() => {
                    setActiveSubView('main');
                    setActiveTab('financial');
                    setIsToolsMenuOpen(false);
                  }}
                  className={`flex-1 flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] sm:text-xs font-bold transition cursor-pointer ${
                    activeSubView === 'main' && activeTab === 'financial'
                      ? 'text-[#D87085] bg-[#FAF0ED] shadow-2xs font-extrabold'
                      : 'text-[#6E6763] hover:text-[#D87085] hover:bg-[#FAF0ED]'
                  }`}
                >
                  <PieChart className={`w-5 h-5 ${activeSubView === 'main' && activeTab === 'financial' ? 'text-[#D87085]' : 'text-[#8C6D5E]'}`} />
                  <span className="truncate">{lang === 'th' ? 'การเงิน' : 'Financial'}</span>
                </button>
              )}

              {/* 4. Catalog */}
              {staffRole === 'admin' && (
                <button
                  onClick={() => {
                    setActiveSubView('catalog');
                    setIsToolsMenuOpen(false);
                  }}
                  className={`flex-1 flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] sm:text-xs font-bold transition cursor-pointer ${
                    activeSubView === 'catalog'
                      ? 'text-[#D87085] bg-[#FAF0ED] shadow-2xs font-extrabold'
                      : 'text-[#6E6763] hover:text-[#D87085] hover:bg-[#FAF0ED]'
                  }`}
                >
                  <Package className={`w-5 h-5 ${activeSubView === 'catalog' ? 'text-[#D87085]' : 'text-[#8C6D5E]'}`} />
                  <span className="truncate">{lang === 'th' ? 'แคตตาล็อก' : 'Catalog'}</span>
                </button>
              )}

              {/* 5. Settings / Management Menu */}
              <button
                onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                className={`flex-1 flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] sm:text-xs font-bold transition cursor-pointer ${
                  isToolsMenuOpen
                    ? 'text-[#D87085] bg-[#FAF0ED] shadow-2xs font-extrabold'
                    : 'text-[#6E6763] hover:text-[#D87085] hover:bg-[#FAF0ED]'
                }`}
              >
                <Settings className={`w-5 h-5 ${isToolsMenuOpen ? 'text-[#D87085]' : 'text-[#8C6D5E]'}`} />
                <span className="truncate">{lang === 'th' ? 'การตั้งค่า' : 'Settings'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
