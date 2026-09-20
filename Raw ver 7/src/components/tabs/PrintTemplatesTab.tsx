import React, { useState } from 'react';
import {
  Printer,
  FileText,
  Sparkles,
  Eye,
  CheckCircle2,
  Code,
  Save,
  Plus,
  RefreshCw,
  Sliders,
  Copy,
} from 'lucide-react';
import { PrintTemplate, Pet } from '../../types';

interface PrintTemplatesTabProps {
  templates: PrintTemplate[];
  pets: Pet[];
  onUpdateTemplate: (template: PrintTemplate) => void;
}

export const PrintTemplatesTab: React.FC<PrintTemplatesTabProps> = ({
  templates,
  pets,
  onUpdateTemplate,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || 'tmpl-1');
  const [selectedPetForPreview, setSelectedPetForPreview] = useState<Pet | undefined>(pets && pets.length > 0 ? pets[0] : undefined);
  const [copiedVariableToast, setCopiedVariableToast] = useState<string | null>(null);

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const [htmlEditorContent, setHtmlEditorContent] = useState(activeTemplate?.contentHtml || '');

  const handleSelectTemplate = (tmpl: PrintTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setHtmlEditorContent(tmpl.contentHtml);
  };

  const handleSaveTemplate = () => {
    onUpdateTemplate({
      ...activeTemplate,
      contentHtml: htmlEditorContent,
    });
    alert('قالب چاپی با موفقیت به‌روزرسانی و ذخیره شد.');
  };

  const handleInsertVariable = (varKey: string) => {
    setHtmlEditorContent((prev) => `${prev} ${varKey}`);
    setCopiedVariableToast(`متغیر ${varKey} به متن قالب اضافه شد.`);
    setTimeout(() => setCopiedVariableToast(null), 2500);
  };

  // Render live preview by replacing variable tokens
  const getRenderedPreviewHtml = () => {
    if (!selectedPetForPreview) {
      return (htmlEditorContent || '')
        .replace(/{{clinic_name}}/g, 'کلینیک اختصاصی حیوانات خانگی مهرگان')
        .replace(/{{issue_date}}/g, new Date().toLocaleDateString('fa-IR'))
        .replace(/{{date}}/g, new Date().toLocaleDateString('fa-IR'))
        .replace(/{{vet_name}}/g, 'دامپزشک معتمد کلینیک');
    }

    return (htmlEditorContent || '')
      .replace(/{{pet_name}}/g, selectedPetForPreview.name || '')
      .replace(/{{species}}/g, selectedPetForPreview.species || '')
      .replace(/{{breed}}/g, selectedPetForPreview.breed || '')
      .replace(/{{color}}/g, selectedPetForPreview.color || '')
      .replace(/{{birth_date}}/g, selectedPetForPreview.birthDate || '')
      .replace(/{{microchip}}/g, selectedPetForPreview.microchipNumber || '')
      .replace(/{{owner_name}}/g, selectedPetForPreview.ownerName || '')
      .replace(/{{owner_phone}}/g, selectedPetForPreview.ownerPhone || '')
      .replace(/{{clinic_name}}/g, 'کلینیک اختصاصی حیوانات خانگی مهرگان')
      .replace(/{{issue_date}}/g, new Date().toLocaleDateString('fa-IR'))
      .replace(/{{date}}/g, new Date().toLocaleDateString('fa-IR'))
      .replace(/{{rabies_date}}/g, '۱۴۰۳/۰۵/۰۱')
      .replace(/{{national_id}}/g, '۰۰۱۹۸۷۶۵۴۳')
      .replace(/{{surgery_name}}/g, 'جراحی ارتوپدی TPLO')
      .replace(/{{passport_no}}/g, 'N12345678')
      .replace(/{{destination}}/g, 'Frankfurt (FRA)')
      .replace(/{{vet_name}}/g, 'دکتر امین بیاتی (جراح)');
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div id="tab-print-templates" className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">طراحی و ویرایشگر قالب‌های چاپی WYSIWYG</h2>
            <p className="text-xs text-slate-500">
              شخصی‌سازی شناسنامه، فیش پرینتر حرارتی، فاکتور A4 و کارت سلامت
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveTemplate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره تغییرات قالب</span>
          </button>

          <button
            onClick={handleTriggerPrint}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ / خروجی PDF</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {copiedVariableToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold animate-fadeIn">
          {copiedVariableToast}
        </div>
      )}

      {/* Main Studio: Template Selector & Live Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 4 Cols: Template Switcher & Dynamic Variable Injector */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Templates list */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-900">انتخاب قالب چاپی جهت ویرایش:</h3>
            <div className="space-y-1.5">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`w-full text-right p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    tmpl.id === selectedTemplateId
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{tmpl.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Available Variables */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900">متغیرهای پویا (کلیک جهت درج):</h3>
              <span className="text-[10px] text-slate-400">تگ‌های خودکار</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {activeTemplate.variables.map((v, i) => (
                <button
                  key={i}
                  onClick={() => handleInsertVariable(v)}
                  className="bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 font-mono text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Patient Selector */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2">
            <label className="block text-xs font-black text-slate-900">پیش‌نمایش زنده با اطلاعات بیمار:</label>
            <select
              value={selectedPetForPreview?.id || ''}
              onChange={(e) => {
                const p = (pets || []).find((item) => item.id === e.target.value);
                if (p) setSelectedPetForPreview(p);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {(pets || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.breed}) • {p.ownerName}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Right 8 Cols: HTML Code Editor & Live Print Canvas */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Live Print Canvas */}
          <div className="bg-slate-100 p-6 rounded-3xl border border-slate-300 shadow-inner flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-3 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>پیش‌نمایش خروجی چاپ زنده ({activeTemplate.title})</span>
              </span>
            </div>

            {/* Simulated Paper Sheet */}
            <div
              id="print-preview-container"
              className="bg-white text-slate-900 shadow-2xl p-8 rounded-xl border border-slate-300 transition-all font-sans w-full max-w-2xl min-h-[500px]"
              dangerouslySetInnerHTML={{ __html: getRenderedPreviewHtml() }}
            />
          </div>

          {/* HTML / Template Code Inspector */}
          <div className="bg-slate-900 text-slate-100 p-5 rounded-3xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-2 text-emerald-400">
                <Code className="w-4 h-4" />
                <span>کد منبع HTML قالب (قابل ویرایش مستقیم):</span>
              </span>
              <span className="text-slate-500 font-mono text-[10px]">CSS استاندارد چاپی</span>
            </div>

            <textarea
              rows={8}
              value={htmlEditorContent}
              onChange={(e) => setHtmlEditorContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

        </div>

      </div>

    </div>
  );
};
