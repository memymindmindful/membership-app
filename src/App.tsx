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
import { ConsentModal } from './components/ConsentModal';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { ConnectingScreen } from './components/ConnectingScreen';
import { Loader2 } from 'lucide-react';
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
  const [activeSubView, setActiveSubView] = useState<'main' | 'catalog' | 'audit'>('main');
  const [lang, setLang] = useState<AppLanguage>('th');
  const [isLiffLoggedIn, setIsLiffLoggedIn] = useState(false);
  const [isLiffApp, setIsLiffApp] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showProfileSetupModal, setShowProfileSetupModal] = useState(false);

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
          };
        }
      }
    } catch (e) {
      console.error('Failed to parse saved brand settings', e);
    }
    return DEFAULT_BRAND_SETTINGS;
  });

  const handleUpdateBrandSettings = (newSettings: BrandSettings) => {
    setBrandSettings(newSettings);
    try {
      localStorage.setItem('MMM_BRAND_SETTINGS', JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save brand settings to localStorage', e);
    }
  };

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentStaff, setCurrentStaff] = useState<Employee | null>(null);

  const [allClients, setAllClients] = useState<Client[]>([]);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [clientData, setClientData] = useState<FullClientData | null>(null);

  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [rewardCatalog, setRewardCatalog] = useState<RewardCatalogItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // Load Initial Base Data
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const isStaffMode = window.location.search.includes('mode=staff') || window.location.search.includes('staff=true');

      if (isStaffMode) {
        const [empList, clientList, catList, rewardList] = await Promise.all([
          api.getEmployees(),
          api.getClients(),
          api.getCatalog(),
          api.getRewards(),
        ]);

        setEmployees(empList);
        if (empList.length > 0) {
          setCurrentStaff(empList[0]);
        }

        setAllClients(clientList);
        if (clientList.length > 0) {
          setCurrentClient(clientList[0]);
        }

        setCatalogItems(catList);
        setRewardCatalog(rewardList);
      } else {
        // Fast customer startup: fetch catalog & rewards only
        const [catList, rewardList] = await Promise.all([
          api.getCatalog(),
          api.getRewards(),
        ]);
        setCatalogItems(catList);
        setRewardCatalog(rewardList);
      }
    } catch (err) {
      console.error('Failed to load initial app data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ensure staff directory is loaded when switching to staff dashboard
  const ensureStaffData = useCallback(async () => {
    if (employees.length === 0 || allClients.length === 0) {
      try {
        const [empList, clientList] = await Promise.all([
          api.getEmployees(),
          api.getClients(),
        ]);
        setEmployees(empList);
        if (!currentStaff && empList.length > 0) setCurrentStaff(empList[0]);
        setAllClients(clientList);
        if (viewMode === 'staff' && !currentClient && clientList.length > 0) {
          setCurrentClient(clientList[0]);
        }
      } catch (err) {
        console.error('Error loading staff background data:', err);
      }
    }
  }, [employees.length, allClients.length, currentStaff, currentClient, viewMode]);

  useEffect(() => {
    if (viewMode === 'staff') {
      ensureStaffData();
    }
  }, [viewMode, ensureStaffData]);

  // Fetch Full Client Data whenever currentClient changes
  const refreshCurrentClientData = useCallback(async () => {
    if (!currentClient) return;
    try {
      const fullData = await api.getClientById(currentClient.id);
      setClientData(fullData);
    } catch (err) {
      console.error('Error fetching client data:', err);
    }
  }, [currentClient]);

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
    const liffId = import.meta.env.VITE_LIFF_ID || '2010995653-rGihQSbt';
    if (!liffId) return;

    try {
      await liff.init({ liffId });
      setIsLiffApp(true);

      if (liff.isLoggedIn()) {
        const profile = await liff.getProfile();
        if (profile && profile.userId) {
          const fullData = await api.lineLogin({
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
          });
          setIsLiffLoggedIn(true);
          setCurrentClient(fullData.client);
          setClientData(fullData);
          if (!window.location.search.includes('staff=true')) {
            setViewMode('customer');
          }
        }
      } else {
        // Auto-trigger LINE Login for unauthenticated users so each device gets its own LINE ID account
        const isDemo = window.location.search.includes('demo=true');
        const isStaff = window.location.search.includes('staff=true');
        if (!isDemo && !isStaff) {
          liff.login();
        }
      }
    } catch (err) {
      console.warn('LIFF init warning (normal if opened outside LINE app):', err);
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

  useEffect(() => {
    const accepted = localStorage.getItem('mmm_pdpa_consent_accepted');
    if (viewMode === 'customer') {
      if (accepted !== 'true') {
        setShowConsentModal(true);
      } else if (currentClient && (!currentClient.phone || !currentClient.birthday)) {
        setShowProfileSetupModal(true);
      }
    }
  }, [viewMode, currentClient]);

  useEffect(() => {
    const isDemoMode = window.location.search.includes('demo=true');
    if (currentClient && (isLiffLoggedIn || isDemoMode || viewMode === 'staff')) {
      refreshCurrentClientData();
    }
  }, [currentClient, isLiffLoggedIn, viewMode, refreshCurrentClientData]);

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
        onOpenCatalog={() => setActiveSubView('catalog')}
        onOpenAuditLogs={() => {
          loadAuditLogs();
          setActiveSubView('audit');
        }}
        isLiffLoggedIn={isLiffLoggedIn}
        isLiffApp={isLiffApp}
      />

      {/* Main Body View Switching */}
      <main className="py-4">
        {activeSubView === 'catalog' && currentStaff && currentStaff.role === 'admin' ? (
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
              notifications={clientData.notifications}
              rewardCatalog={rewardCatalog}
              lang={lang}
              onRefresh={refreshCurrentClientData}
              onOpenConsent={() => setShowConsentModal(true)}
              onOpenProfileSetup={() => setShowProfileSetupModal(true)}
            />
          ) : (
            <ConnectingScreen
              brandSettings={brandSettings}
              onRetry={initLiff}
            />
          )
        ) : (
          <StaffDashboard
            currentStaff={currentStaff}
            setCurrentStaff={setCurrentStaff}
            employees={employees}
            allClients={allClients}
            selectedClientData={clientData}
            onSelectClient={(clientId) => {
              const found = allClients.find((c) => c.id === clientId);
              if (found) setCurrentClient(found);
            }}
            catalogItems={catalogItems}
            lang={lang}
            brandSettings={brandSettings}
            onUpdateBrandSettings={handleUpdateBrandSettings}
            onRefreshClient={async () => {
              const freshClients = await api.getClients();
              setAllClients(freshClients);
              await refreshCurrentClientData();
            }}
            onRefreshEmployees={async () => {
              const emps = await api.getEmployees();
              setEmployees(emps);
            }}
            onOpenCatalog={() => setActiveSubView('catalog')}
            onOpenAuditLogs={() => {
              loadAuditLogs();
              setActiveSubView('audit');
            }}
          />
        )}
      </main>

      {/* Consent Modal for First-time Customers */}
      <ConsentModal
        isOpen={showConsentModal}
        initialLang={lang}
        onAccept={() => {
          localStorage.setItem('mmm_pdpa_consent_accepted', 'true');
          setShowConsentModal(false);
          if (currentClient && (!currentClient.phone || !currentClient.birthday)) {
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
    </div>
  );
}
