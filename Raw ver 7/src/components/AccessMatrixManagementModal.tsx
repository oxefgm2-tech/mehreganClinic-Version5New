import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  Trash2,
  Clock,
  UserCheck,
  Lock,
  Unlock,
  Bell,
  Eye,
} from 'lucide-react';
import {
  RolePermissionRule,
  AccessMatrixSecurityAlert,
  UserRole,
} from '../types';

interface AccessMatrixManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  rolePermissions: RolePermissionRule[];
  onUpdateRolePermissions: (rules: RolePermissionRule[]) => void;
  securityAlerts: AccessMatrixSecurityAlert[];
  onUpdateSecurityAlerts: (alerts: AccessMatrixSecurityAlert[]) => void;
  currentRole: UserRole;
}

export const AccessMatrixManagementModal: React.FC<AccessMatrixManagementModalProps> = ({
  isOpen,
  onClose,
  rolePermissions,
  onUpdateRolePermissions,
  securityAlerts,
  onUpdateSecurityAlerts,
  currentRole,
}) => {
  const [rules, setRules] = useState<RolePermissionRule[]>(rolePermissions);
  const [alerts, setAlerts] = useState<AccessMatrixSecurityAlert[]>(securityAlerts);
  const [selectedRoleToOverride, setSelectedRoleToOverride] = useState<UserRole>('groomer');
  const [overridePermissionKey, setOverridePermissionKey] = useState<keyof RolePermissionRule>('canAccessCashier');
  const [overrideReason, setOverrideReason] = useState('پوشش اضطراری غیبت همکار و تحویل شیفت');
  const [overrideExpiresHours, setOverrideExpiresHours] = useState('6');

  if (!isOpen) return null;

  const handleTogglePermission = (role: UserRole, key: keyof RolePermissionRule) => {
    const updated = rules.map((r) => {
      if (r.role === role) {
        return {
          ...r,
          [key]: !r[key],
        };
      }
      return r;
    });
    setRules(updated);
    onUpdateRolePermissions(updated);
  };

  const handleGrantTemporaryOverride = () => {
    const expiresAt = `امروز، تا ${overrideExpiresHours} ساعت آینده`;
    const targetRule = rules.find((r) => r.role === selectedRoleToOverride);
    if (!targetRule) return;

    const newOverride = {
      permissionKey: overridePermissionKey,
      grantedBy: currentRole === 'admin' ? 'مدیریت کلینیک' : 'ارژنک.پ (کارشناس ارشد آی‌تی)',
      grantedAt: 'امروز، ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      reason: overrideReason,
      isTemporary: true,
      expiresAt,
    };

    const updatedRules = rules.map((r) => {
      if (r.role === selectedRoleToOverride) {
        return {
          ...r,
          [overridePermissionKey]: true,
          customOverrides: [...r.customOverrides, newOverride],
        };
      }
      return r;
    });

    const newAlert: AccessMatrixSecurityAlert = {
      id: `alt-${Date.now()}`,
      role: selectedRoleToOverride,
      targetUserName: selectedRoleToOverride === 'groomer' ? 'آقای سهراب منصوری (آرایشگر)' : selectedRoleToOverride,
      permissionGranted: `اعطای موقت ${overridePermissionKey === 'canAccessCashier' ? 'دسترسی به صندوق' : String(overridePermissionKey)}`,
      grantedBy: currentRole === 'admin' ? 'دکتر امین بیاتی' : 'کارشناس آی‌تی',
      timestamp: 'امروز، ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      status: 'active_alert',
      managerNotes: overrideReason,
    };

    setRules(updatedRules);
    setAlerts([newAlert, ...alerts]);
    onUpdateRolePermissions(updatedRules);
    onUpdateSecurityAlerts([newAlert, ...alerts]);
  };

  const handleRevokeAlert = (alertId: string, role: UserRole) => {
    const updatedAlerts = alerts.map((a) => (a.id === alertId ? { ...a, status: 'revoked' as const } : a));
    setAlerts(updatedAlerts);
    onUpdateSecurityAlerts(updatedAlerts);

    // Turn off permission in rules
    const updatedRules = rules.map((r) => {
      if (r.role === role) {
        return {
          ...r,
          canAccessCashier: false,
          customOverrides: r.customOverrides.filter((o) => o.permissionKey !== 'canAccessCashier'),
        };
      }
      return r;
    });
    setRules(updatedRules);
    onUpdateRolePermissions(updatedRules);
  };

  const handleSilenceAlert = (alertId: string) => {
    const updatedAlerts = alerts.map((a) => (a.id === alertId ? { ...a, status: 'silenced_by_manager' as const } : a));
    setAlerts(updatedAlerts);
    onUpdateSecurityAlerts(updatedAlerts);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FAFBF7] w-full max-w-5xl rounded-2xl shadow-2xl border border-[#E6E9DF] overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#2D3A27] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4A6741] flex items-center justify-center text-white shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">ماتریس دسترسی و تفویض اختیارات سازمانی (RBAC)</h2>
              <p className="text-xs text-[#A3B899]">
                مدیریت سطوح دسترسی، اعطای دسترسی‌های موقت بین‌نقشی و مانیتورینگ امنیتی مدیر کلینیک
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#D0DDD0] hover:text-white p-2 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Active Security Alerts Banner */}
          {alerts.filter((a) => a.status === 'active_alert').length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
                هشدارهای امنیتی دسترسی‌های موقت فعال (نیازمند نظارت مدیر)
              </h4>
              {alerts
                .filter((a) => a.status === 'active_alert')
                .map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-amber-950 flex items-center gap-2">
                          <span>{alert.targetUserName}</span>
                          <span className="bg-amber-200/80 text-amber-900 text-[10px] px-2 py-0.5 rounded-md font-mono">
                            {alert.permissionGranted}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-1">
                          توسط: {alert.grantedBy} | زمان: {alert.timestamp} | علت: {alert.managerNotes}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRevokeAlert(alert.id, alert.role)}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        سلب فوری دسترسی
                      </button>
                      <button
                        onClick={() => handleSilenceAlert(alert.id)}
                        className="bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold px-3 py-1.5 rounded-lg"
                      >
                        بی‌صدا کردن هشدار
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Quick Temporary Delegation Box */}
          <div className="bg-white p-5 rounded-2xl border border-[#E6E9DF] space-y-4">
            <h3 className="text-xs font-bold text-[#2D3A27] flex items-center gap-2">
              <Unlock className="w-4 h-4 text-[#4A6741]" />
              اعطای دسترسی موقت بین‌نقشی (Temporary Role Delegation)
            </h3>
            <p className="text-[11px] text-[#5C7457]">
              در صورت مرخصی یا غیبت همکاران، مدیر می‌تواند دسترسی یک بخش (مانند صندوق برای گرومر) را به مدت محدود فعال کند.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#738A6E] mb-1">نقش هدف</label>
                <select
                  value={selectedRoleToOverride}
                  onChange={(e) => setSelectedRoleToOverride(e.target.value as UserRole)}
                  className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs font-bold text-[#2D3A27] outline-hidden"
                >
                  <option value="groomer">آرایشگر و گرومر (Groomer)</option>
                  <option value="receptionist">پذیرش و نوبت‌دهی (Receptionist)</option>
                  <option value="veterinarian">دامپزشک کشیک (Veterinarian)</option>
                  <option value="petshop_sales">فروشنده پت‌شاپ (Pet Shop Sales)</option>
                  <option value="cashier">صندوقدار (Cashier)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#738A6E] mb-1">مجوز مورد نظر</label>
                <select
                  value={String(overridePermissionKey)}
                  onChange={(e) => setOverridePermissionKey(e.target.value as keyof RolePermissionRule)}
                  className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs font-bold text-[#2D3A27] outline-hidden"
                >
                  <option value="canAccessCashier">دسترسی به صندوق و فاکتور (Cashier)</option>
                  <option value="canAccessPetShop">دسترسی به پت‌شاپ و انبار (Pet Shop)</option>
                  <option value="canAccessGroomingSuite">دسترسی به سوئیت گرومینگ (Grooming)</option>
                  <option value="canAccessMedicalRecords">مشاهده پرونده‌های بالینی (Medical)</option>
                  <option value="canAccessReports">مشاهده گزارشات مالی و مدیریتی (Reports)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#738A6E] mb-1">مدت اعتبار موقت</label>
                <select
                  value={overrideExpiresHours}
                  onChange={(e) => setOverrideExpiresHours(e.target.value)}
                  className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs text-[#2D3A27] outline-hidden"
                >
                  <option value="2">۲ ساعت آینده</option>
                  <option value="6">۶ ساعت آینده (شیفت روزانه)</option>
                  <option value="12">۱۲ ساعت آینده</option>
                  <option value="24">۲۴ ساعت (تا پایان فردا)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#738A6E] mb-1">علت تفویض</label>
                <input
                  type="text"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-[#F7F8F3] border border-[#D5DDD0] rounded-xl px-3 py-2 text-xs text-[#2D3A27] outline-hidden"
                />
              </div>
            </div>

            <button
              onClick={handleGrantTemporaryOverride}
              className="bg-[#4A6741] text-white hover:bg-[#384E31] text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              اعطای دسترسی موقت و صدور هشدار نظارتی
            </button>
          </div>

          {/* RBAC MATRIX TABLE */}
          <div className="bg-white rounded-2xl border border-[#E6E9DF] overflow-hidden shadow-xs">
            <div className="p-4 bg-[#F7F8F3] border-b border-[#E6E9DF] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#2D3A27]">ماتریس جامع سطوح دسترسی نقش‌ها</h3>
              <span className="text-[11px] text-[#738A6E]">تیک‌دار کردن هر بخش فوراً سطح دسترسی نقش را فعال می‌کند</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-[#E6E9DF] bg-white text-[#738A6E] text-[11px]">
                    <th className="p-3 font-bold">نقش سازمانی</th>
                    <th className="p-3 font-bold text-center">صندوق (Cashier)</th>
                    <th className="p-3 font-bold text-center">پت‌شاپ (Pet Shop)</th>
                    <th className="p-3 font-bold text-center">پرونده پزشکی</th>
                    <th className="p-3 font-bold text-center">اتاق عمل (Surgery)</th>
                    <th className="p-3 font-bold text-center">گرومینگ و اصلاح</th>
                    <th className="p-3 font-bold text-center">گزارشات مدیریتی</th>
                    <th className="p-3 font-bold text-center">کنسول آی‌تی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E9DF]">
                  {rules.map((r) => (
                    <tr key={r.role} className="hover:bg-[#FAFBF7] transition-colors">
                      <td className="p-3 font-bold text-[#2D3A27] flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-[#4A6741]" />
                        <span>
                          {r.role === 'admin'
                            ? 'مدیر ارشد (Admin)'
                            : r.role === 'it_developer'
                            ? 'کارشناس توسعه آی‌تی'
                            : r.role === 'veterinarian'
                            ? 'دامپزشک و جراح'
                            : r.role === 'groomer'
                            ? 'آرایشگر و گرومر'
                            : r.role === 'receptionist'
                            ? 'پذیرش و ترخیص'
                            : r.role === 'cashier'
                            ? 'مدیر مالی و صندوق'
                            : r.role === 'petshop_sales'
                            ? 'فروشنده پت‌شاپ'
                            : 'تامین و انبار پت‌شاپ'}
                        </span>
                        {r.customOverrides.length > 0 && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-sm font-bold">
                            دسترسی موقت
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={r.canAccessCashier}
                          onChange={() => handleTogglePermission(r.role, 'canAccessCashier')}
                          className="rounded-sm text-[#4A6741] focus:ring-[#4A6741] w-4 h-4 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={r.canAccessPetShop}
                          onChange={() => handleTogglePermission(r.role, 'canAccessPetShop')}
                          className="rounded-sm text-[#4A6741] focus:ring-[#4A6741] w-4 h-4 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={r.canAccessMedicalRecords}
                          onChange={() => handleTogglePermission(r.role, 'canAccessMedicalRecords')}
                          className="rounded-sm text-[#4A6741] focus:ring-[#4A6741] w-4 h-4 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={r.canAccessSurgerySuite}
                          onChange={() => handleTogglePermission(r.role, 'canAccessSurgerySuite')}
                          className="rounded-sm text-[#4A6741] focus:ring-[#4A6741] w-4 h-4 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={r.canAccessGroomingSuite}
                          onChange={() => handleTogglePermission(r.role, 'canAccessGroomingSuite')}
                          className="rounded-sm text-[#4A6741] focus:ring-[#4A6741] w-4 h-4 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={r.canAccessReports}
                          onChange={() => handleTogglePermission(r.role, 'canAccessReports')}
                          className="rounded-sm text-[#4A6741] focus:ring-[#4A6741] w-4 h-4 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={r.canAccessItDevSuite}
                          onChange={() => handleTogglePermission(r.role, 'canAccessItDevSuite')}
                          className="rounded-sm text-[#4A6741] focus:ring-[#4A6741] w-4 h-4 cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E6E9DF] flex items-center justify-between">
          <div className="text-[11px] text-[#738A6E]">تغییرات به صورت آنی در نشست کاربری پرسنل کلینیک اعمال می‌گردد.</div>
          <button
            onClick={onClose}
            className="bg-[#2D3A27] text-white hover:bg-[#1E271A] px-5 py-2 rounded-xl text-xs font-bold"
          >
            تایید و بستن
          </button>
        </div>
      </div>
    </div>
  );
};
