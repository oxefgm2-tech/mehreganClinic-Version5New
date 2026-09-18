import React from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Users,
  AlertTriangle,
  Syringe,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { NotificationItem, UserRole } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  currentUserRole: UserRole;
  currentUserName: string;
  onUpdateActionStatus: (notifId: string, status: 'done_by_me' | 'done_by_other') => void;
  onMarkAllAsRead: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  currentUserRole,
  currentUserName,
  onUpdateActionStatus,
  onMarkAllAsRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-[#2D3A27]/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white text-[#2D3A27] shadow-2xl flex flex-col border-r border-[#E6E9DF]">
          
          {/* Header */}
          <div className="p-4 border-b border-[#E6E9DF] flex items-center justify-between bg-[#F7F8F3]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#4A6741] text-white flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#2D3A27]">
                  مرکز اعلان‌ها و یادآوری‌های کلینیک
                </h3>
                <p className="text-[11px] text-[#5C7457]">
                  یادآوری‌های مشارکتی پرسنل و آلارم‌های پزشکی
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#5C7457] hover:text-[#2D3A27] rounded-lg hover:bg-[#E6E9DF] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="px-4 py-2 bg-[#F7F8F3] border-b border-[#E6E9DF] flex items-center justify-between text-xs">
            <span className="text-[#5C7457] font-medium">{notifications.length} پیام دریافت شده</span>
            <button
              onClick={onMarkAllAsRead}
              className="text-[#4A6741] hover:text-[#3D5535] font-bold cursor-pointer"
            >
              علامت‌گذاری همه به عنوان خوانده شده
            </button>
          </div>

          {/* List of Notifications */}
          <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-white">
            {notifications.map((notif) => {
              const isActionPending = notif.requiresAction && notif.actionStatus === 'pending';
              const isDoneByMe = notif.actionStatus === 'done_by_me';
              const isDoneByOther = notif.actionStatus === 'done_by_other';

              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    !notif.isRead
                      ? 'bg-[#D4E0CD]/30 border-[#4A6741]/40 shadow-xs'
                      : 'bg-white border-[#E6E9DF]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-[#F7F8F3] text-[#2D3A27] shrink-0 border border-[#E6E9DF]">
                      {notif.type === 'vaccine' && <Syringe className="w-4 h-4 text-[#4A6741]" />}
                      {notif.type === 'document_pending' && <FileText className="w-4 h-4 text-amber-700" />}
                      {notif.type === 'manager_task' && <Users className="w-4 h-4 text-[#4A6741]" />}
                      {notif.type === 'inpatient_alert' && <AlertTriangle className="w-4 h-4 text-rose-700" />}
                      {notif.type === 'system' && <Sparkles className="w-4 h-4 text-[#5C7457]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-[#2D3A27] truncate">{notif.title}</h4>
                        <span className="text-[10px] text-[#5C7457] shrink-0">{notif.createdAt}</span>
                      </div>
                      <p className="text-xs text-[#5C7457] mt-1 leading-relaxed">{notif.message}</p>

                      {/* Collaborative Action Buttons (انجام دادم / دیگری انجام داد) */}
                      {notif.requiresAction && (
                        <div className="mt-3 pt-2.5 border-t border-[#E6E9DF]">
                          {isActionPending ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onUpdateActionStatus(notif.id, 'done_by_me')}
                                className="flex-1 bg-[#4A6741] hover:bg-[#3D5535] text-white font-bold text-xs py-1.5 px-3 rounded-xl flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>انجام دادم</span>
                              </button>
                              <button
                                onClick={() => onUpdateActionStatus(notif.id, 'done_by_other')}
                                className="flex-1 bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] font-bold text-xs py-1.5 px-3 rounded-xl flex items-center justify-center gap-1 border border-[#E6E9DF] transition-all cursor-pointer"
                              >
                                <Users className="w-3.5 h-3.5 text-[#5C7457]" />
                                <span>دیگری انجام داد</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[11px] font-bold">
                              {isDoneByMe && (
                                <span className="text-[#2D3A27] bg-[#D4E0CD] px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-[#4A6741]" />
                                  توسط شما انجام و تایید شد ({currentUserName})
                                </span>
                              )}
                              {isDoneByOther && (
                                <span className="text-[#5C7457] bg-[#F7F8F3] border border-[#E6E9DF] px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  توسط همکار دیگر انجام شد
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};
