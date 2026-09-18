import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, CheckCircle2, Lock } from 'lucide-react';
import { LegalSettings } from '../types';
import { api } from '../services/api';

interface ConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  initialLang?: 'th' | 'en';
  legalSettings?: LegalSettings;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onAccept,
  initialLang = 'th',
  legalSettings,
}) => {
  const [lang, setLang] = useState<'th' | 'en'>(initialLang);
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');
  const [settings, setSettings] = useState<LegalSettings | undefined>(legalSettings);

  const [acceptedPdpa, setAcceptedPdpa] = useState<boolean>(false);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

  useEffect(() => {
    if (legalSettings) {
      setSettings(legalSettings);
    } else if (isOpen) {
      api.getLegalSettings().then(setSettings).catch((err) => {
        console.warn('Failed to load legal settings for consent modal:', err);
      });
    }
  }, [legalSettings, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setAcceptedPdpa(false);
      setAcceptedTerms(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAllChecked = acceptedPdpa && acceptedTerms;

  const bInfo = settings?.businessInfo || {
    businessName: '',
    address: '',
    website: '',
    contactPerson: '',
    email: '',
    phone: '',
    lineId: '',
  };

  const isPdpaCustom = Boolean(
    settings?.pdpa?.useCustom &&
      ((lang === 'th' && settings?.pdpa?.customTextTh?.trim()) ||
        (lang === 'en' && settings?.pdpa?.customTextEn?.trim()))
  );

  const isTermsCustom = Boolean(
    settings?.terms?.useCustom &&
      ((lang === 'th' && settings?.terms?.customTextTh?.trim()) ||
        (lang === 'en' && settings?.terms?.customTextEn?.trim()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] border border-[#F2E3E1] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[#F2E3E1] bg-[#FAF0ED] rounded-t-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E88D9F] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#3D3835]">
                {lang === 'th' ? 'เงื่อนไขและนโยบายความเป็นส่วนตัว' : 'Terms & Privacy Policy'}
              </h2>
              <p className="text-xs text-[#6E6763]">
                {lang === 'th'
                  ? 'กรุณาอ่านและยอมรับข้อตกลงก่อนเริ่มใช้งานแอปพลิเคชันสมาชิก'
                  : 'Please review and accept the terms to proceed with the Membership App'}
              </p>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-white p-1 rounded-full border border-[#F2E3E1] shrink-0 text-xs font-semibold">
            <button
              onClick={() => setLang('th')}
              className={`px-3 py-1 rounded-full transition ${
                lang === 'th'
                  ? 'bg-[#E88D9F] text-white shadow-2xs'
                  : 'text-[#6E6763] hover:text-[#3D3835]'
              }`}
            >
              🇹🇭 TH
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-full transition ${
                lang === 'en'
                  ? 'bg-[#E88D9F] text-white shadow-2xs'
                  : 'text-[#6E6763] hover:text-[#3D3835]'
              }`}
            >
              🇬🇧 EN
            </button>
          </div>
        </div>

        {/* Document Tab Switcher (PDPA / Terms) */}
        <div className="flex border-b border-[#F2E3E1] bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'privacy'
                ? 'border-[#E88D9F] text-[#D87085] bg-[#FFF8F7]'
                : 'border-transparent text-[#6E6763] hover:text-[#3D3835]'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{lang === 'th' ? '1. นโยบาย PDPA' : '1. Privacy Policy (PDPA)'}</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'terms'
                ? 'border-[#E88D9F] text-[#D87085] bg-[#FFF8F7]'
                : 'border-transparent text-[#6E6763] hover:text-[#3D3835]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{lang === 'th' ? '2. ข้อกำหนดการใช้งาน' : '2. Terms of Use'}</span>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-5 overflow-y-auto flex-1 text-xs text-[#4A4441] leading-relaxed space-y-4 bg-[#FCF9F8]">
          {activeTab === 'privacy' ? (
            isPdpaCustom ? (
              <div className="space-y-4 whitespace-pre-wrap font-sans text-xs text-[#3D3835]">
                {lang === 'th' ? settings?.pdpa.customTextTh : settings?.pdpa.customTextEn}
              </div>
            ) : (
              lang === 'th' ? <ThaiPrivacyPolicy bInfo={bInfo} /> : <EnglishPrivacyPolicy bInfo={bInfo} />
            )
          ) : (
            isTermsCustom ? (
              <div className="space-y-4 whitespace-pre-wrap font-sans text-xs text-[#3D3835]">
                {lang === 'th' ? settings?.terms.customTextTh : settings?.terms.customTextEn}
              </div>
            ) : (
              lang === 'th' ? <ThaiTermsOfUse bInfo={bInfo} /> : <EnglishTermsOfUse bInfo={bInfo} />
            )
          )}
        </div>

        {/* Footer with Mandatory Checkboxes & Confirm Button */}
        <div className="p-5 border-t border-[#F2E3E1] bg-white rounded-b-2xl space-y-3">
          <div className="space-y-2 bg-[#FAF0ED] p-3.5 rounded-xl border border-[#F2E3E1]">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs font-medium text-[#3D3835]">
              <input
                type="checkbox"
                checked={acceptedPdpa}
                onChange={(e) => setAcceptedPdpa(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#F2E3E1] text-[#E88D9F] focus:ring-[#E88D9F] accent-[#E88D9F]"
              />
              <span>
                {lang === 'th'
                  ? 'ฉันได้อ่านและยอมรับ นโยบายความเป็นส่วนตัว (PDPA)'
                  : 'I have read and agree to the Privacy Policy (PDPA)'}
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs font-medium text-[#3D3835]">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#F2E3E1] text-[#E88D9F] focus:ring-[#E88D9F] accent-[#E88D9F]"
              />
              <span>
                {lang === 'th'
                  ? 'ฉันได้อ่านและยอมรับ ข้อกำหนดการใช้งานระบบสมาชิก (Terms of Use)'
                  : 'I have read and agree to the Membership Terms of Use'}
              </span>
            </label>
          </div>

          <button
            onClick={() => {
              if (isAllChecked) {
                onAccept();
              }
            }}
            disabled={!isAllChecked}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm ${
              isAllChecked
                ? 'bg-[#E88D9F] hover:bg-[#D87085] text-white cursor-pointer active:scale-[0.99]'
                : 'bg-[#EAE5E3] text-[#A39C98] cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>
              {lang === 'th'
                ? 'ยอมรับและเข้าสู่ระบบใช้งาน'
                : 'Accept & Agree to Continue'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface LegalSectionProps {
  bInfo: LegalSettings['businessInfo'];
}

/* --- Thai Privacy Policy --- */
function ThaiPrivacyPolicy({ bInfo }: LegalSectionProps) {
  const storeName = bInfo.businessName || 'แอปพลิเคชันสมาชิก';
  const address = bInfo.address || '-';
  const website = bInfo.website || '-';
  const contact = [
    bInfo.contactPerson && `ผู้ติดต่อ: ${bInfo.contactPerson}`,
    bInfo.email && `อีเมล: ${bInfo.email}`,
    bInfo.phone && `เบอร์โทรศัพท์: ${bInfo.phone}`,
    bInfo.lineId && `LINE: ${bInfo.lineId}`,
  ].filter(Boolean).join(' | ') || '-';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[#3D3835]">นโยบายความเป็นส่วนตัว — {storeName}</h3>
        <p className="text-[11px] text-[#8C827A]">ปรับปรุงล่าสุด: 2569</p>
      </div>

      <p>
        {storeName} ("เรา") เคารพความเป็นส่วนตัวของท่าน นโยบายฉบับนี้อธิบายว่าเราเก็บรวบรวม ใช้ เปิดเผย และดูแลรักษาข้อมูลส่วนบุคคลของท่านอย่างไรเมื่อท่านใช้งานแอปพลิเคชันสมาชิก ("แอป") ซึ่งจัดทำขึ้นตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
      </p>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">1. ผู้ควบคุมข้อมูลส่วนบุคคล</h4>
        <p><strong>ชื่อผู้ประกอบการ:</strong> {storeName}</p>
        <p><strong>ที่อยู่:</strong> {address}</p>
        <p><strong>เว็บไซต์:</strong> {website}</p>
        <p className="mt-1"><strong>ช่องทางติดต่อเรื่องข้อมูลส่วนบุคคล:</strong> {contact}</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">2. ข้อมูลส่วนบุคคลที่เราเก็บรวบรวม</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>ข้อมูลระบุตัวตน:</strong> ชื่อ-นามสกุล, ชื่อเล่น, วันเกิด, รูปโปรไฟล์ (ท่านให้ไว้เอง หรือดึงจากบัญชี LINE)</li>
          <li><strong>ข้อมูลติดต่อ:</strong> เบอร์โทรศัพท์</li>
          <li><strong>ข้อมูลบัญชี LINE:</strong> LINE User ID (ระบบดึงจาก LINE Login ไม่เก็บรหัสผ่าน)</li>
          <li><strong>รหัสสมาชิก:</strong> Member Code ที่ระบบสร้างให้อัตโนมัติ</li>
          <li><strong>ข้อมูลธุรกรรม:</strong> ยอดเครดิตคงเหลือ, ประวัติการเพิ่ม/ใช้เครดิต, แต้มสะสม, แพ็กเกจ/คอร์ส/คูปอง</li>
          <li><strong>บันทึกจากพนักงาน:</strong> หมายเหตุประกอบรายการ (เช่น อ้างอิงการโอนเงิน)</li>
        </ul>
        <p className="mt-2 text-[#D87085] font-medium bg-[#FFF2F4] p-2 rounded-lg border border-[#FAD0D8]">
          * เราไม่เก็บข้อมูลบัตรเครดิต/เดบิต หรือข้อมูลบัญชีธนาคารของท่านในระบบแอปนี้ การชำระเงินเกิดขึ้นภายนอกระบบเท่านั้น
        </p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">3. วัตถุประสงค์ในการเก็บรวบรวมและใช้ข้อมูล</h4>
        <ol className="list-decimal pl-5 space-y-1">
          <li>สร้างและยืนยันตัวตนบัญชีสมาชิก</li>
          <li>บันทึกและแสดงยอดเครดิต แต้มสะสม แพ็กเกจ และคูปอง</li>
          <li>ให้พนักงานสามารถค้นหาและให้บริการท่านได้ถูกต้องเมื่อมาที่ร้าน</li>
          <li>ส่งการแจ้งเตือนในแอปเกี่ยวกับการเปลี่ยนแปลงยอดหรือสิทธิประโยชน์</li>
          <li>ตรวจสอบและแก้ไขข้อผิดพลาดของรายการ</li>
          <li>ปฏิบัติตามกฎหมายที่เกี่ยวข้อง</li>
        </ol>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">4. ฐานทางกฎหมายในการประมวลผลข้อมูล</h4>
        <p><strong>ความยินยอม:</strong> สำหรับการเข้าสู่ระบบผ่าน LINE Login และรับข้อมูลโปรไฟล์</p>
        <p><strong>ความจำเป็นเพื่อปฏิบัติตามสัญญา:</strong> สำหรับการให้บริการสมาชิกตามที่สมัครใช้งาน</p>
        <p><strong>ประโยชน์โดยชอบด้วยกฎหมาย:</strong> สำหรับการป้องกันข้อผิดพลาดและการตรวจสอบรายการ</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">5. การเปิดเผยข้อมูลแก่บุคคลภายนอก</h4>
        <p>เราจะไม่ขายหรือให้เช่าข้อมูลส่วนบุคคลของท่าน เปิดเผยเฉพาะผู้ประมวลผลข้อมูลเท่าที่จำเป็น เช่น LY Corporation (LINE) และผู้ให้บริการเซิร์ฟเวอร์คลาวด์</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">6. ระยะเวลาในการเก็บรักษาข้อมูล</h4>
        <p>เก็บรักษาไว้ตลอดระยะเวลาที่เป็นสมาชิก และต่อเนื่องตามระยะเวลาที่จำเป็นตามวัตถุประสงค์ทางบัญชีและกฎหมาย</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">7. มาตรการรักษาความปลอดภัยของข้อมูล</h4>
        <p>เข้ารหัสรหัสผ่านพนักงาน, จำกัดสิทธิ์การเข้าถึงข้อมูลตามบทบาท, มีระบบบันทึก Audit Log ทุกรายการ, ตรวจสอบ LINE Login ฝั่งเซิร์ฟเวอร์ และเชื่อมต่อด้วย HTTPS</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">8. สิทธิของเจ้าของข้อมูลส่วนบุคคล (PDPA)</h4>
        <p>ท่านมีสิทธิขอเข้าถึง, ขอแก้ไข, ขอลบหรือทำลาย, ขอระงับการใช้, คัดค้านการประมวลผล, ถอนความยินยอม และสิทธิร้องเรียนต่อ สคส.</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">9. ข้อมูลเกี่ยวกับ LINE Login และ LIFF</h4>
        <p>เราได้รับ LINE User ID, ชื่อที่แสดง และรูปโปรไฟล์จากบัญชี LINE ของท่านเท่านั้น และตรวจสอบยืนยันความถูกต้องผ่านเซิร์ฟเวอร์เสมอ</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">10. การเปลี่ยนแปลงนโยบายและช่องทางติดต่อ</h4>
        <p>ติดต่อสอบถามหรือใช้สิทธิได้ที่: {contact}</p>
      </div>
    </div>
  );
}

/* --- English Privacy Policy --- */
function EnglishPrivacyPolicy({ bInfo }: LegalSectionProps) {
  const storeName = bInfo.businessName || 'Membership App';
  const address = bInfo.address || '-';
  const website = bInfo.website || '-';
  const contact = [
    bInfo.contactPerson && `Contact: ${bInfo.contactPerson}`,
    bInfo.email && `Email: ${bInfo.email}`,
    bInfo.phone && `Tel: ${bInfo.phone}`,
    bInfo.lineId && `LINE: ${bInfo.lineId}`,
  ].filter(Boolean).join(' | ') || '-';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[#3D3835]">Privacy Policy — {storeName}</h3>
        <p className="text-[11px] text-[#8C827A]">Last updated: 2026</p>
      </div>

      <p>
        {storeName} ("we," "us," "the Studio") respects your privacy. This Policy explains how we collect, use, disclose, and protect your personal data when you use the membership application (the "App"), prepared in accordance with Thailand's Personal Data Protection Act B.E. 2562 (2019) ("PDPA").
      </p>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">1. Data Controller</h4>
        <p><strong>Business Name:</strong> {storeName}</p>
        <p><strong>Address:</strong> {address}</p>
        <p><strong>Website:</strong> {website}</p>
        <p className="mt-1"><strong>Contact Information:</strong> {contact}</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">2. Personal Data We Collect</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Identity Data:</strong> Full name, nickname, birthday, profile picture</li>
          <li><strong>Contact Data:</strong> Phone number</li>
          <li><strong>LINE Account Data:</strong> LINE User ID (retrieved via LINE Login)</li>
          <li><strong>Member Code:</strong> Auto-generated unique membership ID</li>
          <li><strong>Transaction Data:</strong> Credit balance, points balance, packages, courses, coupons, and usage logs</li>
          <li><strong>Staff Notes:</strong> Transaction reference notes entered by staff</li>
        </ul>
        <p className="mt-2 text-[#D87085] font-medium bg-[#FFF2F4] p-2 rounded-lg border border-[#FAD0D8]">
          * We do not store payment card or bank account details in this App. Payments occur outside the App.
        </p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">3. Purposes of Processing</h4>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Create and verify your membership account</li>
          <li>Record and display credit balances, points, packages, and coupons</li>
          <li>Enable staff to serve you accurately at the store</li>
          <li>Send in-app notifications regarding balances and benefits</li>
          <li>Investigate and correct transaction errors</li>
          <li>Comply with applicable legal obligations</li>
        </ol>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">4. Legal Bases for Processing</h4>
        <p><strong>Consent:</strong> For LINE Login and profile data retrieval</p>
        <p><strong>Contract Performance:</strong> For delivering membership services</p>
        <p><strong>Legitimate Interests:</strong> For system integrity, security, and audit verification</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">5. Data Sharing & Third Parties</h4>
        <p>We do not sell or rent data. We share data only with essential service processors such as LY Corporation (LINE) and server hosting providers.</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">6. Data Subject Rights (PDPA)</h4>
        <p>You have rights to access, rectify, erase, restrict, object, withdraw consent, and lodge complaints with the PDPC.</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">7. Contact Us</h4>
        <p>Inquiries and rights requests: {contact}</p>
      </div>
    </div>
  );
}

/* --- Thai Terms of Use --- */
function ThaiTermsOfUse({ bInfo }: LegalSectionProps) {
  const storeName = bInfo.businessName || 'แอปพลิเคชันสมาชิก';
  const coinName = bInfo.businessName?.trim() || 'Cash';
  const contact = [
    bInfo.contactPerson && `ผู้ติดต่อ: ${bInfo.contactPerson}`,
    bInfo.email && `อีเมล: ${bInfo.email}`,
    bInfo.phone && `เบอร์โทรศัพท์: ${bInfo.phone}`,
    bInfo.lineId && `LINE: ${bInfo.lineId}`,
  ].filter(Boolean).join(' | ') || '-';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[#3D3835]">ข้อกำหนดการใช้งาน — {storeName}</h3>
        <p className="text-[11px] text-[#8C827A]">ปรับปรุงล่าสุด: 2569</p>
      </div>

      <p>
        ข้อกำหนดการใช้งานนี้ ("ข้อกำหนด") ใช้กับการใช้งานแอปพลิเคชันสมาชิก {storeName} ("แอป") ไม่ว่าจะเข้าถึงผ่าน LINE Official Account หรือช่องทางอื่นใดที่ {storeName} ("ร้าน" "เรา") จัดให้ การสมัครใช้งานหรือใช้งานแอปถือว่าท่านยอมรับข้อกำหนดนี้
      </p>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">1. บัญชีสมาชิก</h4>
        <p>การเข้าใช้งานทำผ่านการเชื่อมต่อบัญชี LINE ของท่าน ท่านมีหน้าที่รักษาความปลอดภัยของบัญชี LINE ของตนเอง ข้อมูลที่ระบุต้องเป็นข้อมูลจริงและเป็นปัจจุบัน</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">2. {coinName} Coin (เครดิตร้าน)</h4>
        <p>{coinName} Coin เป็น<strong>เครดิตภายในร้านสำหรับใช้บริการกับทางร้านเท่านั้น</strong> ไม่ใช่เงินอิเล็กทรอนิกส์ ไม่สามารถถอนเป็นเงินสด โอนให้ผู้อื่น หรือแลกเปลี่ยนเป็นสิ่งอื่นนอกเหนือจากบริการของร้านได้ การเติมเครดิตเกิดขึ้นนอกแอปผ่านการโอนหรือจ่ายสดที่ร้านเท่านั้น</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">3. แพ็กเกจ/คอร์ส และคูปอง</h4>
        <p>แพ็กเกจ คอร์ส และคูปองผูกกับบัญชีสมาชิก ไม่สามารถโอนสิทธิ์ได้ จำนวนครั้งจะถูกตัดโดยพนักงานเมื่อมาใช้บริการที่ร้าน และมีวันหมดอายุตามที่ระบุในแอป</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">4. แต้มสะสมและรางวัล</h4>
        <p>แต้มสะสมไม่มีมูลค่าเป็นเงินสด การแลกรางวัลต้องดำเนินการผ่านพนักงานที่หน้าร้านเท่านั้น</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">5. ความถูกต้องของรายการและข้อพิพาท</h4>
        <p>ทุกรายการจะถูกบันทึกในระบบ หากพบข้อผิดพลาดกรุณาแจ้งพนักงานเพื่อตรวจสอบและบันทึกรายการปรับปรุง (Reversal) การตัดสินของร้านถือเป็นที่สุด</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">6. ช่องทางติดต่อร้าน</h4>
        <p>{storeName} | {contact}</p>
      </div>
    </div>
  );
}

/* --- English Terms of Use --- */
function EnglishTermsOfUse({ bInfo }: LegalSectionProps) {
  const storeName = bInfo.businessName || 'Membership App';
  const coinName = bInfo.businessName?.trim() || 'Cash';
  const contact = [
    bInfo.contactPerson && `Contact: ${bInfo.contactPerson}`,
    bInfo.email && `Email: ${bInfo.email}`,
    bInfo.phone && `Tel: ${bInfo.phone}`,
    bInfo.lineId && `LINE: ${bInfo.lineId}`,
  ].filter(Boolean).join(' | ') || '-';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[#3D3835]">Terms of Use — {storeName}</h3>
        <p className="text-[11px] text-[#8C827A]">Last updated: 2026</p>
      </div>

      <p>
        These Terms of Use ("Terms") govern your use of the {storeName} membership application (the "App"). By registering for or using the App, you agree to these Terms.
      </p>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">1. Membership Account</h4>
        <p>Access is managed via LINE Login. You are responsible for keeping your LINE account secure. Information provided must be accurate.</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">2. {coinName} Coin (In-Store Credit)</h4>
        <p>{coinName} Coin is <strong>in-store credit for shop services only</strong>. It cannot be withdrawn as cash, transferred, or exchanged outside shop services. This App has no online payment gateway.</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">3. Packages, Courses, and Coupons</h4>
        <p>Benefits are tied to your member account and deducted in person by staff. Expired benefits cannot be used or refunded.</p>
      </div>

      <div>
        <h4 className="font-bold text-[#3D3835] mb-1">4. Contact Information</h4>
        <p>{storeName} | {contact}</p>
      </div>
    </div>
  );
}
