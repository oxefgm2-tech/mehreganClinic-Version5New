import React, { useState } from 'react';
import {
  Clock3,
  Wifi,
  UserCheck,
  CheckCircle2,
  Calendar,
  DollarSign,
  Plus,
  AlertCircle,
  ShieldCheck,
  Smartphone,
  Database,
} from 'lucide-react';
import { StaffAttendance, UserRole } from '../../types';

interface AttendanceTabProps {
  attendanceRecords: StaffAttendance[];
  onClockIn: (staffName: string, role: UserRole) => void;
  onClockOut: (recordId: string) => void;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  attendanceRecords,
  onClockIn,
  onClockOut,
}) => {
  const [clinicWifiSsid] = useState('VetClinic-Staff-5G');
  const [isWifiConnected] = useState(true);
  const [newClockInName, setNewClockInName] = useState('دکتر علیرضا امینی');
  const [newClockInRole, setNewClockInRole] = useState<UserRole>('veterinarian');

  const handleManualClockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClockInName) return;
    onClockIn(newClockInName, newClockInRole);
  };

  return (
    <div id="tab-attendance" className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Banner: Wi-Fi Auto Attendance Tracker */}
      <div className="bg-[#2D3A27] text-white rounded-[32px] p-6 shadow-xs border border-[#4A6741] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 bg-[#4A6741]/50 text-[#D4E0CD] border border-[#D4E0CD]/30 px-3 py-1 rounded-full text-xs font-bold">
              <Wifi className="w-3.5 h-3.5 text-[#D4E0CD]" />
              <span>ثبت هوشمند ورود با وای‌فای داخلی کلینیک</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-black/30 text-[#D4E0CD] border border-white/15 px-3 py-1 rounded-full text-xs font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <Database className="w-3 h-3 text-emerald-400" />
              <span>دیتابیس تردد متصل و پایدار</span>
            </div>
          </div>
          <h2 className="text-xl font-black text-white">سامانه حضور و غیاب و محاسبه کارکرد پرسنل</h2>
          <p className="text-xs text-[#D4E0CD]/90 leading-relaxed">
            به محض اتصال موبایل کادر درمان به شبکه وای‌فای ({clinicWifiSsid})، ساعت ورود ثبت شده و شیفت کاری فعال می‌گردد.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-black/20 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
          <div className="w-10 h-10 rounded-xl bg-[#4A6741] text-white flex items-center justify-center font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="text-[#D4E0CD] font-bold">وضعیت اتصال به شبکه محلی:</div>
            <div className="font-mono text-white text-sm font-black mt-0.5">
              {isWifiConnected ? 'متصل به VetClinic-Staff-5G' : 'عدم اتصال به وای‌فای کلینیک'}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Clock In Bar */}
      <div className="bg-white p-5 rounded-[28px] border border-[#E6E9DF] shadow-xs">
        <form onSubmit={handleManualClockIn} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1">
            <label className="font-bold text-[#2D3A27] whitespace-nowrap">ثبت دستی ورود همکار:</label>
            <select
              value={newClockInName}
              onChange={(e) => {
                setNewClockInName(e.target.value);
                if (e.target.value.includes('دکتر')) setNewClockInRole('veterinarian');
                else if (e.target.value.includes('کمالی')) setNewClockInRole('groomer');
                else if (e.target.value.includes('بیات')) setNewClockInRole('cashier');
                else setNewClockInRole('receptionist');
              }}
              className="bg-[#F7F8F3] border border-[#E6E9DF] rounded-xl px-3 py-2 text-[#2D3A27] font-bold focus:outline-none focus:ring-2 focus:ring-[#4A6741] cursor-pointer flex-1"
            >
              <option value="دکتر امین بیاتی">دکتر امین بیاتی (مدیر و جراح)</option>
              <option value="دکتر کیکاووس کیانی">دکتر کیکاووس کیانی (دامپزشک)</option>
              <option value="دکتر عرفان">دکتر عرفان (دامپزشک)</option>
              <option value="آقا مهدی">آقا مهدی (پذیرش و منشی)</option>
              <option value="آقای سهراب منصوری">آقای سهراب منصوری (آرایشگر و گرومر)</option>
              <option value="سارا بیات">سارا بیات (مسوول صندوق)</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-[#4A6741] hover:bg-[#3D5535] active:scale-95 text-white font-black px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
          >
            <UserCheck className="w-4 h-4" />
            <span>ثبت حضور شیفت امروز</span>
          </button>
        </form>
      </div>

      {/* Attendance Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attendanceRecords.map((att) => (
          <div
            key={att.id}
            className="bg-white rounded-[28px] border border-[#E6E9DF] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#4A6741] transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#D4E0CD] text-[#2D3A27] flex items-center justify-center font-black">
                    {att.staffName.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#2D3A27]">{att.staffName}</h3>
                    <span className="text-[10px] text-[#5C7457] font-medium">نقش: {att.role}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    att.status === 'present'
                      ? 'bg-[#D4E0CD] text-[#2D3A27] font-black'
                      : 'bg-[#F7F8F3] text-[#5C7457] border border-[#E6E9DF]'
                  }`}
                >
                  {att.status === 'present' ? 'حاضر در کلینیک' : 'پایان شیفت'}
                </span>
              </div>

              {/* Time Details */}
              <div className="mt-4 p-3 bg-[#F7F8F3] rounded-2xl border border-[#E6E9DF] text-xs space-y-1.5 font-medium">
                <div className="flex items-center justify-between text-[#2D3A27]">
                  <span className="text-[#5C7457]">ساعت ورود:</span>
                  <span className="font-mono font-bold text-[#4A6741]">{att.clockInTime}</span>
                </div>

                <div className="flex items-center justify-between text-[#2D3A27]">
                  <span className="text-[#5C7457]">ساعت خروج:</span>
                  <span className="font-mono font-bold text-[#2D3A27]">{att.clockOutTime || 'در حال انجام شیفت'}</span>
                </div>

                <div className="flex items-center justify-between text-[#5C7457] text-[11px] pt-1 border-t border-[#E6E9DF]">
                  <span>نوع ورود:</span>
                  <span className="text-[#4A6741] font-bold flex items-center gap-1">
                    {att.deviceWifiSsid ? <Wifi className="w-3 h-3" /> : <Clock3 className="w-3 h-3" />}
                    <span>{att.deviceWifiSsid ? `وای‌فای (${att.deviceWifiSsid})` : 'ثبت دستی'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-[#E6E9DF] flex items-center justify-between">
              <span className="text-[11px] text-[#5C7457] font-mono">{att.date}</span>
              {att.status === 'present' && (
                <button
                  onClick={() => onClockOut(att.id)}
                  className="bg-[#F7F8F3] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-[#E6E9DF] text-[#2D3A27] text-xs font-bold py-1.5 px-3 rounded-xl transition-colors cursor-pointer"
                >
                  ثبت ساعت خروج
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
