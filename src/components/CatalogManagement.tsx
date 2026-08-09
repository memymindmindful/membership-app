import React, { useState, useEffect } from 'react';
import {
  Package,
  Ticket,
  Plus,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Edit2,
  Power,
  Eye,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Award,
  Crown,
  Sparkles,
  Info,
  Filter,
  Search,
  Tag,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Layers,
  Settings2,
  Zap,
} from 'lucide-react';
import { AppLanguage, CatalogItem, CatalogType, Employee, RewardCatalogItem, PointsTier } from '../types';
import { translations, formatCurrency } from '../lib/translations';
import { api } from '../services/api';

interface CatalogManagementProps {
  catalogItems: CatalogItem[];
  currentStaff: Employee;
  lang: AppLanguage;
  onBack: () => void;
  onRefreshCatalog: () => void;
}

export const CatalogManagement: React.FC<CatalogManagementProps> = ({
  catalogItems,
  currentStaff,
  lang,
  onBack,
  onRefreshCatalog,
}) => {
  const t = translations[lang];

  // Active Management Mode Tab ('service' or 'reward')
  const [activeTab, setActiveTab] = useState<'service' | 'reward'>('service');

  // Service Catalog Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [serviceType, setServiceType] = useState<CatalogType>('package');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>(0);
  const [defaultSessions, setDefaultSessions] = useState<number | ''>(10);
  const [validityDays, setValidityDays] = useState<number | ''>(90);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCrmMarketingVoucher, setIsCrmMarketingVoucher] = useState(false);

  // Filter & Keyword Search State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Bulk Price Adjustment Modal State
  const [showBulkPriceModal, setShowBulkPriceModal] = useState<boolean>(false);
  const [bulkAdjustmentType, setBulkAdjustmentType] = useState<'percent' | 'fixed'>('percent');
  const [bulkAdjustmentDirection, setBulkAdjustmentDirection] = useState<'increase' | 'decrease'>('increase');
  const [bulkAdjustmentValue, setBulkAdjustmentValue] = useState<number | ''>(10);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState<boolean>(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Reward Catalog Form State
  const [rewards, setRewards] = useState<RewardCatalogItem[]>([]);
  const [showAddRewardForm, setShowAddRewardForm] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [rewardName, setRewardName] = useState('');
  const [rewardDesc, setRewardDesc] = useState('');
  const [pointsCost, setPointsCost] = useState<number | ''>(250);
  const [minTier, setMinTier] = useState<PointsTier>('Bronze');
  const [rewardImageUrl, setRewardImageUrl] = useState('');
  const [rewardImagePreview, setRewardImagePreview] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Rewards on Mount & Tab Switch
  const loadRewards = async () => {
    try {
      const data = await api.getRewards();
      setRewards(data);
    } catch (err) {
      console.error('Failed to load rewards:', err);
    }
  };

  useEffect(() => {
    loadRewards();
  }, []);

  const resetServiceForm = () => {
    setName('');
    setCategory('');
    setDescription('');
    setPrice(0);
    setDefaultSessions(10);
    setValidityDays(90);
    setImageUrl('');
    setImagePreview(null);
    setIsCrmMarketingVoucher(false);
    setEditingItemId(null);
    setError(null);
  };

  const resetRewardForm = () => {
    setRewardName('');
    setRewardDesc('');
    setPointsCost(250);
    setMinTier('Bronze');
    setRewardImageUrl('');
    setRewardImagePreview(null);
    setEditingRewardId(null);
    setError(null);
  };

  // Image File Upload Handler
  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'service' | 'reward'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(lang === 'th' ? 'ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB' : 'Image file must be under 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const uploadedUrl = await api.uploadImage(base64, file.name);
        if (target === 'service') {
          setImagePreview(base64);
          setImageUrl(uploadedUrl);
        } else {
          setRewardImagePreview(base64);
          setRewardImageUrl(uploadedUrl);
        }
      } catch (err: any) {
        setError(lang === 'th' ? 'ไม่สามารถประมวลผลไฟล์รูปภาพได้' : 'Failed to process image file');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditServiceItem = (item: CatalogItem) => {
    setEditingItemId(item.id);
    setServiceType(item.type);
    setName(item.name);
    setCategory(item.category || '');
    setDescription(item.description);
    setPrice(item.price);
    setDefaultSessions(item.defaultSessions || 10);
    setValidityDays(item.validityDays);
    setImageUrl(item.imageUrl);
    setImagePreview(item.imageUrl);
    setIsCrmMarketingVoucher(item.isCrmMarketingVoucher || false);
    setShowAddForm(true);
  };

  const handleEditRewardItem = (item: RewardCatalogItem) => {
    setEditingRewardId(item.id);
    setRewardName(item.name);
    setRewardDesc(item.description);
    setPointsCost(item.pointsCost);
    setMinTier(item.minTier || 'Bronze');
    setRewardImageUrl(item.imageUrl);
    setRewardImagePreview(item.imageUrl);
    setShowAddRewardForm(true);
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(lang === 'th' ? 'กรุณาระบุชื่อบริการ' : 'Service name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Partial<CatalogItem> = {
        type: serviceType,
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        validityDays: Number(validityDays) || 30,
        defaultSessions: serviceType === 'package' ? Number(defaultSessions) || 1 : undefined,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
        active: true,
        isCrmMarketingVoucher: serviceType === 'coupon' ? isCrmMarketingVoucher : false,
      };

      if (editingItemId) {
        await api.updateCatalogItem(editingItemId, payload, currentStaff.id, currentStaff.displayName);
      } else {
        await api.createCatalogItem(payload, currentStaff.id, currentStaff.displayName);
      }

      resetServiceForm();
      setShowAddForm(false);
      onRefreshCatalog();
    } catch (err: any) {
      setError(err.message || (lang === 'th' ? 'เกิดข้อผิดพลาดในการบันทึกรายการ' : 'Failed to save catalog item'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRewardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardName.trim()) {
      setError(lang === 'th' ? 'กรุณาระบุชื่อของรางวัล' : 'Reward item name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Partial<RewardCatalogItem> = {
        name: rewardName.trim(),
        description: rewardDesc.trim(),
        pointsCost: Number(pointsCost) || 100,
        minTier,
        imageUrl: rewardImageUrl || 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
        active: true,
      };

      if (editingRewardId) {
        await api.updateReward(editingRewardId, payload, currentStaff.id, currentStaff.displayName);
      } else {
        await api.createReward(payload, currentStaff.id, currentStaff.displayName);
      }

      resetRewardForm();
      setShowAddRewardForm(false);
      await loadRewards();
    } catch (err: any) {
      setError(err.message || (lang === 'th' ? 'เกิดข้อผิดพลาดในการบันทึกของรางวัล' : 'Failed to save reward item'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleServiceActive = async (item: CatalogItem) => {
    try {
      await api.updateCatalogItem(
        item.id,
        { active: !item.active },
        currentStaff.id,
        currentStaff.displayName
      );
      onRefreshCatalog();
    } catch (err: any) {
      alert(lang === 'th' ? `เกิดข้อผิดพลาดในการอัปเดตรายการ: ${err.message}` : `Error updating item: ${err.message}`);
    }
  };

  const handleToggleRewardActive = async (item: RewardCatalogItem) => {
    try {
      await api.updateReward(
        item.id,
        { active: !item.active },
        currentStaff.id,
        currentStaff.displayName
      );
      await loadRewards();
    } catch (err: any) {
      alert(lang === 'th' ? `เกิดข้อผิดพลาดในการอัปเดตของรางวัล: ${err.message}` : `Error updating reward: ${err.message}`);
    }
  };

  // Auto-detected category tags and preset keywords
  const presetKeywords = ['Guasha', 'Kansa wands', 'Facial Massage', 'Aromatherapy', 'Spa'];

  // Extract unique categories from catalogItems
  const existingCategories: string[] = Array.from(
    new Set(
      catalogItems
        .map((i) => i.category || '')
        .filter((c): c is string => Boolean(c && c.trim()))
    )
  );

  const filterPills = [
    { id: 'all', label: 'ทั้งหมด (All)' },
    { id: 'package', label: 'คอร์ส (Packages)' },
    { id: 'coupon', label: 'คูปอง (Coupons)' },
    { id: 'onetime', label: 'รายครั้ง (One-Time)' },
    ...presetKeywords.map((kw) => ({ id: kw, label: kw })),
    ...existingCategories
      .filter((c) => !presetKeywords.includes(c))
      .map((cat) => ({ id: cat, label: cat })),
  ];

  // Filtered Catalog Items based on category & search
  const filteredCatalogItems = catalogItems.filter((item) => {
    if (selectedCategory !== 'all') {
      const catLower = selectedCategory.toLowerCase();
      const itemCat = (item.category || '').toLowerCase();
      const itemName = item.name.toLowerCase();
      const itemDesc = item.description.toLowerCase();
      const itemType = item.type;

      if (catLower === 'package') {
        if (itemType !== 'package') return false;
      } else if (catLower === 'coupon') {
        if (itemType !== 'coupon') return false;
      } else if (catLower === 'onetime') {
        if (itemType !== 'onetime') return false;
      } else {
        const matchCat = itemCat.includes(catLower);
        const matchName = itemName.includes(catLower);
        const matchDesc = itemDesc.includes(catLower);
        if (!matchCat && !matchName && !matchDesc) return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCat = (item.category || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }

    return true;
  });

  // Calculate new price preview for an item in bulk modal
  const getCalculatedPrice = (currentPrice: number): number => {
    if (bulkAdjustmentValue === '' || isNaN(Number(bulkAdjustmentValue))) return currentPrice;
    const val = Number(bulkAdjustmentValue);
    const delta = bulkAdjustmentDirection === 'increase' ? val : -val;

    if (bulkAdjustmentType === 'percent') {
      return Math.max(0, Math.round(currentPrice * (1 + delta / 100)));
    } else {
      return Math.max(0, Math.round(currentPrice + delta));
    }
  };

  const handleConfirmBulkPriceAdjustment = async () => {
    if (bulkAdjustmentValue === '' || Number(bulkAdjustmentValue) <= 0) {
      alert(lang === 'th' ? 'กรุณาระบุจำนวนหรือเปอร์เซ็นต์ที่ถูกต้อง' : 'Please enter a valid amount');
      return;
    }

    if (filteredCatalogItems.length === 0) {
      alert(lang === 'th' ? 'ไม่พบรายการที่เลือกในการปรับราคา' : 'No items selected');
      return;
    }

    const val = Number(bulkAdjustmentValue);
    const finalVal = bulkAdjustmentDirection === 'increase' ? val : -val;

    setIsBulkSubmitting(true);
    try {
      const itemIds = filteredCatalogItems.map((i) => i.id);
      await api.bulkUpdateCatalogPrices(
        itemIds,
        bulkAdjustmentType,
        finalVal,
        currentStaff.id,
        currentStaff.displayName
      );

      setBulkSuccessMsg(
        lang === 'th'
          ? `อัปเดตราคา ${filteredCatalogItems.length} รายการ เรียบร้อยแล้ว! (${bulkAdjustmentDirection === 'increase' ? '+' : ''}${finalVal}${bulkAdjustmentType === 'percent' ? '%' : '฿'})`
          : `Bulk price updated for ${filteredCatalogItems.length} items successfully!`
      );
      setTimeout(() => setBulkSuccessMsg(null), 4000);
      setShowBulkPriceModal(false);
      onRefreshCatalog();
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาดในการปรับราคา: ${err.message}`);
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#F2E3E1]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-white text-[#3D3835] hover:text-[#D87085] rounded-full border border-[#F2E3E1] shadow-2xs hover:bg-[#FAF0ED] transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-serif font-bold text-[#3D3835]">{t.catalogPageTitle}</h1>
            <p className="text-xs text-[#6E6763]">
              Manage Packages, Coupons, & Loyalty Reward Catalog Settings
            </p>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="bg-[#FAF0ED] p-1 rounded-full flex items-center border border-[#F2E3E1]">
          <button
            onClick={() => {
              setActiveTab('service');
              setShowAddRewardForm(false);
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              activeTab === 'service'
                ? 'bg-[#E88D9F] text-white shadow-2xs'
                : 'text-[#6E6763] hover:text-[#3D3835]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Packages & Coupons</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('reward');
              setShowAddForm(false);
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              activeTab === 'reward'
                ? 'bg-[#E88D9F] text-white shadow-2xs'
                : 'text-[#6E6763] hover:text-[#3D3835]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Rewards & Tier Rules</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: SERVICE PACKAGES & COUPONS ================= */}
      {activeTab === 'service' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#2D2926] uppercase tracking-wider">
              Service Catalog Templates ({catalogItems.length} items)
            </h2>

            <button
              onClick={() => {
                resetServiceForm();
                setShowAddForm(!showAddForm);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#8C6D5E] hover:bg-[#7A5C4E] text-white text-xs font-semibold rounded-full shadow-2xs transition"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showAddForm ? t.close : t.addNewServiceBtn}</span>
            </button>
          </div>

          {/* Service Add/Edit Form Panel */}
          {showAddForm && (
            <form
              onSubmit={handleServiceSubmit}
              className="bg-white p-6 rounded-2xl border border-[#D1CEC7] shadow-sm space-y-5 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-[#EBE7E0] pb-3">
                <h3 className="text-base font-serif italic font-bold text-[#2D2926]">
                  {editingItemId ? 'Edit Service Template' : t.addNewServiceBtn}
                </h3>
                <span className="text-xs text-[#2D2926]/50">Step 1: Pick Type → Fill details</span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Type Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2D2926] mb-2">
                  {t.serviceTypeLabel}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setServiceType('onetime')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition text-left ${
                      serviceType === 'onetime'
                        ? 'bg-[#F2EDE4] border-[#8C6D5E] text-[#2D2926] ring-2 ring-[#8C6D5E]/20 font-semibold'
                        : 'bg-[#F9F8F6] border-[#D1CEC7] text-[#2D2926]/70 hover:bg-[#F2EDE4]'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${serviceType === 'onetime' ? 'bg-[#8C6D5E] text-white' : 'bg-[#D1CEC7]'}`}>
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">บริการรายครั้ง (One-Time)</span>
                      <p className="text-[10px] text-[#2D2926]/60">เช่น นวดหน้ารายครั้ง 1,500฿, นวดอโรม่า 1,200฿</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('package')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition text-left ${
                      serviceType === 'package'
                        ? 'bg-[#F2EDE4] border-[#8C6D5E] text-[#2D2926] ring-2 ring-[#8C6D5E]/20 font-semibold'
                        : 'bg-[#F9F8F6] border-[#D1CEC7] text-[#2D2926]/70 hover:bg-[#F2EDE4]'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${serviceType === 'package' ? 'bg-[#8C6D5E] text-white' : 'bg-[#D1CEC7]'}`}>
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{t.packageOptionTitle} (คอร์ส)</span>
                      <p className="text-[10px] text-[#2D2926]/60">เช่น คอร์สนวดหน้า 10 ครั้ง, คอร์สนวดอโรม่า 5 ครั้ง</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('coupon')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition text-left ${
                      serviceType === 'coupon'
                        ? 'bg-[#F2EDE4] border-[#8C6D5E] text-[#2D2926] ring-2 ring-[#8C6D5E]/20 font-semibold'
                        : 'bg-[#F9F8F6] border-[#D1CEC7] text-[#2D2926]/70 hover:bg-[#F2EDE4]'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${serviceType === 'coupon' ? 'bg-[#8C6D5E] text-white' : 'bg-[#D1CEC7]'}`}>
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{t.couponOptionTitle} (คูปอง)</span>
                      <p className="text-[10px] text-[#2D2926]/60">เช่น คูปองส่วนลด 500 บาท, ส่วนลดเพิ่มสปา</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* CRM Marketing Voucher Option (Only for Coupons) */}
              {serviceType === 'coupon' && (
                <div className="p-3.5 bg-[#FAF0ED] rounded-xl border border-[#F2E3E1] flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="isCrmMarketingVoucher"
                    checked={isCrmMarketingVoucher}
                    onChange={(e) => setIsCrmMarketingVoucher(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#8C6D5E] border-[#D1CEC7] rounded focus:ring-[#8C6D5E] cursor-pointer"
                  />
                  <label htmlFor="isCrmMarketingVoucher" className="text-xs cursor-pointer select-none">
                    <span className="font-bold text-[#3D3835] block">เป็น CRM Marketing Voucher (แจกฟรีเพื่อการตลาด)</span>
                    <span className="text-[11px] text-[#6E6763] block mt-0.5">
                      คูปองนี้ใช้สำหรับแจกฟรีทางการตลาด — ตอนออกคูปองจะไม่บันทึกเป็นรายรับ และจะบันทึกเป็นรายจ่าย (ต้นทุนบริการ) เมื่อลูกค้านำสิทธิ์มา Redeem จริงเท่านั้น
                    </span>
                  </label>
                </div>
              )}

              {/* Title & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2D2926] mb-1">
                    {t.serviceNameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Organic Gua Sha Course (10 Sessions)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#D1CEC7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6D5E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2D2926] mb-1">
                    {t.servicePriceLabel} (฿)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="15000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-[#D1CEC7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6D5E]"
                  />
                </div>
              </div>

              {/* Category / Keyword Tag Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2D2926] mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#8C6D5E]" />
                    หมวดหมู่ / คีย์เวิร์ด (Category / Keywords)
                  </span>
                  <span className="text-[10px] text-[#2D2926]/50 font-normal">เช่น Guasha, Kansa wands, Facial Massage</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น Guasha, Kansa wands, Facial Massage, Aromatherapy"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#D1CEC7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6D5E] bg-[#FAF8F5]"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
                  <span className="text-[#2D2926]/60 font-semibold">แนะนำ:</span>
                  {['Guasha', 'Kansa wands', 'Facial Massage', 'Aromatherapy', 'Organic Spa'].map((kw) => (
                    <button
                      type="button"
                      key={kw}
                      onClick={() => setCategory(kw)}
                      className="px-2 py-0.5 bg-[#EBE7E0] hover:bg-[#D1CEC7] text-[#2D2926] rounded-md font-medium transition text-[10px]"
                    >
                      + {kw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sessions & Validity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {serviceType === 'package' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#2D2926] mb-1">
                      {t.serviceSessionsLabel}
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="10"
                      value={defaultSessions}
                      onChange={(e) => setDefaultSessions(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 border border-[#D1CEC7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6D5E]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2D2926] mb-1">
                    {t.serviceValidityLabel} (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="180"
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-[#D1CEC7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6D5E]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2D2926] mb-1">
                  {t.serviceDescLabel}
                </label>
                <textarea
                  rows={2}
                  placeholder="Deep cleansing, guasha facial massage, & organic collagen mask..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#D1CEC7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6D5E]"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2D2926] mb-1.5">
                  {t.serviceImageLabel}
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex-1 border-2 border-dashed border-[#D1CEC7] hover:border-[#8C6D5E] bg-[#F9F8F6] hover:bg-[#F2EDE4] rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 text-[#8C6D5E] animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-[#2D2926]/40 mb-1" />
                        <span className="text-xs font-semibold text-[#2D2926]">{t.serviceImageUploadPrompt}</span>
                        <span className="text-[10px] text-[#2D2926]/50">PNG, JPG, WEBP (Max 5MB)</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, 'service')}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>

                  {imagePreview && (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#D1CEC7] shadow-2xs shrink-0">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 text-[9px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                        Thumbnail
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#EBE7E0]">
                <button
                  type="button"
                  onClick={() => {
                    resetServiceForm();
                    setShowAddForm(false);
                  }}
                  className="px-4 py-2 text-xs font-medium text-[#2D2926] bg-[#EBE7E0] hover:bg-[#D1CEC7] rounded-full transition"
                >
                  {t.cancel}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="flex items-center gap-2 px-5 py-2 bg-[#8C6D5E] hover:bg-[#7A5C4E] text-white text-xs font-semibold rounded-full shadow-2xs transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingItemId ? 'Update Template' : 'Save Template'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Bulk Success Alert Message */}
          {bulkSuccessMsg && (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{bulkSuccessMsg}</span>
              </div>
              <button onClick={() => setBulkSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ================= CATEGORY & KEYWORD FILTER BAR ================= */}
          <div className="bg-white p-4 rounded-2xl border border-[#D1CEC7] shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D2926]/40" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อรายการ, หมวดหมู่ (เช่น Guasha, Kansa, Facial)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-[#FAF8F5] border border-[#D1CEC7] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8C6D5E]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#2D2926]/40 hover:text-[#2D2926]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Bulk Price Adjust Button */}
              <button
                type="button"
                onClick={() => setShowBulkPriceModal(true)}
                disabled={filteredCatalogItems.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2D2926] hover:bg-[#1A1816] text-white text-xs font-bold rounded-xl shadow-2xs transition shrink-0 disabled:opacity-40"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>ปรับราคายกหมวดหมู่ ({filteredCatalogItems.length} รายการ)</span>
              </button>
            </div>

            {/* Keyword / Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
              <span className="text-[11px] font-bold text-[#2D2926]/60 shrink-0 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3 text-[#8C6D5E]" />
                ตัวกรองหมวดหมู่:
              </span>

              {filterPills.map((pill) => {
                const isActive = selectedCategory === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setSelectedCategory(pill.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition flex items-center gap-1 shrink-0 ${
                      isActive
                        ? 'bg-[#8C6D5E] text-white shadow-2xs font-semibold'
                        : 'bg-[#F2EDE4] text-[#2D2926]/80 hover:bg-[#EBE7E0] hover:text-[#2D2926]'
                    }`}
                  >
                    <span>{pill.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================= BULK PRICE ADJUSTMENT MODAL ================= */}
          {showBulkPriceModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl border border-[#D1CEC7] shadow-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[#EBE7E0] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#8C6D5E]/10 rounded-xl text-[#8C6D5E]">
                      <Zap className="w-5 h-5 text-[#8C6D5E]" />
                    </div>
                    <div>
                      <h3 className="text-base font-serif font-bold text-[#2D2926]">
                        ปรับราคาทั้งหมวดหมู่ (Bulk Price Adjustment)
                      </h3>
                      <p className="text-xs text-[#2D2926]/60">
                        ปรับขึ้นหรือลดราคาสำหรับรายการในหมวดหมู่ที่เลือก ({filteredCatalogItems.length} รายการ)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBulkPriceModal(false)}
                    className="p-1.5 text-[#2D2926]/50 hover:text-[#2D2926] rounded-full hover:bg-stone-100 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Adjustment Direction & Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Direction */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#2D2926] mb-1.5">
                      รูปแบบการปรับราคา (Direction)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBulkAdjustmentDirection('increase')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          bulkAdjustmentDirection === 'increase'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/20'
                            : 'bg-[#FAF8F5] border-[#D1CEC7] text-[#2D2926]/70 hover:bg-[#F2EDE4]'
                        }`}
                      >
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span>📈 ปรับขึ้นราคา</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBulkAdjustmentDirection('decrease')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          bulkAdjustmentDirection === 'decrease'
                            ? 'bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-400/20'
                            : 'bg-[#FAF8F5] border-[#D1CEC7] text-[#2D2926]/70 hover:bg-[#F2EDE4]'
                        }`}
                      >
                        <TrendingDown className="w-4 h-4 text-rose-600" />
                        <span>📉 ปรับลดราคา</span>
                      </button>
                    </div>
                  </div>

                  {/* Type (% vs ฿) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#2D2926] mb-1.5">
                      หน่วยคำนวณ (Unit)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBulkAdjustmentType('percent')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          bulkAdjustmentType === 'percent'
                            ? 'bg-[#8C6D5E] text-white border-[#8C6D5E]'
                            : 'bg-[#FAF8F5] border-[#D1CEC7] text-[#2D2926]/70 hover:bg-[#F2EDE4]'
                        }`}
                      >
                        <span>เปอร์เซ็นต์ (%)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBulkAdjustmentType('fixed')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          bulkAdjustmentType === 'fixed'
                            ? 'bg-[#8C6D5E] text-white border-[#8C6D5E]'
                            : 'bg-[#FAF8F5] border-[#D1CEC7] text-[#2D2926]/70 hover:bg-[#F2EDE4]'
                        }`}
                      >
                        <span>จำนวนเงิน (฿)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2D2926] mb-1">
                    {bulkAdjustmentType === 'percent' ? 'เปอร์เซ็นต์ที่ต้องการปรับ (%)' : 'จำนวนเงินที่ต้องการปรับ (บาท ฿)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder={bulkAdjustmentType === 'percent' ? 'เช่น 10 (สำหรับ 10%)' : 'เช่น 200 (สำหรับ 200 บาท)'}
                    value={bulkAdjustmentValue}
                    onChange={(e) => setBulkAdjustmentValue(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-[#D1CEC7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6D5E]"
                  />
                </div>

                {/* Live Preview Table */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-[#2D2926] uppercase tracking-wider block">
                    ตัวอย่างราคาหลังปรับเปลี่ยน (Live Preview)
                  </span>

                  <div className="max-h-48 overflow-y-auto border border-[#EBE7E0] rounded-xl divide-y divide-[#EBE7E0]">
                    {filteredCatalogItems.map((item) => {
                      const newPrice = getCalculatedPrice(item.price);
                      const diff = newPrice - item.price;
                      return (
                        <div key={item.id} className="p-3 bg-[#FAF8F5] flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-[#2D2926] block">{item.name}</span>
                            {item.category && (
                              <span className="text-[10px] text-[#8C6D5E] font-medium">[{item.category}]</span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-stone-400 line-through mr-2">฿{formatCurrency(item.price)}</span>
                            <span className="font-bold text-[#2D2926]">฿{formatCurrency(newPrice)}</span>
                            <span className={`block text-[10px] font-bold ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              ({diff >= 0 ? '+' : ''}{formatCurrency(diff)} ฿)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-[#EBE7E0] pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBulkPriceModal(false)}
                    className="px-4 py-2 text-xs font-medium text-[#2D2926] bg-[#EBE7E0] hover:bg-[#D1CEC7] rounded-full transition"
                  >
                    ยกเลิก (Cancel)
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmBulkPriceAdjustment}
                    disabled={isBulkSubmitting || filteredCatalogItems.length === 0}
                    className="flex items-center gap-2 px-5 py-2 bg-[#8C6D5E] hover:bg-[#7A5C4E] text-white text-xs font-semibold rounded-full shadow-2xs transition disabled:opacity-50"
                  >
                    {isBulkSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>กำลังอัปเดตราคา...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>ยืนยันการอัปเดตราคาทั้งหมด</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Catalog List */}
          {filteredCatalogItems.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#D1CEC7] space-y-3">
              <AlertCircle className="w-8 h-8 text-[#8C6D5E] mx-auto opacity-60" />
              <p className="text-sm font-medium text-[#2D2926]/70">ไม่พบรายการสินค้า/บริการที่ตรงกับเงื่อนไขการค้นหา</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="text-xs text-[#8C6D5E] underline font-semibold"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCatalogItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                    item.active ? 'bg-white border-[#D1CEC7] shadow-2xs' : 'bg-[#F2EDE4]/50 border-[#D1CEC7] opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=200&q=80'}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover border border-[#D1CEC7] shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            item.type === 'onetime'
                              ? 'bg-[#8C6D5E] text-white border border-[#7A5C4E]'
                              : item.type === 'package'
                              ? 'bg-[#EBE7E0] text-[#2D2926] border border-[#D1CEC7]'
                              : 'bg-[#A3A895]/20 text-[#2D2926] border border-[#A3A895]/40'
                          }`}
                        >
                          {item.type === 'onetime'
                            ? 'One-Time (รายครั้ง)'
                            : item.type === 'package'
                            ? 'Package (คอร์ส)'
                            : 'Coupon (คูปอง)'}
                        </span>

                        {item.category && (
                          <span className="text-[9px] bg-[#8C6D5E]/10 text-[#8C6D5E] font-bold px-2 py-0.5 rounded-full border border-[#8C6D5E]/20">
                            {item.category}
                          </span>
                        )}

                        {item.isCrmMarketingVoucher && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                            CRM Marketing Voucher (แจกฟรี)
                          </span>
                        )}

                        {!item.active && (
                          <span className="text-[9px] bg-stone-300 text-stone-700 font-bold px-1.5 py-0.5 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-serif italic font-bold text-[#2D2926] leading-snug">{item.name}</h3>
                      <p className="text-xs text-[#2D2926]/70 line-clamp-1">{item.description}</p>

                      <div className="flex flex-wrap gap-x-3 text-[11px] text-[#2D2926]/80 font-medium pt-1">
                        <span className="font-bold text-[#2D2926]">฿{formatCurrency(item.price)}</span>
                        {item.type === 'package' && <span>Sessions: {item.defaultSessions}</span>}
                        <span>Validity: {item.validityDays} days</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => handleEditServiceItem(item)}
                      className="p-1.5 text-[#2D2926]/60 hover:text-[#8C6D5E] bg-[#F9F8F6] hover:bg-[#F2EDE4] rounded-full border border-[#D1CEC7] transition"
                      title="Edit Template"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleToggleServiceActive(item)}
                      className={`p-1.5 rounded-full border text-xs font-semibold flex items-center gap-1 transition ${
                        item.active
                          ? 'bg-[#A3A895]/20 text-[#2D2926] border-[#A3A895] hover:bg-[#A3A895]/30'
                          : 'bg-[#D1CEC7] text-[#2D2926] border-[#D1CEC7]'
                      }`}
                      title="Toggle Active Status"
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: REWARDS & TIER RULES ================= */}
      {activeTab === 'reward' && (
        <div className="space-y-6">
          {/* Tier Configuration & Points Overview Info Card */}
          <div className="bg-[#2D2926] text-[#F5F2ED] p-5 rounded-2xl border border-[#8C6D5E]/40 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-serif italic font-bold text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#A3A895]" />
                Membership Tier Levels & Earning Rules
              </h3>
              <span className="text-[10px] bg-[#8C6D5E] text-white px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                System Rules
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div className="bg-stone-800 p-2.5 rounded-xl border border-stone-700">
                <span className="text-[10px] text-[#A3A895] font-bold uppercase block">Bronze Tier</span>
                <span className="text-white font-bold">0 – 999 Pts</span>
                <p className="text-[10px] text-stone-400 mt-0.5">Basic rewards</p>
              </div>
              <div className="bg-stone-800 p-2.5 rounded-xl border border-stone-700">
                <span className="text-[10px] text-amber-400 font-bold uppercase block">Silver Tier</span>
                <span className="text-white font-bold">1,000 – 2,999 Pts</span>
                <p className="text-[10px] text-stone-400 mt-0.5">Silver exclusive items</p>
              </div>
              <div className="bg-stone-800 p-2.5 rounded-xl border border-stone-700">
                <span className="text-[10px] text-yellow-300 font-bold uppercase block">Gold Tier</span>
                <span className="text-white font-bold">3,000 – 6,999 Pts</span>
                <p className="text-[10px] text-stone-400 mt-0.5">Gold premium perks</p>
              </div>
              <div className="bg-stone-800 p-2.5 rounded-xl border border-stone-700">
                <span className="text-[10px] text-purple-300 font-bold uppercase block">Platinum Tier</span>
                <span className="text-white font-bold">7,000+ Pts</span>
                <p className="text-[10px] text-stone-400 mt-0.5">VIP luxury rewards</p>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-[11px] text-stone-300 pt-2 border-t border-stone-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#A3A895] shrink-0" />
                <p className="font-semibold text-white">แนะนำการตั้งค่าสำหรับบริการพรีเมียม (เช่น นวดหน้า 1,500 บาท):</p>
              </div>
              <p className="pl-5 text-stone-300">
                • <strong>อัตราแจกแต้มที่แนะนำ:</strong> 100 บาท = 1 แต้ม (เช่น นวดหน้า 1,500 บาท ลูกค้าจะได้ <strong>15 แต้ม</strong>)
              </p>
              <p className="pl-5 text-stone-300">
                • <strong>อัตราการแลกรางวัล:</strong> ตั้งค่าแต้มแลกรางวัลให้อยู่ในช่วง <strong>50 - 500 แต้ม</strong> และใช้ระบบ Tier (Bronze, Silver, Gold, Platinum) เพื่อควบคุมไม่ให้แลกง่ายเกินไป
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#2D2926] uppercase tracking-wider">
              Reward Redemption Catalog ({rewards.length} items)
            </h2>

            <button
              onClick={() => {
                resetRewardForm();
                setShowAddRewardForm(!showAddRewardForm);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#8C6D5E] hover:bg-[#7A5C4E] text-white text-xs font-semibold rounded-full shadow-2xs transition"
            >
              {showAddRewardForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showAddRewardForm ? t.close : 'Add New Reward Item'}</span>
            </button>
          </div>

          {/* Reward Add/Edit Form Panel */}
          {showAddRewardForm && (
            <form
              onSubmit={handleRewardSubmit}
              className="bg-white p-6 rounded-2xl border border-[#D1CEC7] shadow-sm space-y-5 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-[#EBE7E0] pb-3">
                <h3 className="text-base font-serif italic font-bold text-[#2D2926]">
                  {editingRewardId ? 'Edit Reward Item' : 'Add New Reward Item'}
                </h3>
                <span className="text-xs text-[#2D2926]/50">Set points cost & required Tier</span>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Title & Points Cost & Required Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2D2926] mb-1">
                    Reward Item Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Organic Herbal Compression Massage"
                    value={rewardName}
                    onChange={(e) => setRewardName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#D1CEC7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6D5E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2D2926] mb-1">
                    Points Required (แต้มที่ต้องใช้)
                  </label>
                  <input
                    type="number"
                    min="10"
                    placeholder="250"
                    value={pointsCost}
                    onChange={(e) => setPointsCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-[#D1CEC7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6D5E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#2D2926] mb-1">
                    Minimum Required Tier (ระดับสิทธิ์)
                  </label>
                  <select
                    value={minTier}
                    onChange={(e) => setMinTier(e.target.value as PointsTier)}
                    className="w-full px-3.5 py-2.5 border border-[#D1CEC7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6D5E] bg-white font-medium text-[#2D2926]"
                  >
                    <option value="Bronze">Bronze Tier (All Members)</option>
                    <option value="Silver">Silver Tier (1,000+ Pts)</option>
                    <option value="Gold">Gold Tier (3,000+ Pts)</option>
                    <option value="Platinum">Platinum Tier (7,000+ Pts)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2D2926] mb-1">
                  Reward Description & Terms
                </label>
                <textarea
                  rows={2}
                  placeholder="Redeem for 1 complimentary session during studio visit..."
                  value={rewardDesc}
                  onChange={(e) => setRewardDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#D1CEC7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6D5E]"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2D2926] mb-1.5">
                  Reward Image / Photo
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex-1 border-2 border-dashed border-[#D1CEC7] hover:border-[#8C6D5E] bg-[#F9F8F6] hover:bg-[#F2EDE4] rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 text-[#8C6D5E] animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-[#2D2926]/40 mb-1" />
                        <span className="text-xs font-semibold text-[#2D2926]">Click to upload reward photo</span>
                        <span className="text-[10px] text-[#2D2926]/50">PNG, JPG, WEBP (Max 5MB)</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, 'reward')}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>

                  {rewardImagePreview && (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#D1CEC7] shadow-2xs shrink-0">
                      <img src={rewardImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 text-[9px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                        Thumbnail
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#EBE7E0]">
                <button
                  type="button"
                  onClick={() => {
                    resetRewardForm();
                    setShowAddRewardForm(false);
                  }}
                  className="px-4 py-2 text-xs font-medium text-[#2D2926] bg-[#EBE7E0] hover:bg-[#D1CEC7] rounded-full transition"
                >
                  {t.cancel}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="flex items-center gap-2 px-5 py-2 bg-[#8C6D5E] hover:bg-[#7A5C4E] text-white text-xs font-semibold rounded-full shadow-2xs transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingRewardId ? 'Update Reward' : 'Save Reward'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Existing Rewards List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                  item.active ? 'bg-white border-[#D1CEC7] shadow-2xs' : 'bg-[#F2EDE4]/50 border-[#D1CEC7] opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=200&q=80'}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover border border-[#D1CEC7] shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#8C6D5E] text-white">
                        {item.pointsCost} Points
                      </span>

                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBE7E0] text-[#2D2926] border border-[#D1CEC7]">
                        Min Tier: {item.minTier || 'Bronze'}
                      </span>

                      {!item.active && (
                        <span className="text-[9px] bg-stone-300 text-stone-700 font-bold px-1.5 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-serif italic font-bold text-[#2D2926] leading-snug">{item.name}</h3>
                    <p className="text-xs text-[#2D2926]/70 line-clamp-2">{item.description}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => handleEditRewardItem(item)}
                    className="p-1.5 text-[#2D2926]/60 hover:text-[#8C6D5E] bg-[#F9F8F6] hover:bg-[#F2EDE4] rounded-full border border-[#D1CEC7] transition"
                    title="Edit Reward Item"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleToggleRewardActive(item)}
                    className={`p-1.5 rounded-full border text-xs font-semibold flex items-center gap-1 transition ${
                      item.active
                        ? 'bg-[#A3A895]/20 text-[#2D2926] border-[#A3A895] hover:bg-[#A3A895]/30'
                        : 'bg-[#D1CEC7] text-[#2D2926] border-[#D1CEC7]'
                    }`}
                    title="Toggle Active Status"
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
