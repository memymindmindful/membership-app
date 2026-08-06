import React, { useState } from 'react';
import { ShieldCheck, Search, ArrowLeft, Clock, User, Filter } from 'lucide-react';
import { AppLanguage, AuditLog } from '../types';
import { translations, formatDate } from '../lib/translations';

interface AuditLogViewProps {
  logs: AuditLog[];
  lang: AppLanguage;
  onBack: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, lang, onBack }) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter;

    return matchesSearch && matchesEntity;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D1CEC7]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-white text-[#2D2926] hover:text-black rounded-full border border-[#D1CEC7] shadow-2xs hover:bg-[#F2EDE4] transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-serif italic font-bold text-[#2D2926] flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#8C6D5E]" />
              {t.auditLogTitle}
            </h1>
            <p className="text-xs text-[#2D2926]/70">
              {lang === 'th' 
                ? 'บันทึกประวัติย้อนหลังถาวร ป้องกันการแก้ไข สำหรับยอด Coin, คะแนนสะสม, การตัดแพ็กเกจ/คูปอง และการยกเลิกรายการ' 
                : 'Immutable record of all balance changes, redemptions, catalog updates, & transaction reversals'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#D1CEC7] shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#2D2926]/40" />
          <input
            type="text"
            placeholder={lang === 'th' ? 'ค้นหาตามชื่อพนักงาน, Action หรือหมายเหตุ...' : 'Search by staff name, action, or notes...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#D1CEC7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C6D5E]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#2D2926]/40" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-xs py-2 px-3 border border-[#D1CEC7] rounded-xl bg-white text-[#2D2926] focus:outline-none focus:ring-1 focus:ring-[#8C6D5E]"
          >
            <option value="all">{lang === 'th' ? 'ทุกประเภทรายการ' : 'All Entity Types'}</option>
            <option value="coin">{lang === 'th' ? 'กระเป๋า Coin' : 'Coin Wallet'}</option>
            <option value="points">{lang === 'th' ? 'คะแนนสะสม' : 'Points Wallet'}</option>
            <option value="package">{lang === 'th' ? 'แพ็กเกจ' : 'Package'}</option>
            <option value="coupon">{lang === 'th' ? 'คูปอง' : 'Coupon'}</option>
            <option value="catalog">{lang === 'th' ? 'รายการแคตตาล็อก' : 'Catalog'}</option>
            <option value="client">{lang === 'th' ? 'ข้อมูลลูกค้า' : 'Client'}</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-[#D1CEC7] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F2EDE4] border-b border-[#D1CEC7] text-[#2D2926] font-bold uppercase tracking-wider">
                <th className="p-3.5">{t.auditTimestampHeader}</th>
                <th className="p-3.5">{t.auditStaffHeader}</th>
                <th className="p-3.5">{t.auditActionHeader}</th>
                <th className="p-3.5">{t.auditEntityHeader}</th>
                <th className="p-3.5">{t.auditReasonHeader}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE7E0]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-400">
                    {lang === 'th' ? 'ไม่พบบันทึกประวัติการใช้งานที่ตรงตามเงื่อนไข' : 'No matching audit records found'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-amber-50/30 transition">
                    <td className="p-3.5 text-stone-500 font-mono whitespace-nowrap">
                      {formatDate(log.timestamp, lang)}
                    </td>
                    <td className="p-3.5 font-semibold text-stone-800 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-700" />
                        <span>{log.staffName}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-800 rounded font-mono text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 text-stone-600 font-mono text-[11px] whitespace-nowrap">
                      {log.entityType.toUpperCase()}: {log.entityId}
                    </td>
                    <td className="p-3.5 text-stone-700 max-w-md">
                      {log.reason}
                      {log.newData && (
                        <div className="text-[10px] text-stone-400 font-mono line-clamp-1 mt-0.5">
                          {JSON.stringify(log.newData)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
