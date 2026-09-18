import React, { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';

export const SeniorManagerPanel: React.FC<{ username: string; creatorName?: string; isManager: boolean }> = ({ username, creatorName, isManager }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [staff, setStaff] = useState<Array<{ username: string; name: string; role: string }>>([]);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [assignee, setAssignee] = useState('');

  const refresh = useCallback(async () => {
    try { setTasks(await apiClient.getTasks(isManager ? undefined : username)); } catch { setTasks([]); }
  }, [username, isManager]);
  useEffect(() => {
    refresh();
    if (isManager) apiClient.getStaff().then((items) => { setStaff(items); setAssignee((current) => current || items[0]?.username || ''); }).catch(() => setStaff([]));
    const interval = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !assignee) return;
    await apiClient.createTask({ title, details, assigneeUsername: assignee, assigneeName: staff.find((person) => person.username === assignee)?.name || assignee, createdBy: username, createdByName: creatorName || username, priority: 'urgent' });
    setTitle(''); setDetails(''); await refresh();
  };

  const update = async (task: any, status: string) => {
    await apiClient.updateTask(task.id, { status, updatedBy: username, updatedByName: username });
    await refresh();
  };

  return <section className="bg-white border border-[#E6E9DF] rounded-3xl p-5 mb-6" dir="rtl">
    <div className="flex items-center justify-between mb-4">
      <div><h2 className="font-black text-[#2D3A27]">{isManager ? 'داشبورد مدیر ارشد' : 'تیکت‌های وظیفه من'}</h2><p className="text-xs text-[#5C7457] mt-1">پیگیری وظایف تا بسته‌شدن کامل</p></div>
      <span className="text-xs font-bold bg-rose-100 text-rose-800 px-3 py-1 rounded-full">اولویت بالا</span>
    </div>
    {isManager && <form onSubmit={create} className="grid md:grid-cols-4 gap-2 mb-4">
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان وظیفه" className="rounded-xl border px-3 py-2 text-sm" />
      <input value={details} onChange={e => setDetails(e.target.value)} placeholder="شرح و نتیجه مورد انتظار" className="rounded-xl border px-3 py-2 text-sm" />
      <select value={assignee} onChange={e => setAssignee(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" disabled={staff.length === 0}><option value="">{staff.length ? 'انتخاب پرسنل' : 'فهرست پرسنل در دسترس نیست'}</option>{staff.map((person) => <option key={person.username} value={person.username}>{person.name} ({person.username})</option>)}</select>
      <button disabled={!assignee} className="rounded-xl bg-[#4A6741] text-white font-bold px-3 py-2 disabled:opacity-50">ارسال تیکت</button>
    </form>}
    <div className="space-y-2">{tasks.map(task => <div key={task.id} className="border border-[#E6E9DF] rounded-2xl p-3 flex items-center justify-between gap-3">
      <div><div className="font-bold text-sm">{task.title}</div><div className="text-xs text-[#5C7457] mt-1">{task.details} · {task.assigneeName} · {task.status}</div>{Array.isArray(task.updates) && task.updates.length > 0 && <div className="text-[10px] text-[#789071] mt-1">آخرین پیگیری: {task.updates[task.updates.length - 1].status}</div>}</div>
      {!isManager && task.status !== 'completed' && <button onClick={() => update(task, task.status === 'open' ? 'in_progress' : 'completed')} className="text-xs bg-[#E9EFE6] px-3 py-2 rounded-xl font-bold">{task.status === 'open' ? 'شروع کار' : 'بستن تیکت'}</button>}
      {isManager && <span className="text-xs font-bold">{task.status === 'completed' ? 'بسته' : 'باز'}</span>}
    </div>)}{tasks.length === 0 && <div className="text-sm text-[#5C7457]">تیکت فعالی وجود ندارد.</div>}</div>
  </section>;
};
