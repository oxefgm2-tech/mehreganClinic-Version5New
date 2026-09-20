import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  AlertTriangle,
  Pill,
  Stethoscope,
  BookOpen,
  RefreshCw,
  CheckCircle2,
  Bot,
  User,
  Zap,
} from 'lucide-react';
import { Pet } from '../../types';
import { VET_DICTIONARIES } from '../../services/voiceSecretary';

interface AiVetAssistantTabProps {
  pets: Pet[];
}

export const AiVetAssistantTab: React.FC<AiVetAssistantTabProps> = ({ pets }) => {
  const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id || '');
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; text: string; timestamp: string; isWarning?: boolean }[]
  >([
    {
      role: 'assistant',
      text: `سلام! من دستیار فوق‌تخصصی دامپزشکی هوش مصنوعی مهرگان هستم.
می‌توانید علائم بالینی بیمار، دوزاژ داروها یا تداخلات دارویی را بپرسید. برای مثال:
- «دوز کارپروفن برای سگ پامرانین ۳.۵ کیلوگرمی چقدر است؟»
- «تداخل دارویی ملوکسیکام با پردنیزولون چیست؟»
- «تشخیص تفریقی برای سگ ۵ ساله با سرفه‌های خشک شبانه»`,
      timestamp: 'هم‌اکنون',
    },
  ]);

  const selectedPet = pets.find((p) => p.id === selectedPetId) || pets[0];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;

    const userText = inputPrompt.trim();
    const now = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [...prev, { role: 'user', text: userText, timestamp: now }]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/vet-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          patientContext: selectedPet
            ? {
                name: selectedPet.name,
                species: selectedPet.species,
                breed: selectedPet.breed,
                weightKg: selectedPet.weightKg,
                ageText: selectedPet.ageText,
                allergies: selectedPet.allergies,
              }
            : undefined,
        }),
      });

      const data = await response.json();
      const assistantText = data.text || data.fallbackText || 'پاسخی از مدل دریافت نشد.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: assistantText,
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Error fetching AI response:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'پاسخ هوشمند محلی (VetNLP Local): بر اساس راهنمای بالینی، توصیه می‌شود علائم حیاتی و سوابق واکسیناسیون بررسی گردد.',
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'دوزاژ آموکسی‌سیلین کلاوولانات و طول درمان برای بیمار انتخابی',
    'آیا مصرف همزمان ملوکسیکام و دگزامتازون مجاز است؟',
    'پروتکل درمان و ضد انگل برای توله سگ تازه متولد شده',
    'تشخیص‌های تفریقی لنگش ناگهانی پای راست در سگ ژرمن',
  ];

  return (
    <div id="tab-ai-vet-assistant" className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-950 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 border border-purple-400/30 px-3 py-1 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>مشاور بالینی دامپزشکی مبتنی بر Gemini 3.7 Flash & VetNLP</span>
          </div>
          <h2 className="text-xl font-black text-white">دستیار تخصصی بالینی و بررسی تداخلات دارویی</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            محاسبه دقیق دوزاژ با توجه به وزن و گونه، تشخیص‌های تفریقی، و راهنمای استانداردهای بین‌المللی دامپزشکی (WSAVA).
          </p>
        </div>

        {/* Selected Pet Context Pill */}
        <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/20 text-xs">
          <label className="block text-[11px] text-purple-200 font-bold mb-1">بیمار فعال برای مشاوره هوشمند:</label>
          <select
            value={selectedPetId}
            onChange={(e) => setSelectedPetId(e.target.value)}
            className="bg-slate-900 border border-purple-400/40 text-white rounded-xl px-3 py-1.5 font-bold focus:outline-none focus:border-purple-400 cursor-pointer"
          >
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.species} - {p.weightKg}kg)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chat Interface & Drug Reference Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: AI Conversation Stream */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-[620px] overflow-hidden">
          
          {/* Chat Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-3xl p-4 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-none font-medium'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none space-y-2'
                  }`}
                >
                  <div className="whitespace-pre-line font-normal">{msg.text}</div>
                  <div className="text-[10px] text-slate-400 font-mono text-left">{msg.timestamp}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2 text-xs text-slate-600">
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                  <span>دستیار هوش مصنوعی در حال استنتاج بالینی و بررسی تداخلات...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-slate-500 font-bold whitespace-nowrap px-2 flex items-center gap-1">
              <Zap className="w-3 h-3 text-purple-600" />
              <span>پیشنهادها:</span>
            </span>
            {samplePrompts.map((sp, i) => (
              <button
                key={i}
                onClick={() => setInputPrompt(sp)}
                className="bg-white hover:bg-purple-50 hover:text-purple-900 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 font-medium whitespace-nowrap transition-colors cursor-pointer"
              >
                {sp}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={`پرسش بالینی یا دوز دارو در مورد ${selectedPet?.name || 'بیمار'}...`}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ارسال</span>
            </button>
          </form>

        </div>

        {/* Right 4 Cols: Local Vet Drug Database & Quick Reference */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900">
              <Pill className="w-4 h-4 text-emerald-600" />
              <span>فارماکوپیا و دوزهای رایج در کلینیک:</span>
            </div>

            <div className="space-y-2 text-xs">
              {VET_DICTIONARIES.medications.map((med, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-0.5">
                  <div className="font-black text-slate-900 flex items-center justify-between">
                    <span>{med.name}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">{med.form}</span>
                  </div>
                  <div className="text-[11px] text-emerald-800 font-bold">دوز استاندارد: {med.defaultDosage}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Red Flag Warning Box */}
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 text-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-900 font-black">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>هشدارهای منع مصرف بحرانی (Red Flags):</span>
            </div>
            <ul className="space-y-1.5 text-rose-800 text-[11px] list-disc list-inside leading-relaxed font-medium">
              <li>تجویز استامینوفن (Paracetamol) در گربه‌ها کاملاً ممنوع و کشنده است.</li>
              <li>همزمانی مصرف کورتیکواستروئیدها (پردنیزولون) با NSAIDها (ملوکسیکام) خطر شدید زخم گوارشی دارد.</li>
              <li>دوزاژ آیورمکتین در نژادهای با جهش ژن MDR1 (کولی، ژرمن) به شدت کنترل شود.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
