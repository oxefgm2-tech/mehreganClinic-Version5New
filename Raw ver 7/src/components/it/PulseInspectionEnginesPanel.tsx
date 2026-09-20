import React, { useState } from 'react';
import {
  Activity,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Code,
  Sparkles,
  Copy,
  Check,
  Send,
  Wrench,
  Shield,
  FileCode,
  ChevronRight,
  Terminal,
  Zap,
} from 'lucide-react';
import { PulseInspectionEngine, InspectionIncidentReport } from '../../types';
import {
  initialPulseInspectionEngines,
  initialInspectionIncidentReports,
} from '../../data/mockDatabase';

interface PulseInspectionEnginesPanelProps {
  onSendDebugPromptToAgent?: (prompt: string) => void;
  onExecuteAutoFixScript?: (scriptSnippet: string) => void;
}

export const PulseInspectionEnginesPanel: React.FC<PulseInspectionEnginesPanelProps> = ({
  onSendDebugPromptToAgent,
  onExecuteAutoFixScript,
}) => {
  const [engines, setEngines] = useState<PulseInspectionEngine[]>(initialPulseInspectionEngines);
  const [reports, setReports] = useState<InspectionIncidentReport[]>(initialInspectionIncidentReports);
  const [selectedEngineId, setSelectedEngineId] = useState<string>(engines[0]?.id || 'engine-1');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [executingFixId, setExecutingFixId] = useState<string | null>(null);

  const selectedEngine = engines.find((e) => e.id === selectedEngineId) || engines[0];

  const handleToggleEngineStatus = (engineId: string) => {
    setEngines((prev) =>
      prev.map((eng) =>
        eng.id === engineId
          ? { ...eng, status: eng.status === 'running' ? 'paused' : 'running' }
          : eng
      )
    );
  };

  const handleRunEngineNow = (engineId: string) => {
    setEngines((prev) =>
      prev.map((eng) =>
        eng.id === engineId
          ? {
              ...eng,
              lastRunTime: 'لحظاتی پیش (دستی اجرا شد)',
              generatedReportsCount: eng.generatedReportsCount + 1,
            }
          : eng
      )
    );

    // If minute engine, add a simulated incident report if needed
    const newRep: InspectionIncidentReport = {
      id: `inc-${Date.now()}`,
      engineId,
      engineName: selectedEngine?.name || 'موتور پالس بازرسی',
      timestamp: 'هم‌اکنون',
      severity: 'info',
      title: 'پالس بازرسی دستی با موفقیت انجام شد',
      analysis: 'تمام متغیرها و وضعیت فرانت‌اند در محدوده ایمن ارزیابی شدند.',
      suggestedDebugPrompt: 'وضعیت سیستم مطلوب است. هیچ اقدام اصلاحی فوری نیاز نیست.',
      resolved: true,
    };
    setReports([newRep, ...reports]);
  };

  const handleCopyPrompt = (promptText: string, reportId: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(reportId);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  const handleRunAutoFix = (rep: InspectionIncidentReport) => {
    if (!rep.autoFixScriptSnippet) return;
    setExecutingFixId(rep.id);
    setTimeout(() => {
      setExecutingFixId(null);
      setReports((prev) =>
        prev.map((r) => (r.id === rep.id ? { ...r, resolved: true } : r))
      );
      if (onExecuteAutoFixScript) {
        onExecuteAutoFixScript(rep.autoFixScriptSnippet);
      }
    }, 1000);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
            <Activity className="w-5 h-5 animate-pulse" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              موتورهای پالس اسکریپتی و مانیتورینگ دوره‌ای (Pulse Inspection Engines)
            </h2>
            <p className="text-xs text-slate-500">
              اجرای دوره‌ای و زمان‌بندی شده اسکریپت‌های کلاینت‌ساید با ریتم‌های ۱ دقیقه‌ای، ساعتی و روزانه جهت کشف خطاها و مغایرت‌ها
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            {engines.filter((e) => e.status === 'running').length} موتور فعال
          </span>
        </div>
      </div>

      {/* Grid: Engines list & Script detail + Incident reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 5 cols: Engines List & Configuration */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 px-1">لیست موتورهای پالس مانیتورینگ:</h3>
          <div className="space-y-2.5">
            {engines.map((eng) => {
              const isSelected = selectedEngineId === eng.id;
              const isRunning = eng.status === 'running';
              return (
                <div
                  key={eng.id}
                  onClick={() => setSelectedEngineId(eng.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock
                        className={`w-4 h-4 ${
                          isSelected
                            ? 'text-emerald-400'
                            : isRunning
                            ? 'text-emerald-600'
                            : 'text-slate-400'
                        }`}
                      />
                      <span className="text-xs font-bold">{eng.name}</span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                        isSelected
                          ? 'bg-slate-800 text-emerald-300'
                          : isRunning
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {eng.pulseIntervalDisplay}
                    </span>
                  </div>

                  <p
                    className={`text-[11px] mt-2 line-clamp-2 leading-relaxed ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {eng.description}
                  </p>

                  <div
                    className={`flex items-center justify-between mt-3 pt-2.5 border-t text-[11px] ${
                      isSelected ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                    }`}
                  >
                    <span>آخرین اجرا: {eng.lastRunTime}</span>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleEngineStatus(eng.id)}
                        className={`p-1 rounded-md text-[10px] font-semibold flex items-center gap-1 px-2 ${
                          isRunning
                            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        }`}
                      >
                        {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        {isRunning ? 'توقف' : 'شروع'}
                      </button>

                      <button
                        onClick={() => handleRunEngineNow(eng.id)}
                        className="p-1 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[10px] font-semibold flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        اجرای فوری
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Engine Script Preview Box */}
          {selectedEngine && (
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Code className="w-3.5 h-3.5 text-indigo-400" />
                  کد اسکریپت پالس بازرسی
                </span>
                <span className="text-[10px] text-emerald-400">Pure Client-Side</span>
              </div>
              <pre className="text-[11px] font-mono leading-relaxed bg-black/50 p-2.5 rounded-lg overflow-x-auto text-emerald-300">
                {selectedEngine.scriptCode}
              </pre>
            </div>
          )}
        </div>

        {/* Right 7 cols: Incident Reports & AI Suggested Debugging */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-700">
              گزارش حوادث و هشدارهای تولید شده توسط موتورهای بازرسی ({reports.length}):
            </h3>
            <span className="text-[11px] text-slate-400">
              همراه با تحلیل و پرامپت آماده برای ارسال به ایجنت هوشمند
            </span>
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {reports.map((rep) => {
              const isWarning = rep.severity === 'warning';
              const isCritical = rep.severity === 'critical';
              const isCopied = copiedPromptId === rep.id;
              const isFixing = executingFixId === rep.id;

              return (
                <div
                  key={rep.id}
                  className={`p-4 rounded-xl border transition-all ${
                    rep.resolved
                      ? 'bg-white border-slate-200'
                      : isCritical
                      ? 'bg-rose-50/60 border-rose-300'
                      : isWarning
                      ? 'bg-amber-50/60 border-amber-300'
                      : 'bg-blue-50/60 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {rep.resolved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : isCritical ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <h4 className="text-xs font-bold text-slate-800">{rep.title}</h4>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-slate-400 font-mono">{rep.timestamp}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          rep.resolved
                            ? 'bg-slate-100 text-slate-600'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rep.resolved ? 'برطرف شده' : rep.severity}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-slate-100">
                    <strong className="text-slate-800">تحلیل رخداد: </strong>
                    {rep.analysis}
                  </p>

                  {/* AI Suggested Debug Prompt */}
                  <div className="mt-3 p-3 bg-slate-900 rounded-lg text-white space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-indigo-300 font-medium">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        پرامپت دیباگ آماده برای ایجنت هوشمند:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyPrompt(rep.suggestedDebugPrompt, rep.id)}
                          className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white bg-slate-800 px-2 py-1 rounded transition-colors"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {isCopied ? 'کپی شد' : 'کپی پرامپت'}
                        </button>
                        {onSendDebugPromptToAgent && (
                          <button
                            onClick={() => onSendDebugPromptToAgent(rep.suggestedDebugPrompt)}
                            className="flex items-center gap-1 text-[10px] text-white bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 rounded transition-colors"
                          >
                            <Send className="w-3 h-3" />
                            ارسال به AI
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs font-mono text-slate-200 bg-black/40 p-2 rounded">
                      {rep.suggestedDebugPrompt}
                    </p>
                  </div>

                  {/* Auto-fix script snippet if available */}
                  {rep.autoFixScriptSnippet && !rep.resolved && (
                    <div className="mt-2 flex items-center justify-between bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-xs">
                      <span className="text-emerald-900 text-[11px]">
                        قطعه کد اصلاح خودکار موجود است:
                      </span>
                      <button
                        onClick={() => handleRunAutoFix(rep)}
                        disabled={isFixing}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors"
                      >
                        {isFixing ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Wrench className="w-3 h-3" />
                        )}
                        اجرای اسکریپت Auto-Fix
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
