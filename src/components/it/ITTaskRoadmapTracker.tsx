import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Sparkles,
  Plus,
  Trash2,
  Filter,
  Check,
  Zap,
  ListTodo,
} from 'lucide-react';
import { ITTaskTodoItem } from '../../types';
import { initialITTasksTodoList } from '../../data/mockDatabase';

interface ITTaskRoadmapTrackerProps {
  onNavigateToSubTab?: (tabKey: string) => void;
}

export const ITTaskRoadmapTracker: React.FC<ITTaskRoadmapTrackerProps> = ({
  onNavigateToSubTab,
}) => {
  const [tasks, setTasks] = useState<ITTaskTodoItem[]>(initialITTasksTodoList);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<ITTaskTodoItem['category']>('pricing');
  const [newPriority, setNewPriority] = useState<ITTaskTodoItem['priority']>('medium');

  const handleToggleComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t))
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: ITTaskTodoItem = {
      id: `todo-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      isCompleted: false,
      assignedTo: 'ارژنک.پ',
      dueDate: 'امروز',
      description: 'ثبت شده توسط کارشناس آی‌تی',
    };

    setTasks([newTask, ...tasks]);
    setNewTitle('');
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const progressPercent = Math.round((completedCount / (tasks.length || 1)) * 100);

  const priorityColors = {
    high: 'bg-rose-100 text-rose-800 border-rose-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4" dir="rtl">
      {/* Header with Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <ListTodo className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              چک‌لیست و نقشه راه اقدامات کارشناس آی‌تی (IT Actionable Roadmap)
            </h3>
            <p className="text-xs text-slate-500">
              پیگیری گام‌های استخراج قیمت، پالایش داده، پایگاه دانش و اتوماسیون پالس‌ها
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-600 font-medium">
            پیشرفت: <span className="font-bold text-indigo-700">{progressPercent}٪</span> ({completedCount} از {tasks.length})
          </div>
          <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Add Task Simple Form */}
      <form onSubmit={handleAddTask} className="flex gap-2 items-center flex-wrap">
        <input
          type="text"
          placeholder="افزودن تسک جدید برای کارشناس آی‌تی یا ایجنت..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 min-w-[220px] px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as any)}
          className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
        >
          <option value="pricing">قیمت‌گذاری</option>
          <option value="migration">مهاجرت</option>
          <option value="database">دیتابیس</option>
          <option value="automation">اتوماسیون</option>
          <option value="security">امنیت</option>
        </select>

        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as any)}
          className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
        >
          <option value="high">اولویت بالا</option>
          <option value="medium">متوسط</option>
          <option value="low">عادی</option>
        </select>

        <button
          type="submit"
          className="flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          افزودن
        </button>
      </form>

      {/* Task List */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto">
        {tasks.map((t) => (
          <div
            key={t.id}
            className={`p-3 rounded-lg border flex items-start justify-between gap-3 transition-all ${
              t.isCompleted
                ? 'bg-slate-50 border-slate-200 opacity-60'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-2.5 flex-1">
              <button
                onClick={() => handleToggleComplete(t.id)}
                className="mt-0.5 text-slate-400 hover:text-indigo-600"
              >
                {t.isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </button>

              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-bold ${
                      t.isCompleted ? 'line-through text-slate-500' : 'text-slate-800'
                    }`}
                  >
                    {t.title}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${
                      priorityColors[t.priority]
                    }`}
                  >
                    {t.priority === 'high' ? 'ضروری' : t.priority === 'medium' ? 'متوسط' : 'عادی'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">{t.description}</p>

                {t.aiRecommendation && !t.isCompleted && (
                  <div className="text-[10px] text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded flex items-center gap-1 mt-1">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>پیشنهاد AI: {t.aiRecommendation}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {t.actionRoute && onNavigateToSubTab && (
                <button
                  onClick={() => onNavigateToSubTab(t.actionRoute!)}
                  className="px-2 py-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded flex items-center gap-0.5"
                >
                  اقدام
                  <ArrowRight className="w-3 h-3 rotate-180" />
                </button>
              )}
              <button
                onClick={() => handleDeleteTask(t.id)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
