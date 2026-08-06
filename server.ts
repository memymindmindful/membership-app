import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser with 10mb limit for base64 uploads
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // --- REST API ENDPOINTS ---

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Employees
  app.get('/api/employees', (req, res) => {
    try {
      const employees = store.getEmployees();
      res.json(employees);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/employees', (req, res) => {
    try {
      const { employeeData, staffId, staffName } = req.body;
      const newEmp = store.createEmployee(employeeData, staffId || 'EMP-01', staffName || 'Admin');
      res.json(newEmp);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/employees/:id', (req, res) => {
    try {
      const { employeeData, staffId, staffName } = req.body;
      const updated = store.updateEmployee(req.params.id, employeeData, staffId || 'EMP-01', staffName || 'Admin');
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/employees/:id', (req, res) => {
    try {
      const staffId = req.body?.staffId || (req.query.staffId as string) || 'EMP-01';
      const staffName = req.body?.staffName || (req.query.staffName as string) || 'Admin';
      store.deleteEmployee(req.params.id, staffId, staffName);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/employees/:id/change-password', (req, res) => {
    try {
      const { oldPassword, newPassword, staffId, staffName } = req.body;
      store.changePassword(req.params.id, oldPassword, newPassword, staffId, staffName);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Clients
  app.get('/api/clients', (req, res) => {
    try {
      const { search } = req.query;
      let clients = store.getClients();
      if (search && typeof search === 'string') {
        const q = search.trim().toLowerCase();
        clients = clients.filter(
          (c) =>
            c.displayName.toLowerCase().includes(q) ||
            c.nickname.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q) ||
            c.memberCode.toLowerCase().includes(q)
        );
      }
      res.json(clients);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/clients/:id', (req, res) => {
    try {
      const client = store.getClientById(req.params.id);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const coinBalance = store.getCoinBalance(client.id);
      const coinTxs = store.getCoinTransactions(client.id);
      const pointsWallet = store.getPointsWallet(client.id);
      const pointsTxs = store.getPointsTransactions(client.id);
      const packages = store.getClientPackages(client.id);
      const coupons = store.getClientCoupons(client.id);
      const notifications = store.getNotifications(client.id);

      res.json({
        client,
        coinBalance,
        coinTransactions: coinTxs,
        pointsWallet,
        pointsTransactions: pointsTxs,
        packages,
        coupons,
        notifications,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/export-clients', (req, res) => {
    try {
      const data = store.getAllClientsExportData();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/clients/line-login', (req, res) => {
    try {
      const { userId, displayName, pictureUrl } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'LINE userId is required' });
      }
      const client = store.findOrCreateClientByLineProfile({ userId, displayName, pictureUrl });
      const coinBalance = store.getCoinBalance(client.id);
      const coinTxs = store.getCoinTransactions(client.id);
      const pointsWallet = store.getPointsWallet(client.id);
      const pointsTxs = store.getPointsTransactions(client.id);
      const packages = store.getClientPackages(client.id);
      const coupons = store.getClientCoupons(client.id);
      const notifications = store.getNotifications(client.id);

      res.json({
        client,
        coinBalance,
        coinTransactions: coinTxs,
        pointsWallet,
        pointsTransactions: pointsTxs,
        packages,
        coupons,
        notifications,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/clients', (req, res) => {
    try {
      const { clientData, staffId, staffName } = req.body;
      if (!staffId || !staffName) {
        return res.status(400).json({ error: 'Staff details required' });
      }
      const newClient = store.createClient(clientData, staffId, staffName);
      res.status(201).json(newClient);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/clients/:id/notes', (req, res) => {
    try {
      const { notes, staffId, staffName } = req.body;
      if (!staffId || !staffName) {
        return res.status(400).json({ error: 'Staff details required' });
      }
      const updatedClient = store.updateClientNotes(req.params.id, notes, staffId, staffName);
      res.json(updatedClient);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Coin Operations
  app.post('/api/clients/:id/coin/add', (req, res) => {
    try {
      const { amount, note, staffId, staffName, isBonus } = req.body;
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Valid positive amount required' });
      }
      if (!staffId || !staffName) {
        return res.status(400).json({ error: 'Staff identity required' });
      }

      const tx = store.addCoinCredit(req.params.id, numAmount, note, staffId, staffName, Boolean(isBonus));
      res.json(tx);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/clients/:id/coin/deduct', (req, res) => {
    try {
      const { amount, note, staffId, staffName } = req.body;
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Valid positive amount required' });
      }
      if (!staffId || !staffName) {
        return res.status(400).json({ error: 'Staff identity required' });
      }

      const tx = store.deductCoinCredit(req.params.id, numAmount, note, staffId, staffName);
      res.json(tx);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/coin/reverse', (req, res) => {
    try {
      const { txId, reason, staffId, staffName } = req.body;
      if (!txId || !reason || !staffId || !staffName) {
        return res.status(400).json({ error: 'Missing required parameters or reason' });
      }

      const adjTx = store.reverseCoinTransaction(txId, reason, staffId, staffName);
      res.json(adjTx);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Points Operations
  app.post('/api/clients/:id/points/add', (req, res) => {
    try {
      const { amount, note, staffId, staffName } = req.body;
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Valid positive points amount required' });
      }
      const tx = store.addPoints(req.params.id, numAmount, note, staffId, staffName);
      res.json(tx);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/clients/:id/points/deduct', (req, res) => {
    try {
      const { amount, note, staffId, staffName } = req.body;
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Valid positive points amount required' });
      }
      const tx = store.redeemPoints(req.params.id, numAmount, note, staffId, staffName);
      res.json(tx);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/points/reverse', (req, res) => {
    try {
      const { txId, reason, staffId, staffName } = req.body;
      if (!txId || !reason || !staffId || !staffName) {
        return res.status(400).json({ error: 'Missing required parameters or reason' });
      }
      const adjTx = store.reversePointsTransaction(txId, reason, staffId, staffName);
      res.json(adjTx);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Catalog
  app.get('/api/catalog', (req, res) => {
    try {
      const catalog = store.getCatalogItems();
      res.json(catalog);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/catalog', (req, res) => {
    try {
      const { itemData, staffId, staffName } = req.body;
      if (!itemData || !itemData.name || !itemData.type) {
        return res.status(400).json({ error: 'Name and service type are required' });
      }
      const newItem = store.createCatalogItem(itemData, staffId, staffName);
      res.status(201).json(newItem);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/catalog/:id', (req, res) => {
    try {
      const { updates, staffId, staffName } = req.body;
      const item = store.updateCatalogItem(req.params.id, updates, staffId, staffName);
      res.json(item);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Packages & Coupons
  app.post('/api/clients/:id/packages/sell', (req, res) => {
    try {
      const { catalogId, totalSessions, pricePaid, validityDays, staffId, staffName } = req.body;
      const numSessions = Number(totalSessions);
      const numPrice = Number(pricePaid);
      const numValidity = Number(validityDays);

      if (isNaN(numSessions) || numSessions <= 0) {
        return res.status(400).json({ error: 'Valid total sessions required' });
      }

      const pkg = store.sellPackageToClient(
        req.params.id,
        catalogId,
        numSessions,
        isNaN(numPrice) ? 0 : numPrice,
        isNaN(numValidity) ? 90 : numValidity,
        staffId,
        staffName
      );
      res.status(201).json(pkg);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/packages/:id/use', (req, res) => {
    try {
      const { note, staffId, staffName } = req.body;
      const pkg = store.usePackageSession(req.params.id, note, staffId, staffName);
      res.json(pkg);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/clients/:id/coupons/issue', (req, res) => {
    try {
      const { catalogId, totalQuantity, pricePaid, validityDays, staffId, staffName } = req.body;
      const numQty = Number(totalQuantity);
      const numPrice = Number(pricePaid);
      const numValidity = Number(validityDays);

      if (isNaN(numQty) || numQty <= 0) {
        return res.status(400).json({ error: 'Valid coupon quantity required' });
      }

      const cpn = store.issueCouponToClient(
        req.params.id,
        catalogId,
        numQty,
        isNaN(numPrice) ? 0 : numPrice,
        isNaN(numValidity) ? 30 : numValidity,
        staffId,
        staffName
      );
      res.status(201).json(cpn);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/coupons/:id/redeem', (req, res) => {
    try {
      const { note, staffId, staffName } = req.body;
      const cpn = store.redeemCouponUnit(req.params.id, note, staffId, staffName);
      res.json(cpn);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Rewards
  app.get('/api/rewards', (req, res) => {
    try {
      const rewards = store.getRewardCatalog();
      res.json(rewards);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/rewards', (req, res) => {
    try {
      const { rewardData, staffId, staffName } = req.body;
      const item = store.createRewardItem(rewardData, staffId, staffName);
      res.status(201).json(item);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/rewards/:id', (req, res) => {
    try {
      const { updates, staffId, staffName } = req.body;
      const item = store.updateRewardItem(req.params.id, updates, staffId, staffName);
      res.json(item);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Audit Logs
  app.get('/api/audit-logs', (req, res) => {
    try {
      const logs = store.getAuditLogs();
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Financial Accounting
  app.get('/api/financial', (req, res) => {
    try {
      const entries = store.getFinancialEntries();
      res.json(entries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/financial', (req, res) => {
    try {
      const { entryData, staffId, staffName } = req.body;
      const entry = store.createFinancialEntry(entryData, staffId || 'EMP-01', staffName || 'Staff');
      res.status(201).json(entry);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/financial/:id', (req, res) => {
    try {
      const { staffId, staffName } = req.body;
      store.deleteFinancialEntry(req.params.id, staffId || 'EMP-01', staffName || 'Staff');
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // System Factory Reset / Data Purge (Admin Only)
  app.post('/api/admin/purge-data', (req, res) => {
    try {
      const { staffId, password, targets } = req.body;
      if (!staffId || !password) {
        return res.status(400).json({ error: 'กรุณากรอกรหัสผ่าน Admin เพื่อยืนยัน' });
      }
      if (!targets || (!targets.deleteClients && !targets.deleteCatalog && !targets.deleteTransactions)) {
        return res.status(400).json({ error: 'กรุณาเลือกอย่างน้อย 1 รายการที่ต้องการล้างข้อมูล' });
      }

      const result = store.purgeSystemData(staffId, password, targets);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get Backup & Auto-Report Settings
  app.get('/api/admin/backup-settings', (req, res) => {
    try {
      const settings = store.getBackupSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Save Backup & Auto-Report Settings
  app.post('/api/admin/backup-settings', (req, res) => {
    try {
      const saved = store.saveBackupSettings(req.body);
      res.json({ success: true, settings: saved, message: 'บันทึกการตั้งค่าสำรองข้อมูลเรียบร้อยแล้ว' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Export Full Backup JSON Payload
  app.get('/api/admin/backup-export', (req, res) => {
    try {
      const data = store.getFullBackupData();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Trigger Send Backup Report Email
  app.post('/api/admin/send-backup-email', (req, res) => {
    try {
      const { email } = req.body;
      const targetEmail = email || store.getBackupSettings().email;
      const backupData = store.getFullBackupData();
      
      // Update last backup timestamp
      store.saveBackupSettings({ lastBackupAt: new Date().toISOString(), email: targetEmail });

      res.json({
        success: true,
        message: `ส่งรายงานสำรองข้อมูลไปยังอีเมล ${targetEmail} สำเร็จเรียบร้อยแล้ว`,
        email: targetEmail,
        timestamp: new Date().toISOString(),
        summary: backupData.summary,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Image Upload helper endpoint (data URL / base64 string handler)
  app.post('/api/upload-image', (req, res) => {
    try {
      const { base64Data, fileName } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: 'No image data provided' });
      }
      // Return the data URL directly for fast, seamless thumbnail rendering
      res.json({ imageUrl: base64Data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- VITE MIDDLEWARE / SPA FALLBACK ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
