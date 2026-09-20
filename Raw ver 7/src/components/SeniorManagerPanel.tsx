import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface SeniorManagerPanelProps {
  username: string;
  creatorName: string;
  isManager?: boolean;
}

interface TaskItem {
  id: string;
  title: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

export const SeniorManagerPanel: React.FC<SeniorManagerPanelProps> = ({
  creatorName,
  isManager = false,
}) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load existing tasks from server if available
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/tasks');
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.data)) {
            setTasks(data.data);
          }
        }
      } catch (err) {
        console.warn('Could not fetch clinic tasks:', err);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsLoading(true);
    try {
      const taskData = {
        title: newTaskTitle.trim(),
        priority,
        status: 'pending',
        creatorName,
        createdAt: new Date().toISOString(),
      };
      const created = await apiClient.createTask(taskData);
      setTasks((prev) => [created || { id: `task_${Date.now()}`, ...taskData }, ...prev]);
      setNewTaskTitle('');
    } catch (err) {
      console.warn('Error creating task:', err);
      // Fallback local update
      setTasks((prev) => [{
        id: `task_${Date.now()}`,
        title: newTaskTitle.trim(),
        priority,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }, ...prev]);
      setNewTaskTitle('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'done' ? 'pending' : 'done';
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus as any } : t))
    );
    try {
      await apiClient.updateTask(taskId, { status: nextStatus });
    } catch (err) {
      console.warn('Failed to update task status:', err);
    }
  };

  return (
    <div className="mb-6 rounded-2xl bg-white border border-[#E6E9DF] shadow-xs p-5" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isManager ? 'bg-[#4A6741]/10 text-[#4A6741]' : 'bg-blue-50 text-blue-700'}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-[#2D3A27]">
              {isManager ? 'پنل مدیریت ارشد کلینیک و ماموریت‌های روز' : 'تابلوی اعلانات و وظایف درمان'}
            </h2>
            <p className="text-xs text-[#5C7457]">
              {isManager ? 'نظارت بر دستورالعمل‌های درمانی و هماهنگی شیفت‌ها' : 'وظایف ارجاع‌شده توسط مدیر درمان'}
            </p>
          </div>
        </div>
      </div>

      {isManager && (
        <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="ثبت دستورالعمل، وظیفه یا اعلان جدید..."
            className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#4A6741]"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white"
          >
            <option value="low">عادی</option>
            <option value="medium">متوسط</option>
            <option value="high">مهم</option>
            <option value="urgent">فوری</option>
          </select>
          <button
            type="submit"
            disabled={isLoading || !newTaskTitle.trim()}
            className="flex items-center gap-1 text-xs font-bold px-4 py-2 bg-[#4A6741] text-white rounded-xl hover:bg-[#3d5535] transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت</span>
          </button>
        </form>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-4 text-xs text-gray-500">
          دستورالعمل یا وظیفه بازی در حال حاضر ثبت نشده است.
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {tasks.slice(0, 5).map((t) => (
            <div
              key={t.id}
              onClick={() => handleToggleStatus(t.id, t.status)}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer ${
                t.status === 'done' ? 'bg-gray-50 border-gray-200 text-gray-400 line-through' : 'bg-[#F7F8F3] border-[#E6E9DF] text-[#2D3A27]'
              }`}
            >
              <div className="flex items-center gap-2">
                {t.status === 'done' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span className="text-xs font-medium">{t.title}</span>
              </div>
              {t.priority === 'urgent' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> فوری
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
