/**
 * Client API Client for Me.My.Mind Backend
 */

import {
  AuditLog,
  CatalogItem,
  Client,
  ClientCoupon,
  ClientPackage,
  CoinTransaction,
  Employee,
  FinancialEntry,
  InAppNotification,
  PointsTransaction,
  PointsWallet,
  RewardCatalogItem,
  FollowUpStatus,
  ExpiringItemTask,
} from '../types';

export interface FullClientData {
  client: Client;
  coinBalance: number;
  coinTransactions: CoinTransaction[];
  pointsWallet: PointsWallet;
  pointsTransactions: PointsTransaction[];
  packages: ClientPackage[];
  coupons: ClientCoupon[];
  notifications: InAppNotification[];
}

export const api = {
  async getEmployees(): Promise<Employee[]> {
    const res = await fetch('/api/employees');
    if (!res.ok) throw new Error('Failed to fetch employees');
    return res.json();
  },

  async createEmployee(
    employeeData: Partial<Employee>,
    staffId: string,
    staffName: string
  ): Promise<Employee> {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeData, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create employee');
    }
    return res.json();
  },

  async updateEmployee(
    id: string,
    employeeData: Partial<Employee>,
    staffId: string,
    staffName: string
  ): Promise<Employee> {
    const res = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeData, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update employee');
    }
    return res.json();
  },

  async deleteEmployee(id: string, staffId: string, staffName: string): Promise<boolean> {
    const res = await fetch(
      `/api/employees/${id}?staffId=${encodeURIComponent(staffId)}&staffName=${encodeURIComponent(staffName)}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, staffName }),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete employee');
    }
    return true;
  },

  async changePassword(
    id: string,
    oldPassword: string,
    newPassword: string,
    staffId: string,
    staffName: string
  ): Promise<boolean> {
    const res = await fetch(`/api/employees/${id}/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to change password');
    }
    return true;
  },

  async getClients(search?: string): Promise<Client[]> {
    const url = search ? `/api/clients?search=${encodeURIComponent(search)}` : '/api/clients';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch clients');
    return res.json();
  },

  async getExportClientsData(): Promise<any[]> {
    const res = await fetch('/api/admin/export-clients');
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch export data');
    }
    return res.json();
  },

  async getClientById(id: string): Promise<FullClientData> {
    const res = await fetch(`/api/clients/${id}`);
    if (!res.ok) throw new Error('Client profile not found');
    return res.json();
  },

  async createClient(
    clientData: Partial<Client>,
    staffId: string,
    staffName: string
  ): Promise<Client> {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientData, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create client');
    }
    return res.json();
  },

  async updateClientNotes(
    clientId: string,
    notes: string,
    staffId: string,
    staffName: string
  ): Promise<Client> {
    const res = await fetch(`/api/clients/${clientId}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update client notes');
    }
    return res.json();
  },

  async addCoinCredit(
    clientId: string,
    amount: number,
    note: string,
    staffId: string,
    staffName: string,
    isBonus?: boolean
  ): Promise<CoinTransaction> {
    const res = await fetch(`/api/clients/${clientId}/coin/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, note, staffId, staffName, isBonus }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add credit');
    }
    return res.json();
  },

  async deductCoinCredit(
    clientId: string,
    amount: number,
    note: string,
    staffId: string,
    staffName: string
  ): Promise<CoinTransaction> {
    const res = await fetch(`/api/clients/${clientId}/coin/deduct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, note, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to deduct credit');
    }
    return res.json();
  },

  async reverseCoinTransaction(
    txId: string,
    reason: string,
    staffId: string,
    staffName: string
  ): Promise<CoinTransaction> {
    const res = await fetch('/api/coin/reverse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txId, reason, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reverse coin transaction');
    }
    return res.json();
  },

  async addPoints(
    clientId: string,
    amount: number,
    note: string,
    staffId: string,
    staffName: string
  ): Promise<PointsTransaction> {
    const res = await fetch(`/api/clients/${clientId}/points/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, note, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to award points');
    }
    return res.json();
  },

  async redeemPoints(
    clientId: string,
    amount: number,
    note: string,
    staffId: string,
    staffName: string
  ): Promise<PointsTransaction> {
    const res = await fetch(`/api/clients/${clientId}/points/deduct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, note, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to redeem points');
    }
    return res.json();
  },

  async reversePointsTransaction(
    txId: string,
    reason: string,
    staffId: string,
    staffName: string
  ): Promise<PointsTransaction> {
    const res = await fetch('/api/points/reverse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txId, reason, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reverse points transaction');
    }
    return res.json();
  },

  async getCatalog(): Promise<CatalogItem[]> {
    const res = await fetch('/api/catalog');
    if (!res.ok) throw new Error('Failed to fetch service catalog');
    return res.json();
  },

  async createCatalogItem(
    itemData: Partial<CatalogItem>,
    staffId: string,
    staffName: string
  ): Promise<CatalogItem> {
    const res = await fetch('/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemData, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create catalog service');
    }
    return res.json();
  },

  async updateCatalogItem(
    id: string,
    updates: Partial<CatalogItem>,
    staffId: string,
    staffName: string
  ): Promise<CatalogItem> {
    const res = await fetch(`/api/catalog/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update catalog service');
    }
    return res.json();
  },

  async sellPackage(
    clientId: string,
    catalogId: string,
    totalSessions: number,
    pricePaid: number,
    validityDays: number,
    staffId: string,
    staffName: string
  ): Promise<ClientPackage> {
    const res = await fetch(`/api/clients/${clientId}/packages/sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalogId, totalSessions, pricePaid, validityDays, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to sell package');
    }
    return res.json();
  },

  async usePackageSession(
    packageId: string,
    note: string,
    staffId: string,
    staffName: string
  ): Promise<ClientPackage> {
    const res = await fetch(`/api/packages/${packageId}/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record session usage');
    }
    return res.json();
  },

  async issueCoupon(
    clientId: string,
    catalogId: string,
    totalQuantity: number,
    pricePaid: number,
    validityDays: number,
    staffId: string,
    staffName: string
  ): Promise<ClientCoupon> {
    const res = await fetch(`/api/clients/${clientId}/coupons/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catalogId, totalQuantity, pricePaid, validityDays, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to issue coupon');
    }
    return res.json();
  },

  async redeemCoupon(
    couponId: string,
    note: string,
    staffId: string,
    staffName: string
  ): Promise<ClientCoupon> {
    const res = await fetch(`/api/coupons/${couponId}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to redeem coupon');
    }
    return res.json();
  },

  async getRewards(): Promise<RewardCatalogItem[]> {
    const res = await fetch('/api/rewards');
    if (!res.ok) throw new Error('Failed to fetch rewards catalog');
    return res.json();
  },

  async createReward(
    rewardData: Partial<RewardCatalogItem>,
    staffId: string,
    staffName: string
  ): Promise<RewardCatalogItem> {
    const res = await fetch('/api/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rewardData, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create reward item');
    }
    return res.json();
  },

  async updateReward(
    id: string,
    updates: Partial<RewardCatalogItem>,
    staffId: string,
    staffName: string
  ): Promise<RewardCatalogItem> {
    const res = await fetch(`/api/rewards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update reward item');
    }
    return res.json();
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getFinancialEntries(): Promise<FinancialEntry[]> {
    const res = await fetch('/api/financial');
    if (!res.ok) throw new Error('Failed to fetch financial entries');
    return res.json();
  },

  async createFinancialEntry(
    entryData: Partial<FinancialEntry>,
    staffId: string,
    staffName: string
  ): Promise<FinancialEntry> {
    const res = await fetch('/api/financial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryData, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create financial entry');
    }
    return res.json();
  },

  async deleteFinancialEntry(id: string, staffId: string, staffName: string): Promise<boolean> {
    const res = await fetch(`/api/financial/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete financial entry');
    }
    const data = await res.json();
    return data.success;
  },

  async uploadImage(base64Data: string, fileName?: string): Promise<string> {
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data, fileName }),
    });
    if (!res.ok) throw new Error('Failed to upload image');
    const data = await res.json();
    return data.imageUrl;
  },

  async lineLogin(lineProfile: {
    userId: string;
    displayName?: string;
    pictureUrl?: string;
  }): Promise<FullClientData> {
    const res = await fetch('/api/clients/line-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lineProfile),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed LINE login');
    }
    return res.json();
  },

  async purgeSystemData(
    staffId: string,
    password: string,
    targets: { deleteClients?: boolean; deleteCatalog?: boolean; deleteTransactions?: boolean }
  ): Promise<{ success: boolean; message: string; deletedCounts: Record<string, number> }> {
    const res = await fetch('/api/admin/purge-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, password, targets }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to purge system data');
    }
    return res.json();
  },

  async getBackupSettings(): Promise<any> {
    const res = await fetch('/api/admin/backup-settings');
    if (!res.ok) throw new Error('Failed to load backup settings');
    return res.json();
  },

  async saveBackupSettings(settings: any): Promise<any> {
    const res = await fetch('/api/admin/backup-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to save backup settings');
    return res.json();
  },

  async getBackupExportData(): Promise<any> {
    const res = await fetch('/api/admin/backup-export');
    if (!res.ok) throw new Error('Failed to export backup data');
    return res.json();
  },

  async sendBackupEmail(email?: string): Promise<any> {
    const res = await fetch('/api/admin/send-backup-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send backup email');
    }
    return res.json();
  },

  async getExpiringTasks(): Promise<ExpiringItemTask[]> {
    const res = await fetch('/api/expiring-tasks');
    if (!res.ok) throw new Error('Failed to fetch expiring tasks');
    return res.json();
  },

  async updatePackageFollowUp(
    id: string,
    status: FollowUpStatus,
    note: string,
    staffId: string,
    staffName: string
  ): Promise<ClientPackage> {
    const res = await fetch(`/api/packages/${id}/follow-up`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update package follow-up');
    }
    return res.json();
  },

  async updateCouponFollowUp(
    id: string,
    status: FollowUpStatus,
    note: string,
    staffId: string,
    staffName: string
  ): Promise<ClientCoupon> {
    const res = await fetch(`/api/coupons/${id}/follow-up`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note, staffId, staffName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update coupon follow-up');
    }
    return res.json();
  },
};
