import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Tag,
  CheckCircle2,
  AlertCircle,
  FileText,
  Edit3,
  Trash2,
  Sparkles,
  Bot,
  UserCheck,
  Share2,
  Shield,
  Layers,
  ArrowRight,
  Download,
  Calendar,
  Key,
} from 'lucide-react';
import { KnowledgeBaseArticle, UserRole } from '../../types';
import { initialKnowledgeBaseArticles } from '../../data/mockDatabase';

interface KnowledgeBaseManagerProps {
  currentRole?: UserRole;
  onRunScript?: (scriptName: string) => void;
}

export const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({
  currentRole = 'it_developer',
}) => {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>(initialKnowledgeBaseArticles);
  const [selectedArticleId, setSelectedArticleId] = useState<string>(articles[0]?.id || 'kb-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // Edit / Create Form state
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<KnowledgeBaseArticle['category']>('database_migration');
  const [formSummary, setFormSummary] = useState<string>('');
  const [formContentMarkdown, setFormContentMarkdown] = useState<string>('');
  const [formTags, setFormTags] = useState<string>('');
  const [formPersona, setFormPersona] = useState<string>('متخصص پایگاه داده و معماری داده');
  const [formKeyDecisions, setFormKeyDecisions] = useState<string>('');

  const selectedArticle = articles.find((a) => a.id === selectedArticleId) || articles[0];

  const categoriesMap: { id: string; label: string; icon: any }[] = [
    { id: 'all', label: 'همه مقالات', icon: Layers },
    { id: 'database_migration', label: 'مهاجرت و پایگاه داده', icon: BookOpen },
    { id: 'security_rbac', label: 'امنیت و کنترل دسترسی (RBAC)', icon: Shield },
    { id: 'ui_ux_philosophy', label: 'فلسفه طراحی مینیمال و ارگونومی', icon: Sparkles },
    { id: 'clinical_workflows', label: 'فرآیندهای بالینی و بیعانه', icon: FileText },
    { id: 'automation_scripts', label: 'موتورهای پالس و اتوماسیون', icon: Key },
  ];

  const filteredArticles = articles.filter((art) => {
    const matchesCat = selectedCategory === 'all' || art.category === selectedCategory;
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleStartEdit = (art: KnowledgeBaseArticle) => {
    setFormTitle(art.title);
    setFormCategory(art.category);
    setFormSummary(art.summary);
    setFormContentMarkdown(art.contentMarkdown);
    setFormTags(art.tags.join('، '));
    setFormPersona(art.consultationPersona || '');
    setFormKeyDecisions(art.keyDecisions ? art.keyDecisions.join('\n') : '');
    setIsEditing(true);
    setIsCreatingNew(false);
  };

  const handleStartCreate = () => {
    setFormTitle('');
    setFormCategory('database_migration');
    setFormSummary('');
    setFormContentMarkdown(`### عنوان بخش اصلی
توضیحات و فرآیند فنی استاندارد را در اینجا وارد کنید...

1. **گام اول**: بررسی پیش‌نیازها
2. **گام دوم**: پیاده‌سازی و تست`);
    setFormTags('آی‌تی، دیتابیس، استاندارد');
    setFormPersona('مشاور فنی و معمار سیستم مهرگان');
    setFormKeyDecisions('تصمیم کلیدی شماره یک\nتصمیم کلیدی شماره دو');
    setIsCreatingNew(true);
    setIsEditing(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const tagsArray = formTags
      .split(/[,،]/)
      .map((t) => t.trim())
      .filter(Boolean);
    const keyDecisionsArray = formKeyDecisions
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean);

    if (isCreatingNew) {
      const newArt: KnowledgeBaseArticle = {
        id: `kb-${Date.now()}`,
        title: formTitle,
        category: formCategory,
        summary: formSummary,
        contentMarkdown: formContentMarkdown,
        tags: tagsArray,
        authorRole: 'it_developer',
        authorName: 'ارژنک.پ',
        aiGeneratedOrEnhanced: true,
        consultationPersona: formPersona,
        isApprovedByIT: true,
        allowedRoles: ['admin', 'it_developer'],
        updatedAt: 'امروز، ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        keyDecisions: keyDecisionsArray,
      };
      setArticles([newArt, ...articles]);
      setSelectedArticleId(newArt.id);
    } else {
      setArticles(
        articles.map((art) =>
          art.id === selectedArticleId
            ? {
                ...art,
                title: formTitle,
                category: formCategory,
                summary: formSummary,
                contentMarkdown: formContentMarkdown,
                tags: tagsArray,
                consultationPersona: formPersona,
                keyDecisions: keyDecisionsArray,
                updatedAt: 'امروز (ویرایش شده)',
              }
            : art
        )
      );
    }

    setIsEditing(false);
    setIsCreatingNew(false);
  };

  const handleToggleApproval = (artId: string) => {
    setArticles(
      articles.map((a) => (a.id === artId ? { ...a, isApprovedByIT: !a.isApprovedByIT } : a))
    );
  };

  const handleDeleteArticle = (artId: string) => {
    if (confirm('آیا از حذف این مقاله از پایگاه دانش اطمینان دارید؟')) {
      const remaining = articles.filter((a) => a.id !== artId);
      setArticles(remaining);
      if (selectedArticleId === artId && remaining.length > 0) {
        setSelectedArticleId(remaining[0].id);
      }
    }
  };

  const handleExportArticles = () => {
    const jsonStr = JSON.stringify(articles, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mehregan_knowledge_base_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                پایگاه دانش تخصصی و تصمیمات مهندسی (Knowledge Base)
              </h2>
              <p className="text-xs text-slate-500">
                مرجع ثبت و ویرایش مستندات، تحلیل‌های مهاجرت داده، پروتکل‌های امنیتی و تصمیمات مورد تایید کارشناس آی‌تی
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportArticles}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            خروجی JSON
          </button>
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            ثبت مقاله و تصمیم جدید
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar list + Detail/Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Category Filter + Article List (5 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="جستجو در مقالات، تگ‌ها و تصمیمات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-1.5">
            {categoriesMap.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all ${
                    isSelected
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Articles list */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-0.5">
            {filteredArticles.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
                مقاله‌ای مطابق با جستجو یافت نشد.
              </div>
            ) : (
              filteredArticles.map((art) => {
                const isSelected = selectedArticle?.id === art.id;
                return (
                  <div
                    key={art.id}
                    onClick={() => {
                      setSelectedArticleId(art.id);
                      setIsEditing(false);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-right ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-xs font-bold line-clamp-2 ${
                          isSelected ? 'text-emerald-900' : 'text-slate-800'
                        }`}
                      >
                        {art.title}
                      </h4>
                      {art.isApprovedByIT ? (
                        <span
                          className="shrink-0 p-1 text-emerald-600 bg-emerald-100 rounded-full"
                          title="تایید شده توسط کارشناس آی‌تی"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                        </span>
                      ) : (
                        <span
                          className="shrink-0 p-1 text-amber-600 bg-amber-100 rounded-full"
                          title="در انتظار تایید نهایی"
                        >
                          <AlertCircle className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {art.summary}
                    </p>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {art.updatedAt}
                      </span>
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono text-[9px]">
                        {art.category}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Article Details / Editor (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          {isEditing ? (
            /* Editing Form */
            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-600" />
                  {isCreatingNew ? 'ایجاد مقاله و استاندارد جدید در پایگاه دانش' : 'ویرایش مقاله پایگاه دانش'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  انصراف
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    عنوان مقاله / تصمیم:
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="مثال: استراتژی پالایش دیتابیس قدیمی و متد قیمت‌گذاری"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    دسته‌بندی موضوعی:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="database_migration">مهاجرت و پایگاه داده (Database Migration)</option>
                    <option value="security_rbac">امنیت و کنترل دسترسی (Security & RBAC)</option>
                    <option value="ui_ux_philosophy">فلسفه طراحی مینیمال و ارگونومی (UI/UX)</option>
                    <option value="clinical_workflows">فرآیندهای بالینی و بیعانه (Clinical)</option>
                    <option value="automation_scripts">موتورهای پالس و اتوماسیون (Automation)</option>
                    <option value="general_it">عمومی آی‌تی و سرور (General IT)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  خلاصه و کاربرد اجرایی:
                </label>
                <textarea
                  rows={2}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="شرح کوتاه ۱ الی ۲ خطی از هدف این تصمیم یا مقاله..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  پرسونای مشاوره / متخصص پاسخگو:
                </label>
                <input
                  type="text"
                  value={formPersona}
                  onChange={(e) => setFormPersona(e.target.value)}
                  placeholder="مثال: معمار پایگاه داده و مهاجرت داده ساختاریافته"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  متن اصلی مقاله (فرمت مارک‌داون):
                </label>
                <textarea
                  rows={8}
                  required
                  value={formContentMarkdown}
                  onChange={(e) => setFormContentMarkdown(e.target.value)}
                  placeholder="محتوای تخصصی، فرمول‌ها، ساختار جداول یا نمونه کدها را در اینجا بنویسید..."
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  تصمیمات کلیدی اتخاذ شده (هر تصمیم در یک خط):
                </label>
                <textarea
                  rows={3}
                  value={formKeyDecisions}
                  onChange={(e) => setFormKeyDecisions(e.target.value)}
                  placeholder="تصمیم ۱: تفکیک فیلتر اقلام جاری از منسوخ شده&#10;تصمیم ۲: سوئیچ یکپارچه بین آخرین قیمت و میانگین"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  برچسب‌ها (با ویرگول یا کاما جدا کنید):
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="مثال: دیتابیس، SQL Server، قیمت‌گذاری، کلینزینگ"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  ذخیره و ثبت در پایگاه دانش
                </button>
              </div>
            </form>
          ) : selectedArticle ? (
            /* View Article Content */
            <div className="space-y-4">
              {/* Top Meta & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-100 rounded-full mb-1.5">
                    {categoriesMap.find((c) => c.id === selectedArticle.category)?.label ||
                      selectedArticle.category}
                  </span>
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {selectedArticle.title}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleApproval(selectedArticle.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedArticle.isApprovedByIT
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {selectedArticle.isApprovedByIT ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        تایید شده توسط IT
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        نیاز به تایید IT
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleStartEdit(selectedArticle)}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="ویرایش مقاله"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteArticle(selectedArticle.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="حذف مقاله"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Author & Persona Strip */}
              <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-lg text-xs text-slate-600 border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>نویسنده / ناظر:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedArticle.authorName} ({selectedArticle.authorRole})
                  </span>
                </div>

                {selectedArticle.consultationPersona && (
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                    <span>پرسونای مشاور:</span>
                    <span className="font-medium text-slate-700">
                      {selectedArticle.consultationPersona}
                    </span>
                  </div>
                )}

                <div className="mr-auto text-[11px] text-slate-400">
                  آخرین بروزرسانی: {selectedArticle.updatedAt}
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
                <span className="font-bold">خلاصه اجرایی: </span>
                {selectedArticle.summary}
              </div>

              {/* Key Decisions Badge Box */}
              {selectedArticle.keyDecisions && selectedArticle.keyDecisions.length > 0 && (
                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2">
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-700" />
                    تصمیمات کلیدی و خط‌مشی‌های مصوب کارشناس آی‌تی:
                  </h4>
                  <ul className="space-y-1 text-xs text-amber-800 pr-4 list-disc">
                    {selectedArticle.keyDecisions.map((dec, idx) => (
                      <li key={idx}>{dec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Markdown Content */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
                {selectedArticle.contentMarkdown}
              </div>

              {/* Tags */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-500 font-medium">برچسب‌ها:</span>
                {selectedArticle.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              یک مقاله را از فهرست سمت راست انتخاب کنید.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
