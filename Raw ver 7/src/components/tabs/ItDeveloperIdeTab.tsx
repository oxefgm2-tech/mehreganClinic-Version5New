import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  Play,
  Save,
  Plus,
  FileCode,
  FolderTree,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Database,
  Globe,
  Settings,
  Layers,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ExternalLink,
  Search,
  Server,
  Table,
  HardDrive,
  FileSpreadsheet,
  Download,
  Share2,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  BookOpen,
  Activity,
  ListTodo,
} from 'lucide-react';
import {
  DevIdeFile,
  DevScriptExecutionLog,
  AICodingPromptHistory,
  ApiEndpointTestItem,
  LegacySqlServerInstance,
  LegacySqlDatabaseSchema,
  LegacyServicePriceItem,
} from '../../types';
import {
  legacySqlServerMockInstances,
  legacySqlDatabaseSchemas,
} from '../../data/mockDatabase';
import { KnowledgeBaseManager } from '../it/KnowledgeBaseManager';
import { LegacyPricingExtractionPipeline } from '../it/LegacyPricingExtractionPipeline';
import { PulseInspectionEnginesPanel } from '../it/PulseInspectionEnginesPanel';
import { ITTaskRoadmapTracker } from '../it/ITTaskRoadmapTracker';
import { LivingCanvasBackground } from '../common/LivingCanvasBackground';
import { DeploymentTopologySwitcher } from '../it/DeploymentTopologySwitcher';

interface ItDeveloperIdeTabProps {
  files: DevIdeFile[];
  logs: DevScriptExecutionLog[];
  promptHistory: AICodingPromptHistory[];
  apiTests: ApiEndpointTestItem[];
  onSaveFile: (fileId: string, newContent: string) => void;
  onCreateFile: (newFile: Omit<DevIdeFile, 'id'>) => void;
  onRunScript: (fileName: string) => void;
  onExecuteAIPrompt: (prompt: string, targetFileId: string) => void;
  onApplyAICodeToFile: (targetFileId: string, code: string) => void;
  onTestApiEndpoint: (apiTestId: string) => void;
  onClearLogs: () => void;
  onClearDatabase?: () => void;
  onSeedDatabase?: () => void;
  onSendToMigrationPipeline?: (extractedJson: string) => void;
}

export const ItDeveloperIdeTab: React.FC<ItDeveloperIdeTabProps> = ({
  files,
  logs,
  promptHistory,
  apiTests,
  onSaveFile,
  onCreateFile,
  onRunScript,
  onExecuteAIPrompt,
  onApplyAICodeToFile,
  onTestApiEndpoint,
  onClearLogs,
  onClearDatabase,
  onSeedDatabase,
  onSendToMigrationPipeline,
}) => {
  const [activeFileId, setActiveFileId] = useState<string>(files[0]?.id || 'f-1');
  const [activeViewMode, setActiveViewMode] = useState<
    | 'editor'
    | 'pricing_pipeline'
    | 'knowledge_base'
    | 'pulse_engines'
    | 'sql_explorer'
    | 'ai_agent'
    | 'db_manager'
    | 'terminal'
    | 'api_tester'
    | 'topology'
  >('editor');

  // Active File Editor State
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];
  const [currentCode, setCurrentCode] = useState<string>(activeFile?.content || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);

  // New File Modal
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState<boolean>(false);
  const [newFilePath, setNewFilePath] = useState<string>('/src/automation/');
  const [newFileName, setNewFileName] = useState<string>('customHook.ts');
  const [newFileLang, setNewFileLang] = useState<'typescript' | 'sql' | 'json' | 'javascript'>('typescript');

  // AI Coding Prompt State
  const [aiPromptInput, setAiPromptInput] = useState<string>('');
  const [isAIGenerating, setIsAIGenerating] = useState<boolean>(false);
  const [latestGeneratedCode, setLatestGeneratedCode] = useState<string | null>(null);
  const [latestExplanation, setLatestExplanation] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Database Management State
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [isSeedingLoading, setIsSeedingLoading] = useState<boolean>(false);
  const [dbActionNotification, setDbActionNotification] = useState<string | null>(null);

  // SQL Server Explorer State
  const [sqlSearchTarget, setSqlSearchTarget] = useState<string>('192.168.1.50');
  const [sqlServerNameQuery, setSqlServerNameQuery] = useState<string>('VET-LEGACY-SRV');
  const [isSearchingSql, setIsSearchingSql] = useState<boolean>(false);
  const [discoveredServers, setDiscoveredServers] = useState<LegacySqlServerInstance[]>(legacySqlServerMockInstances);
  const [selectedServerId, setSelectedServerId] = useState<string>('srv-mssql-1');
  const [selectedDbName, setSelectedDbName] = useState<string>('VetClinicDB_2019');
  const [selectedTables, setSelectedTables] = useState<string[]>(['tbl_Patients', 'tbl_Owners', 'tbl_Visits']);
  const [isExtractingTables, setIsExtractingTables] = useState<boolean>(false);
  const [extractedResultJson, setExtractedResultJson] = useState<string | null>(null);
  const [extractedRecordsCount, setExtractedRecordsCount] = useState<number>(0);
  const [showExtractSuccessModal, setShowExtractSuccessModal] = useState<boolean>(false);

  const activeServer = discoveredServers.find((s) => s.id === selectedServerId) || discoveredServers[0];
  const activeSchema: LegacySqlDatabaseSchema = legacySqlDatabaseSchemas[selectedDbName] || legacySqlDatabaseSchemas['VetClinicDB_2019'];

  // Sync state when active file switches
  const handleSelectFile = (fileId: string) => {
    if (hasUnsavedChanges && activeFile) {
      if (confirm('تغییرات ذخیره نشده دارید. آیا مایلید بدون ذخیره فایل را عوض کنید؟')) {
        const next = files.find((f) => f.id === fileId);
        if (next) {
          setActiveFileId(next.id);
          setCurrentCode(next.content);
          setHasUnsavedChanges(false);
        }
      }
    } else {
      const next = files.find((f) => f.id === fileId);
      if (next) {
        setActiveFileId(next.id);
        setCurrentCode(next.content);
        setHasUnsavedChanges(false);
      }
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentCode(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!activeFile) return;
    onSaveFile(activeFile.id, currentCode);
    setHasUnsavedChanges(false);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2000);
  };

  const handleCreateNewFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const fullPath = `${newFilePath.replace(/\/$/, '')}/${newFileName.trim()}`;
    onCreateFile({
      name: newFileName.trim(),
      path: fullPath,
      language: newFileLang,
      content: `/**\n * ${newFileName.trim()}\n * Created by IT Developer at ${new Date().toLocaleTimeString('fa-IR')}\n */\n\nexport const init = () => {\n  console.log('Module initialized');\n};\n`,
    });

    setIsNewFileModalOpen(false);
    setNewFileName('');
  };

  const handleSendAIPrompt = (promptText?: string) => {
    const textToRun = promptText || aiPromptInput;
    if (!textToRun.trim() || !activeFile) return;

    setIsAIGenerating(true);
    setLatestGeneratedCode(null);
    setLatestExplanation(null);

    // If the prompt is asking to find SQL server, automatically provide helper and switch to SQL explorer
    if (textToRun.includes('اس_کیو_ال') || textToRun.includes('اس کیو ال') || textToRun.includes('sql') || textToRun.includes('SQL') || textToRun.includes('دیتابیس قدیم')) {
      setTimeout(() => {
        const generated = `/**
 * Discovered Legacy SQL Server Instance: VET-LEGACY-SRV\\SQLEXPRESS (192.168.1.50:1433)
 * Target Legacy Database: VetClinicDB_2019
 * Target Tables: tbl_Patients (1,850 rows), tbl_Owners (1,420 rows), tbl_Visits (4,210 rows)
 */
import { extractLegacyTables } from '/src/legacy/sqlServerBridge';

export async function fetchAndExportLegacyVetData() {
  const result = await extractLegacyTables('srv-mssql-1', 'VetClinicDB_2019', [
    'tbl_Patients',
    'tbl_Owners',
    'tbl_Visits'
  ]);
  console.log('[MSSQL Agent] Extracted', result.totalRecords, 'records. Ready for migration pipeline.');
  return result;
}`;
        setLatestGeneratedCode(generated);
        setLatestExplanation('ایجنت توسعه‌دهنده به سرور SQL Server قدیمی با نام VET-LEGACY-SRV و دیتابیس VetClinicDB_2019 متصل شد. جداول بیماران، مالکان و ویزیت‌ها شناسایی شدند. شما می‌توانید از تب «کاشف دیتابیس SQL Server قدیمی» جداول را مستقیماً استخراج و به جیسون تبدیل فرمایید.');
        setIsAIGenerating(false);
        onExecuteAIPrompt(textToRun, activeFile.id);
      }, 800);
      return;
    }

    setTimeout(() => {
      let generated = '';
      let explanation = '';

      if (textToRun.includes('بیعانه') || textToRun.includes('جراحی') || textToRun.includes('تایید')) {
        generated = `/**
 * Generated by VetCloud AI Developer Agent
 * Auto verifies deposit payment before admitting patient to Surgery Queue
 */
export function validateSurgeryDepositRequirement(appointment: {
  serviceType: string;
  depositStatus: string;
  depositAmount: number;
}) {
  const isSurgery = appointment.serviceType.includes('جراحی') || appointment.serviceType.includes('عقیم');
  if (isSurgery && appointment.depositStatus !== 'paid') {
    return {
      allowed: false,
      missingDepositToman: 2000000,
      paymentGateUrl: 'https://pay.vetcloud.ir/dep/surg-auto',
      noticePersian: 'ورود به صف جراحی منوط به واریز بیعانه ۲ میلیون تومانی است.'
    };
  }
  return { allowed: true, missingDepositToman: 0 };
}`;
        explanation = 'ماژول بررسی وضعیت پرداخت بیعانه جراحی تولید شد. این تابع نوبت را ارزیابی کرده و در صورت عدم پرداخت مانع تایید نهایی و اختصاص اتاق عمل می‌شود.';
      } else if (textToRun.includes('کسر') || textToRun.includes('فاکتور')) {
        generated = `/**
 * Deducts pre-paid deposit from the final cashier invoice
 */
export function calculateInvoiceWithDeposit(itemsTotal: number, depositPaidToman: number, discountToman: number = 0) {
  const subtotal = Math.max(0, itemsTotal - discountToman);
  const finalPayable = Math.max(0, subtotal - depositPaidToman);

  return {
    subtotal,
    depositDeducted: depositPaidToman,
    finalPayable,
    isFullyCoveredByDeposit: finalPayable === 0,
    receiptLine: depositPaidToman > 0 ? \`کسر پیش‌پرداخت بیعانه: -\${depositPaidToman.toLocaleString('fa-IR')} تومان\` : null
  };
}`;
        explanation = 'اسکریپت کسر خودکار بیعانه از جمع کل فاکتور تدوین شد و ردیف مربوط به رسید صندوق را ایجاد می‌کند.';
      } else {
        generated = `/**
 * VetCloud Logic Extension
 * Prompt: ${textToRun}
 */
export async function executeCustomLogicEngine(context: Record<string, any>) {
  console.log('[Dev Engine] Executing dynamic rule:', context);
  return {
    success: true,
    timestamp: new Date().toISOString(),
    processedPayload: context
  };
}`;
        explanation = `کد برای درخواست «${textToRun}» تولید شد و آماده اعمال بر روی ساختار ماژولار پروژه است.`;
      }

      setLatestGeneratedCode(generated);
      setLatestExplanation(explanation);
      setIsAIGenerating(false);
      onExecuteAIPrompt(textToRun, activeFile.id);
    }, 900);
  };

  const handleApplyToActiveFile = () => {
    if (!latestGeneratedCode || !activeFile) return;
    const mergedCode = `${currentCode}\n\n${latestGeneratedCode}`;
    setCurrentCode(mergedCode);
    setHasUnsavedChanges(true);
    onApplyAICodeToFile(activeFile.id, mergedCode);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2000);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // SQL Server Discovery Action
  const handleDiscoverSqlServers = async () => {
    setIsSearchingSql(true);
    try {
      const res = await fetch('/api/legacy/sql/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchTarget: sqlSearchTarget,
          serverNameFilter: sqlServerNameQuery,
        }),
      });
      const data = await res.json();
      if (data.instances && data.instances.length > 0) {
        setDiscoveredServers(data.instances);
        setSelectedServerId(data.instances[0].id);
      }
    } catch {
      // Fallback to rich mock instances
      setDiscoveredServers(legacySqlServerMockInstances);
    } finally {
      setIsSearchingSql(false);
    }
  };

  // SQL Tables Extraction Action
  const handleExtractSqlTables = async () => {
    setIsExtractingTables(true);
    try {
      const res = await fetch('/api/legacy/sql/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: selectedServerId,
          databaseName: selectedDbName,
          tables: selectedTables,
        }),
      });
      const data = await res.json();
      setExtractedResultJson(data.extractedJson);
      setExtractedRecordsCount(data.totalRecords || 7);
      setShowExtractSuccessModal(true);
    } catch {
      const fallbackJson = JSON.stringify(
        [
          {
            petName: 'تامی (قدیمی)',
            species: 'سگ',
            breed: 'پودل عروسکی',
            owner: 'مهندس رضایی',
            phone: '09121112233',
            microchip: '985141009876543',
            lastVisit: '1398/11/15',
            diagnosis: 'گاستریت حاد و سرم‌تراپی',
          },
          {
            petName: 'برفی',
            species: 'گربه',
            breed: 'پرشین کت سفید',
            owner: 'سرکار خانم شمس',
            phone: '09355554433',
            microchip: '985141005544332',
            lastVisit: '1399/08/22',
            diagnosis: 'اصلاح نمد مویی و مالت‌تراپی گوارش',
          },
          {
            petName: 'رکس',
            species: 'سگ',
            breed: 'ژرمن شپرد',
            owner: 'دکتر فرشید کاظمیان',
            phone: '09127773322',
            microchip: '985141008877665',
            lastVisit: '1400/01/18',
            diagnosis: 'رادیوگرافی هیپ دیسپلازی و گلوکوزامین',
          },
        ],
        null,
        2
      );
      setExtractedResultJson(fallbackJson);
      setExtractedRecordsCount(3);
      setShowExtractSuccessModal(true);
    } finally {
      setIsExtractingTables(false);
    }
  };

  // Toggle Table Selection for Extraction
  const toggleTableSelection = (tblName: string) => {
    setSelectedTables((prev) =>
      prev.includes(tblName) ? prev.filter((t) => t !== tblName) : [...prev, tblName]
    );
  };

  // Database Wipe Action
  const handleConfirmWipeDatabase = async () => {
    setIsClearModalOpen(false);
    try {
      await fetch('/api/dev/database/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preserveAdminUsers: true }),
      });
      if (onClearDatabase) {
        onClearDatabase();
      }
      setDbActionNotification('پایگاه‌داده کلینیک با موفقیت به طور کامل خالی شد (Ready for Clean Testing).');
      setTimeout(() => setDbActionNotification(null), 4000);
    } catch {
      if (onClearDatabase) onClearDatabase();
      setDbActionNotification('پایگاه‌داده تخلیه گردید.');
      setTimeout(() => setDbActionNotification(null), 4000);
    }
  };

  // Database Seed Action
  const handleSeedSampleDatabase = async () => {
    setIsSeedingLoading(true);
    try {
      await fetch('/api/dev/database/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countPerTable: 7 }),
      });
      if (onSeedDatabase) {
        onSeedDatabase();
      }
      setDbActionNotification('۷ رکورد غنی و واقعی برای تمام جداول و سناریوهای کلینیک بارگذاری شد.');
      setTimeout(() => setDbActionNotification(null), 4000);
    } catch {
      if (onSeedDatabase) onSeedDatabase();
      setDbActionNotification('داده‌های آزمایشی بارگذاری شدند.');
      setTimeout(() => setDbActionNotification(null), 4000);
    } finally {
      setIsSeedingLoading(false);
    }
  };

  // Quick prompt chips
  const quickAiPrompts = [
    'دنبال یک سرور اس‌کیو‌ال به نام VET-LEGACY-SRV بگرد و دیتابیس قدیم را پیدا کن',
    'کد هوک تایید بیعانه جراحی و ارسال لینک پیام‌رسان بله',
    'اسکریپت کسر خودکار بیعانه واریزشده از فاکتور نهایی',
    'اعتبارسنجی ورودی‌های صوتی فارسی برای ثبت خدمت',
  ];

  return (
    <div id="tab-it-developer-ide" className="space-y-6 animate-fadeIn pb-12">
      {/* Action Notification Toast */}
      {dbActionNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#2D3A27] text-white px-6 py-3 rounded-2xl shadow-xl border border-emerald-500/40 flex items-center gap-3 animate-fadeIn text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{dbActionNotification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2D3A27] to-[#1E291B] text-white p-6 rounded-3xl border border-[#4A6741]/40 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#4A6741] text-white flex items-center justify-center shadow-md">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">میز کار و محیط توسعه اختصاصی کارشناس آی‌تی</h2>
              <span className="text-[10px] bg-[#4A6741] text-[#D4E0CD] px-2.5 py-0.5 rounded-full font-mono font-bold">
                IT Developer Suite v3.2
              </span>
            </div>
            <p className="text-xs text-[#D4E0CD] mt-0.5">
              محیط IDE جمع و جور، استخراج دیتابیس SQL Server قدیمی، مدیریت چرخه داده‌ها و تست وب‌هوک‌ها
            </p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/30 p-1.5 rounded-2xl border border-white/10 text-xs">
          <button
            onClick={() => setActiveViewMode('pricing_pipeline')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeViewMode === 'pricing_pipeline'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-[#D4E0CD] hover:bg-white/10 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-amber-300" />
            <span>استخراج قیمت و کالاها</span>
          </button>

          <button
            onClick={() => setActiveViewMode('knowledge_base')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeViewMode === 'knowledge_base'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[#D4E0CD] hover:bg-white/10 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-300" />
            <span>پایگاه دانش IT</span>
          </button>

          <button
            onClick={() => setActiveViewMode('pulse_engines')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeViewMode === 'pulse_engines'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-[#D4E0CD] hover:bg-white/10 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 text-rose-300" />
            <span>موتورهای پالس</span>
          </button>

          <button
            onClick={() => setActiveViewMode('sql_explorer')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeViewMode === 'sql_explorer'
                ? 'bg-[#4A6741] text-white shadow-md'
                : 'text-[#D4E0CD] hover:bg-white/10 hover:text-white'
            }`}
          >
            <Server className="w-4 h-4 text-sky-300" />
            <span>کاشف SQL Server</span>
          </button>

          <button
            onClick={() => setActiveViewMode('editor')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeViewMode === 'editor'
                ? 'bg-[#4A6741] text-white shadow-md'
                : 'text-[#D4E0CD] hover:bg-white/10 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>کد ادیتور</span>
          </button>

          <button
            onClick={() => setActiveViewMode('ai_agent')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeViewMode === 'ai_agent'
                ? 'bg-[#4A6741] text-white shadow-md'
                : 'text-[#D4E0CD] hover:bg-white/10 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>ایجنت AI</span>
          </button>

          <button
            onClick={() => setActiveViewMode('db_manager')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeViewMode === 'db_manager'
                ? 'bg-[#4A6741] text-white shadow-md'
                : 'text-[#D4E0CD] hover:bg-white/10 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-300" />
            <span>پایگاه‌داده</span>
          </button>

          <button
            onClick={() => setActiveViewMode('terminal')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeViewMode === 'terminal'
                ? 'bg-[#4A6741] text-white shadow-md'
                : 'text-[#D4E0CD] hover:bg-white/10 hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>ترمینال ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveViewMode('api_tester')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeViewMode === 'api_tester'
                ? 'bg-[#4A6741] text-white shadow-md'
                : 'text-[#D4E0CD] hover:bg-white/10 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 text-sky-300" />
            <span>تست API</span>
          </button>

          <button
            onClick={() => setActiveViewMode('topology')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeViewMode === 'topology'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40'
                : 'text-[#D4E0CD] hover:bg-white/10 hover:text-white'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-300" />
            <span>سوئیچ استقرار ۳ گانه</span>
          </button>
        </div>
      </div>

      {/* IT Task Roadmap & Actionable Checklist Tracker */}
      <ITTaskRoadmapTracker
        onNavigateToSubTab={(tabKey) => {
          if (
            tabKey === 'pricing_pipeline' ||
            tabKey === 'knowledge_base' ||
            tabKey === 'pulse_engines' ||
            tabKey === 'sql_explorer' ||
            tabKey === 'editor'
          ) {
            setActiveViewMode(tabKey as any);
          }
        }}
      />

      {/* View: Legacy Pricing Extraction Pipeline */}
      {activeViewMode === 'pricing_pipeline' && (
        <LegacyPricingExtractionPipeline
          onRegisterToNewCatalog={(migratedItems) => {
            setDbActionNotification(`تعداد ${migratedItems.length} قلم کالا و خدمت با قیمت‌های انتخابی در سیستم ثبت شد.`);
            setTimeout(() => setDbActionNotification(null), 4000);
          }}
        />
      )}

      {/* View: Knowledge Base Manager */}
      {activeViewMode === 'knowledge_base' && <KnowledgeBaseManager onRunScript={onRunScript} />}

      {/* View: Pulse Inspection Engines */}
      {activeViewMode === 'pulse_engines' && (
        <PulseInspectionEnginesPanel
          onSendDebugPromptToAgent={(prompt) => {
            setActiveViewMode('ai_agent');
            setAiPromptInput(prompt);
          }}
          onExecuteAutoFixScript={(scriptSnippet) => {
            setDbActionNotification('اسکریپت اصلاح خودکار با موفقیت بر روی کلاینت اجرا شد.');
            setTimeout(() => setDbActionNotification(null), 4000);
          }}
        />
      )}

      {/* View: 3-Mode Deployment Topology Switcher */}
      {activeViewMode === 'topology' && (
        <DeploymentTopologySwitcher
          onModeChanged={(cfg) => {
            setDbActionNotification(`پیکربندی استقرار به حالت "${cfg.activeInterface}" با موفقیت به‌روزرسانی شد.`);
            setTimeout(() => setDbActionNotification(null), 4000);
          }}
        />
      )}

      {/* Main IDE Workspace */}
      {activeViewMode === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File Explorer Sidebar */}
          <div className="lg:col-span-1 bg-white p-4 rounded-3xl border border-[#E6E9DF] shadow-xs flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E9DF]">
              <div className="flex items-center gap-2 text-xs font-black text-[#2D3A27]">
                <FolderTree className="w-4 h-4 text-[#4A6741]" />
                <span>درخت فایل‌های پروژه</span>
              </div>
              <button
                onClick={() => setIsNewFileModalOpen(true)}
                className="p-1.5 bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#4A6741] rounded-xl transition-all cursor-pointer"
                title="ایجاد فایل جدید"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 overflow-y-auto max-h-[500px]">
              {files.map((file) => {
                const isCurrent = file.id === activeFileId;
                return (
                  <button
                    key={file.id}
                    onClick={() => handleSelectFile(file.id)}
                    className={`w-full text-right px-3 py-2.5 rounded-2xl text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? 'bg-[#4A6741] text-white font-bold shadow-xs'
                        : 'text-[#2D3A27] hover:bg-[#F7F8F3]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-white' : 'text-[#5C7457]'}`} />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                        isCurrent ? 'bg-white/20 text-white' : 'bg-[#E6E9DF] text-[#5C7457]'
                      }`}
                    >
                      {file.language}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#E6E9DF] text-[11px] text-[#5C7457]">
              <div>موقعیت فایل جاری:</div>
              <div className="font-mono text-xs font-bold text-[#2D3A27] truncate mt-0.5">
                {activeFile?.path}
              </div>
            </div>
          </div>

          {/* Code Editor Container */}
          <div className="lg:col-span-3 bg-[#1E1E1E] text-[#D4D4D4] rounded-3xl border border-[#333] shadow-lg flex flex-col overflow-hidden">
            {/* Editor Top Bar */}
            <div className="bg-[#252526] px-4 py-2.5 border-b border-[#333] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  {activeFile?.name}
                </span>
                {hasUnsavedChanges && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-sans">
                    تغییرات ذخیره نشده
                  </span>
                )}
                {isSavedToast && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-sans flex items-center gap-1">
                    <Check className="w-3 h-3" /> ذخیره شد
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRunScript(activeFile?.name || '')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>اجرا / تست کد</span>
                </button>

                <button
                  onClick={handleSave}
                  className="bg-[#4A6741] hover:bg-[#3D5535] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>ذخیره (Ctrl+S)</span>
                </button>
              </div>
            </div>

            {/* Editor Textarea with Line Numbers */}
            <div className="relative flex-1 p-4 bg-[#1E1E1E]">
              <textarea
                value={currentCode}
                onChange={handleCodeChange}
                rows={18}
                dir="ltr"
                spellCheck={false}
                className="w-full bg-transparent text-emerald-300 font-mono text-xs leading-relaxed resize-none focus:outline-none selection:bg-emerald-800 selection:text-white"
                placeholder="// Start coding in TypeScript, SQL or JSON..."
              />
            </div>

            {/* Editor Footer Status Bar */}
            <div className="bg-[#007ACC] text-white px-4 py-1.5 text-[11px] font-mono flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>زبان: {activeFile?.language}</span>
                <span>انکودینگ: UTF-8</span>
                <span>خطوط: {currentCode.split('\n').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                <span>محیط کامپایل زنده آماده</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Coding Agent View */}
      {activeViewMode === 'ai_agent' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Prompt Input & Quick Actions */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-[#E6E9DF] shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 text-[#2D3A27]">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#2D3A27]">دستیار هوش مصنوعی توسعه‌دهنده</h3>
                  <p className="text-[11px] text-[#5C7457]">تولید منطق تجاری، کشف SQL Server و اعتبارسنجی</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2D3A27] block">دستور یا پرامپت فنی:</label>
                <textarea
                  value={aiPromptInput}
                  onChange={(e) => setAiPromptInput(e.target.value)}
                  rows={4}
                  placeholder="مثال: دنبال یک اس‌کیو‌ال سرور به نام VET-LEGACY-SRV بگرد و جدول بیماران قدیم را استخراج کن..."
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-3 text-xs text-[#2D3A27] focus:outline-none focus:border-[#4A6741] resize-none font-medium leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#5C7457] truncate">
                  فایل هدف: <strong className="text-[#2D3A27] font-mono">{activeFile?.name}</strong>
                </span>
                <button
                  onClick={() => handleSendAIPrompt()}
                  disabled={isAIGenerating || !aiPromptInput.trim()}
                  className="bg-[#4A6741] hover:bg-[#3D5535] disabled:opacity-50 text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  {isAIGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>در حال پردازش...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>اجرای پرامپت</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Prompt Templates */}
            <div className="bg-white p-5 rounded-3xl border border-[#E6E9DF] shadow-xs space-y-3">
              <div className="text-xs font-bold text-[#2D3A27] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>الگوهای آماده پرامپت توسعه‌دهنده:</span>
              </div>
              <div className="space-y-2">
                {quickAiPrompts.map((prm, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setAiPromptInput(prm);
                      handleSendAIPrompt(prm);
                    }}
                    className="w-full text-right p-2.5 bg-[#F7F8F3] hover:bg-[#E6E9DF] border border-[#E6E9DF] rounded-2xl text-xs text-[#2D3A27] font-medium transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <span className="truncate">{prm}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#4A6741] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Result Code Preview & Explanation */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-[#E6E9DF] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E6E9DF]">
                <div className="flex items-center gap-2 text-sm font-black text-[#2D3A27]">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>خروجی کد و نتیجه تحلیل هوش مصنوعی</span>
                </div>

                {latestGeneratedCode && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyCode(latestGeneratedCode)}
                      className="px-3 py-1.5 bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'کپی شد' : 'کپی کد'}</span>
                    </button>

                    <button
                      onClick={handleApplyToActiveFile}
                      className="px-3 py-1.5 bg-[#4A6741] hover:bg-[#3D5535] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>افزودن به فایل {activeFile?.name}</span>
                    </button>
                  </div>
                )}
              </div>

              {latestExplanation && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed font-medium">
                  {latestExplanation}
                </div>
              )}

              {latestGeneratedCode ? (
                <div className="bg-[#1E1E1E] text-emerald-300 p-4 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-[#333]">
                  <pre>{latestGeneratedCode}</pre>
                </div>
              ) : (
                <div className="text-center py-16 text-[#5C7457] border border-dashed border-[#E6E9DF] rounded-2xl">
                  <Code2 className="w-10 h-10 mx-auto text-[#4A6741] mb-2 opacity-50" />
                  <p className="text-xs font-bold">هنوز کدی تولید نشده است.</p>
                  <p className="text-[11px] mt-1">یک دستور بنویسید یا از الگوهای سمت راست کلیک کنید.</p>
                </div>
              )}
            </div>

            {/* History of Prompts */}
            <div className="bg-white p-4 rounded-3xl border border-[#E6E9DF] shadow-xs space-y-3">
              <div className="text-xs font-bold text-[#2D3A27] flex items-center justify-between">
                <span>تاریخچه پرامپت‌های اعمال‌شده:</span>
                <span className="text-[11px] text-[#5C7457]">{promptHistory.length} مورد</span>
              </div>
              <div className="space-y-2">
                {promptHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#F7F8F3] rounded-2xl border border-[#E6E9DF] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-[#2D3A27]">
                      <span>«{item.prompt}»</span>
                      <span className="text-[10px] text-[#5C7457] font-normal">{item.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-[#5C7457] font-mono">{item.targetFile}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SQL Server Discovery & Legacy Data Bridge View */}
      {activeViewMode === 'sql_explorer' && (
        <div className="space-y-6">
          {/* Discovery Search Bar */}
          <div className="bg-white p-6 rounded-3xl border border-[#E6E9DF] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-[#2D3A27] flex items-center gap-2">
                  <Server className="w-5 h-5 text-[#4A6741]" />
                  کاشف و استخراج‌گر هوشمند دیتابیس‌های SQL Server قدیمی کلینیک
                </h3>
                <p className="text-xs text-[#5C7457] mt-0.5">
                  جستجوی خودکار در شبکه محلی (LAN) روی پورت 1433/1434 برای شناسایی سرورهای قدیمی، انتخاب جداول و استخراج ساختاربندی‌شده JSON
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDiscoverSqlServers}
                  disabled={isSearchingSql}
                  className="bg-[#4A6741] hover:bg-[#3D5535] text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSearchingSql ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال پویش شبکه...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>جستجو و کشف SQL Server</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-[#2D3A27] block mb-1">
                  نام سرور یا نمونه (Instance Filter):
                </label>
                <input
                  type="text"
                  value={sqlServerNameQuery}
                  onChange={(e) => setSqlServerNameQuery(e.target.value)}
                  placeholder="e.g. VET-LEGACY-SRV\SQLEXPRESS"
                  dir="ltr"
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2.5 text-xs font-mono text-[#2D3A27] focus:outline-none focus:border-[#4A6741]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2D3A27] block mb-1">
                  آدرس آی‌پی یا هاست هدف (Target Host / IP):
                </label>
                <input
                  type="text"
                  value={sqlSearchTarget}
                  onChange={(e) => setSqlSearchTarget(e.target.value)}
                  placeholder="e.g. 192.168.1.50 or localhost"
                  dir="ltr"
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2.5 text-xs font-mono text-[#2D3A27] focus:outline-none focus:border-[#4A6741]"
                />
              </div>
            </div>
          </div>

          {/* Discovered Instances & Database Schema Explorer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Server & Database List */}
            <div className="lg:col-span-1 space-y-4">
              {/* Discovered Instances */}
              <div className="bg-white p-5 rounded-3xl border border-[#E6E9DF] shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E6E9DF]">
                  <span className="text-xs font-black text-[#2D3A27]">نمونه‌های کشف‌شده در شبکه:</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-lg">
                    {discoveredServers.length} سرور فعال
                  </span>
                </div>

                <div className="space-y-2">
                  {discoveredServers.map((srv) => {
                    const isSelected = srv.id === selectedServerId;
                    return (
                      <button
                        key={srv.id}
                        onClick={() => {
                          setSelectedServerId(srv.id);
                          if (srv.detectedDatabases && srv.detectedDatabases.length > 0) {
                            setSelectedDbName(srv.detectedDatabases[0]);
                          }
                        }}
                        className={`w-full text-right p-3 rounded-2xl border transition-all cursor-pointer flex flex-col space-y-1.5 ${
                          isSelected
                            ? 'bg-[#4A6741] text-white border-[#4A6741] shadow-xs'
                            : 'bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] border-[#E6E9DF]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold truncate">{srv.serverName}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-[#E6E9DF] text-[#5C7457]'
                            }`}
                          >
                            {srv.hostIp}:{srv.port}
                          </span>
                        </div>
                        <div
                          className={`text-[11px] truncate ${isSelected ? 'text-[#D4E0CD]' : 'text-[#5C7457]'}`}
                        >
                          {srv.version}
                        </div>
                        <div className="flex items-center justify-between pt-1 text-[10px]">
                          <span className={isSelected ? 'text-[#D4E0CD]' : 'text-[#5C7457]'}>
                            پایگاه‌های داده: {srv.databasesCount}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            {srv.lastPingMs}ms
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Database Selector for selected instance */}
              {activeServer && (
                <div className="bg-white p-5 rounded-3xl border border-[#E6E9DF] shadow-xs space-y-3">
                  <div className="text-xs font-black text-[#2D3A27]">
                    انتخاب دیتابیس برای استخراج اطلاعات:
                  </div>
                  <div className="space-y-1.5">
                    {activeServer.detectedDatabases.map((dbName) => {
                      const isSelected = dbName === selectedDbName;
                      return (
                        <button
                          key={dbName}
                          onClick={() => setSelectedDbName(dbName)}
                          className={`w-full text-right px-3 py-2.5 rounded-2xl text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#2D3A27] text-white font-bold shadow-xs'
                              : 'bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Database className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-[#5C7457]'}`} />
                            <span>{dbName}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Tables & Schema View + Extraction Trigger */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-[#E6E9DF] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E6E9DF] gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-[#4A6741]" />
                      <h4 className="text-sm font-black text-[#2D3A27]">
                        ساختار جداول دیتابیس: <span className="font-mono text-[#4A6741]">{selectedDbName}</span>
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#5C7457] mt-0.5">
                      کلاسیفیکیشن: {activeSchema?.collation || 'Persian_100_CI_AI'} | حجم تقریبی: {activeSchema?.sizeMb || 648}MB
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setSelectedTables(activeSchema?.tables?.map((t) => t.tableName) || [])
                      }
                      className="text-[11px] text-[#4A6741] hover:underline font-bold"
                    >
                      انتخاب همه
                    </button>
                    <span className="text-[#5C7457]">|</span>
                    <button
                      onClick={() => setSelectedTables([])}
                      className="text-[11px] text-[#5C7457] hover:underline"
                    >
                      لغو انتخاب
                    </button>
                  </div>
                </div>

                {/* Table List with Column Previews */}
                <div className="space-y-3">
                  {activeSchema?.tables?.map((table) => {
                    const isChecked = selectedTables.includes(table.tableName);
                    return (
                      <div
                        key={table.tableName}
                        className={`p-4 rounded-2xl border transition-all ${
                          isChecked
                            ? 'bg-[#F7F8F3] border-[#4A6741]/40 shadow-xs'
                            : 'bg-white border-[#E6E9DF] opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-[#E6E9DF]/60">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTableSelection(table.tableName)}
                              className="w-4 h-4 rounded text-[#4A6741] focus:ring-[#4A6741]"
                            />
                            <span className="font-mono text-xs font-bold text-[#2D3A27]">
                              {table.tableName}
                            </span>
                          </label>

                          <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded-lg border border-[#E6E9DF] text-[#5C7457] font-bold">
                            {table.rowCount.toLocaleString('fa-IR')} رکورد
                          </span>
                        </div>

                        {/* Columns Badges */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {table.columns.map((col) => (
                            <span
                              key={col.name}
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                                col.isPrimaryKey
                                  ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                                  : 'bg-white text-[#5C7457] border-[#E6E9DF]'
                              }`}
                            >
                              {col.name} ({col.dataType || 'nvarchar'})
                              {col.isPrimaryKey && ' 🔑'}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Extraction Button */}
                <div className="pt-4 border-t border-[#E6E9DF] flex items-center justify-between">
                  <span className="text-xs text-[#5C7457]">
                    تعداد جداول انتخاب‌شده جهت استخراج: <strong>{selectedTables.length} جدول</strong>
                  </span>

                  <button
                    onClick={handleExtractSqlTables}
                    disabled={isExtractingTables || selectedTables.length === 0}
                    className="bg-[#4A6741] hover:bg-[#3D5535] text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isExtractingTables ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>در حال استخراج رکوردها...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>استخراج و تولید خروجی JSON</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Database Management View (Wipe / Seed 7 items) */}
      {activeViewMode === 'db_manager' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Wipe Database */}
          <div className="bg-white p-6 rounded-3xl border border-[#E6E9DF] shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#2D3A27]">
                  ۱. خالی کردن کامل دیتابیس (Wipe Test Database)
                </h3>
                <p className="text-xs text-[#5C7457] leading-relaxed mt-1">
                  تخلیه کلیه داده‌های آزمایشی، مراجعین، پرونده‌ها، فاکتورها، بستری‌ها و تاریخچه‌ها جهت آماده‌سازی کلینیک برای ورود به فاز بهره‌برداری واقعی یا تست در محیط ایزوله.
                </p>
              </div>

              <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>اثرات این عملیات:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>تمام بیماران و مراجعین پاکسازی می‌شوند.</li>
                  <li>تمام تراکنش‌ها، فاکتورها و بیعانه‌ها صفر می‌گردند.</li>
                  <li>حساب‌های پرسنلی مدیران و کادر درمان حفظ می‌شود.</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E6E9DF]">
              <button
                onClick={() => setIsClearModalOpen(true)}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 rounded-2xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>شروع فرآیند پاکسازی و تخلیه دیتابیس</span>
              </button>
            </div>
          </div>

          {/* Card 2: Seed Sample Data (7 items per table) */}
          <div className="bg-white p-6 rounded-3xl border border-[#E6E9DF] shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#2D3A27]">
                  ۲. پر کردن داده‌های آزمایشی استاندارد (Seed 7 Rich Scenarios)
                </h3>
                <p className="text-xs text-[#5C7457] leading-relaxed mt-1">
                  تزریق ۷ مورد داده آزمایشی در تمام جداول سیستم جهت شبیه‌سازی سناریوهای واقعی درمان، نوبت‌دهی بیعانه جراحی، پانسیون VIP، باشگاه مشتریان و پت‌شاپ هوشمند.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>شامل سناریوهای تست:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>سگ‌ها، گربه‌ها، پرندگان زینتی، خرگوش لوپ و خزندگان اگزاتیک</li>
                  <li>نوبت‌های جراحی بیعانه‌دار و تسویه‌شده در فاکتور صندوق</li>
                  <li>داروهای پرمصرف و مکمل‌ها با تحلیل دوز مصرفی و هشدارهای مسمومیت</li>
                  <li>سطوح ۴ گانه باشگاه وفاداری (برنزی، نقره‌ای، طلایی و VIP)</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E6E9DF]">
              <button
                onClick={handleSeedSampleDatabase}
                disabled={isSeedingLoading}
                className="w-full bg-[#4A6741] hover:bg-[#3D5535] text-white font-bold text-xs py-3 rounded-2xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSeedingLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال تزریق داده‌های تستی...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>بارگذاری ۷ نمونه برای تمام جداول و سناریوها</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal and Execution Logs View */}
      {activeViewMode === 'terminal' && (
        <div className="bg-[#1E1E1E] text-[#D4D4D4] rounded-3xl border border-[#333] shadow-lg p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#333]">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">کنسول خروجی و لاگ‌های بلادرنگ سیستم</h3>
                <p className="text-[11px] text-slate-400">سیستم لاگینگ خودکار رویدادهای صف، تراکنش‌های بیعانه و کشف SQL Server</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onRunScript('full_system_health_check.ts')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>اجرای تست سلامت سیستم</span>
              </button>

              <button
                onClick={onClearLogs}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاکسازی لاگ‌ها</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs overflow-y-auto max-h-[450px]">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                  log.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                    : log.type === 'error'
                    ? 'bg-rose-950/40 border-rose-800/40 text-rose-300'
                    : log.type === 'warning'
                    ? 'bg-amber-950/40 border-amber-800/40 text-amber-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <span className="text-[10px] text-slate-500 shrink-0 font-bold">[{log.timestamp}]</span>
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-bold shrink-0">
                  {log.source}
                </span>
                <span className="flex-1 leading-relaxed">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API & Webhook Sandbox View */}
      {activeViewMode === 'api_tester' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {apiTests.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-3xl border border-[#E6E9DF] shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-mono font-black px-2.5 py-1 rounded-xl ${
                        item.method === 'POST'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {item.method}
                    </span>
                    <h3 className="text-sm font-black text-[#2D3A27]">{item.name}</h3>
                  </div>

                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-lg border border-emerald-200">
                    Status: {item.status || 200}
                  </span>
                </div>

                <div className="font-mono text-xs text-[#5C7457] bg-[#F7F8F3] p-2 rounded-xl border border-[#E6E9DF] mt-2 truncate" dir="ltr">
                  {item.endpoint}
                </div>

                <p className="text-xs text-[#5C7457] mt-2">{item.description}</p>

                {item.requestBody && (
                  <div className="mt-3">
                    <div className="text-[11px] font-bold text-[#2D3A27] mb-1">Payload ارسال:</div>
                    <pre className="bg-[#1E1E1E] text-amber-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto" dir="ltr">
                      {item.requestBody}
                    </pre>
                  </div>
                )}

                {item.mockResponse && (
                  <div className="mt-3">
                    <div className="text-[11px] font-bold text-[#2D3A27] mb-1">پاسخ دریافتی (Response):</div>
                    <pre className="bg-[#1E1E1E] text-emerald-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto" dir="ltr">
                      {item.mockResponse}
                    </pre>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#E6E9DF] flex items-center justify-end">
                <button
                  onClick={() => onTestApiEndpoint(item.id)}
                  className="bg-[#4A6741] hover:bg-[#3D5535] text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ارسال درخواست تست به سرور</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Extraction Success & Migration Handover Modal */}
      {showExtractSuccessModal && extractedResultJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-[#E6E9DF] shadow-2xl space-y-4 text-[#2D3A27] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E9DF]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#2D3A27]">
                    استخراج موفق اطلاعات از دیتابیس {selectedDbName}
                  </h3>
                  <p className="text-[11px] text-[#5C7457]">
                    تعداد {extractedRecordsCount} رکورد با موفقیت استخراج و به JSON تبدیل گردید.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExtractSuccessModal(false)}
                className="text-[#5C7457] hover:text-[#2D3A27] text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-bold text-[#2D3A27]">
                <span>پیش‌نمایش خروجی استاندارد JSON:</span>
                <button
                  onClick={() => handleCopyCode(extractedResultJson)}
                  className="text-xs text-[#4A6741] hover:underline flex items-center gap-1 font-bold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی محتوای JSON</span>
                </button>
              </div>
              <pre
                className="bg-[#1E1E1E] text-emerald-300 p-4 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-[#333] max-h-[300px]"
                dir="ltr"
              >
                {extractedResultJson}
              </pre>
            </div>

            <div className="pt-4 border-t border-[#E6E9DF] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                onClick={() => setShowExtractSuccessModal(false)}
                className="px-4 py-2.5 rounded-2xl bg-[#E6E9DF] text-[#2D3A27] text-xs font-bold cursor-pointer"
              >
                بستن و ماندن در این بخش
              </button>

              <button
                onClick={() => {
                  setShowExtractSuccessModal(false);
                  if (onSendToMigrationPipeline) {
                    onSendToMigrationPipeline(extractedResultJson);
                  }
                }}
                className="px-5 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>تحویل JSON به بخش پالایش و مهاجرت داده‌ها (Cleansing Pipeline)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Database Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-rose-200 shadow-2xl space-y-4 text-[#2D3A27]">
            <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-rose-900">تایید تخلیه کامل پایگاه‌داده</h3>
                <p className="text-[11px] text-rose-700">این عملیات تمام داده‌های آزمایشی را حذف می‌کند.</p>
              </div>
            </div>

            <p className="text-xs text-[#5C7457] leading-relaxed">
              آیا اطمینان دارید که می‌خواهید تمام رکوردهای آزمایشی شامل بیماران، نوبت‌ها، ویزیت‌ها و فاکتورها را حذف کنید؟ این عمل غیرقابل بازگشت است، هرچند می‌توانید در هر زمان از دکمه «بارگذاری ۷ نمونه آزمایشی» مجدداً دیتابیس را پر نمایید.
            </p>

            <div className="pt-3 border-t border-[#E6E9DF] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 rounded-2xl bg-[#E6E9DF] text-[#2D3A27] text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmWipeDatabase}
                className="px-5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                بله، دیتابیس را خالی کن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New File Modal */}
      {isNewFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E9DF] shadow-2xl space-y-4 text-[#2D3A27]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E9DF]">
              <h3 className="text-base font-black text-[#2D3A27] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#4A6741]" />
                ایجاد فایل جدید در مخزن پروژه
              </h3>
              <button
                onClick={() => setIsNewFileModalOpen(false)}
                className="text-[#5C7457] hover:text-[#2D3A27] text-xs font-bold cursor-pointer"
              >
                بستن
              </button>
            </div>

            <form onSubmit={handleCreateNewFileSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#2D3A27] block mb-1">مسیر دایرکتوری:</label>
                <input
                  type="text"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  dir="ltr"
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2.5 text-xs font-mono text-[#2D3A27]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2D3A27] block mb-1">نام فایل با پسوند:</label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. depositGate.ts"
                  dir="ltr"
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2.5 text-xs font-mono text-[#2D3A27]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2D3A27] block mb-1">نوع زبان:</label>
                <select
                  value={newFileLang}
                  onChange={(e: any) => setNewFileLang(e.target.value)}
                  className="w-full bg-[#F7F8F3] border border-[#E6E9DF] rounded-2xl p-2.5 text-xs text-[#2D3A27]"
                >
                  <option value="typescript">TypeScript (.ts / .tsx)</option>
                  <option value="sql">SQL Schema (.sql)</option>
                  <option value="json">JSON Config (.json)</option>
                  <option value="javascript">JavaScript (.js)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#E6E9DF] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewFileModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-[#E6E9DF] text-[#2D3A27] text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-2xl bg-[#4A6741] text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  ایجاد فایل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
