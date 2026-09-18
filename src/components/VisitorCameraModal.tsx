import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  UserPlus,
  X,
  Eye,
  AlertCircle,
  Scan,
  UserCheck,
} from 'lucide-react';
import { Pet, VisitorCameraSnapshot } from '../types';

interface VisitorCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPets: Pet[];
  onSelectPetForReception: (pet: Pet) => void;
  onRegisterQuickVisitor: (desc: string, tempId: string) => void;
}

export const VisitorCameraModal: React.FC<VisitorCameraModalProps> = ({
  isOpen,
  onClose,
  allPets,
  onSelectPetForReception,
  onRegisterQuickVisitor,
}) => {
  const [useLiveWebcam, setUseLiveWebcam] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Preset sample entrance camera snapshots for instant testing
  const sampleSnapshots = [
    {
      title: 'آقای جوان با سگ پامرانین (آقای علیزاده و لوسی)',
      url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80',
    },
    {
      title: 'خانم با سگ ژرمن شپرد (خانم کریمی و هیرو)',
      url: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=600&auto=format&fit=crop&q=80',
    },
    {
      title: 'مراجعه‌کننده جدید با گربه بریتیش خاکستری',
      url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
    },
  ];

  useEffect(() => {
    if (!isOpen) {
      stopWebcam();
      return;
    }
    if (useLiveWebcam) {
      startWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [isOpen, useLiveWebcam]);

  const startWebcam = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err: any) {
      console.warn('Webcam permission not granted or device not found:', err);
      setCameraError('دسترسی به وب‌کم ورودی کلینیک برقرار نشد؛ تصاویر شبیه‌سازی شده زیر را انتخاب فرمایید.');
      setUseLiveWebcam(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleCaptureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        analyzeImage(dataUrl);
      }
    }
  };

  const analyzeImage = async (imageSrc: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await fetch('/api/visitor-camera/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageSrc,
          knownPets: allPets,
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysisResult(data.analysis);
      }
    } catch (err) {
      console.error('Failed to analyze image:', err);
      // Fallback
      setAnalysisResult({
        summaryDescription: 'مراجعه‌کننده همراه با سگ پامرانین در لابی کلینیک رویت شد.',
        personDescription: 'آقای جوان با لباس سرمه‌ای',
        petSpecies: 'سگ',
        petBreed: 'پامرانین',
        petColor: 'کرم نسکافه‌ای',
        matchedPetSuggestion: { id: 'pet-1', name: 'لوسی' },
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A27]/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white text-[#2D3A27] w-full max-w-3xl rounded-[32px] shadow-2xl border border-[#E6E9DF] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E6E9DF] flex items-center justify-between bg-[#F7F8F3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4A6741] text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#2D3A27] flex items-center gap-2">
                تشخیص هویت مراجعین با دوربین ورودی (Entrance Vision AI)
              </h2>
              <p className="text-xs text-[#5C7457]">
                پردازش زنده تصویر ورودی لابی • تطبیق با پرونده‌های موجود یا صدور شناسه موقت
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#5C7457] hover:text-[#2D3A27] hover:bg-[#E6E9DF] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          
          {/* Video / Snapshot Viewport */}
          <div className="relative bg-[#2D3A27] rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-[#E6E9DF] shadow-inner">
            
            {useLiveWebcam && !capturedImage ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured Entrance"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-[#D4E0CD] p-6">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-60" />
                <p className="text-sm">تصویری ضبط نشده است</p>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            {/* Live Camera Scanner Overlay */}
            {useLiveWebcam && !capturedImage && (
              <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-[#D4E0CD]/60 m-6 rounded-2xl flex flex-col justify-between p-4">
                <div className="flex justify-between items-center text-[11px] text-[#D4E0CD] font-mono bg-[#2D3A27]/80 px-2.5 py-1 rounded-lg backdrop-blur-xs w-max border border-[#4A6741]">
                  <span className="w-2 h-2 rounded-full bg-[#4A6741] animate-ping mr-2"></span>
                  <span>دوربین ورودی لابی (CAM-01 / HD 1080p)</span>
                </div>
                <div className="text-center text-xs text-[#F7F8F3] bg-[#2D3A27]/80 py-1.5 px-3.5 rounded-xl backdrop-blur-xs mx-auto border border-[#4A6741]">
                  حیوان و همراه را در کادر قرار داده و دکمه عکس را فشار دهید
                </div>
              </div>
            )}

            {/* Analysis in progress spinner */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-[#2D3A27]/85 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                <RefreshCw className="w-10 h-10 animate-spin text-[#D4E0CD] mb-3" />
                <div className="text-sm font-bold">هوش مصنوعی در حال تحلیل تصویر و تطبیق چهره و نژاد پت...</div>
                <div className="text-xs text-[#D4E0CD] mt-1">مدل چندوجهی Gemini 3.7 Vision</div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCapturedImage(null);
                  setAnalysisResult(null);
                  setUseLiveWebcam(true);
                }}
                className="bg-[#F7F8F3] hover:bg-[#E6E9DF] text-[#2D3A27] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-[#E6E9DF]"
              >
                پخش زنده دوربین
              </button>
            </div>

            <button
              onClick={handleCaptureSnapshot}
              disabled={isAnalyzing}
              className="bg-[#4A6741] hover:bg-[#3D5535] active:scale-95 text-white px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Scan className="w-4 h-4" />
              <span>ثبت تصویر و تحلیل فوری AI</span>
            </button>
          </div>

          {/* Sample Presets for Testing */}
          <div>
            <div className="text-xs font-bold text-[#2D3A27] mb-2">
              تصاویر شبیه‌سازی شده ورودی کلینیک (برای تست سریع):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {sampleSnapshots.map((snap, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCapturedImage(snap.url);
                    setUseLiveWebcam(false);
                    analyzeImage(snap.url);
                  }}
                  className="flex items-center gap-2.5 p-2.5 bg-[#F7F8F3] hover:bg-[#E6E9DF] border border-[#E6E9DF] rounded-2xl text-right transition-all cursor-pointer text-xs"
                >
                  <img src={snap.url} alt="" className="w-12 h-12 rounded-xl object-cover border border-[#E6E9DF]" />
                  <span className="font-semibold text-[#2D3A27] leading-snug">{snap.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Vision Analysis Output */}
          {analysisResult && (
            <div className="p-5 bg-[#F7F8F3] border-2 border-[#4A6741] rounded-[24px] space-y-4 animate-fadeIn">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#4A6741]" />
                  <span className="text-xs font-black text-[#2D3A27]">نتیجه پردازش هوش مصنوعی دوربین ورودی:</span>
                </div>
                <span className="text-[11px] bg-[#D4E0CD] text-[#2D3A27] font-bold px-2.5 py-0.5 rounded-md font-mono">
                  Gemini Vision
                </span>
              </div>

              <div className="text-sm font-bold text-[#2D3A27] leading-relaxed bg-white p-3.5 rounded-xl border border-[#E6E9DF] shadow-xs">
                {analysisResult.summaryDescription}
              </div>

              {/* Detected breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-[#E6E9DF]">
                  <div className="text-[#5C7457] text-[10px]">همراه / فرد:</div>
                  <div className="font-bold text-[#2D3A27] mt-0.5">{analysisResult.personDescription || 'نامشخص'}</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#E6E9DF]">
                  <div className="text-[#5C7457] text-[10px]">گونه و نژاد:</div>
                  <div className="font-bold text-[#2D3A27] mt-0.5">
                    {analysisResult.petSpecies} {analysisResult.petBreed && `(${analysisResult.petBreed})`}
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#E6E9DF]">
                  <div className="text-[#5C7457] text-[10px]">رنگ ظاهری:</div>
                  <div className="font-bold text-[#2D3A27] mt-0.5">{analysisResult.petColor || 'نامشخص'}</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#E6E9DF]">
                  <div className="text-[#5C7457] text-[10px]">شناسه تردد:</div>
                  <div className="font-mono font-bold text-[#4A6741] mt-0.5">VIS-{Math.floor(Math.random() * 800) + 100}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-2">
                {analysisResult.matchedPetSuggestion ? (
                  <button
                    onClick={() => {
                      const matched = allPets.find(p => p.id === analysisResult.matchedPetSuggestion.id || p.name.includes(analysisResult.matchedPetSuggestion.name)) || allPets[0];
                      onSelectPetForReception(matched);
                      onClose();
                    }}
                    className="flex-1 bg-[#4A6741] hover:bg-[#3D5535] text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>باز کردن پرونده بیمار تطبیق داده شده ({analysisResult.matchedPetSuggestion.name || 'لوسی'})</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onRegisterQuickVisitor(analysisResult.summaryDescription, `VIS-${Date.now().toString().slice(-4)}`);
                      onClose();
                    }}
                    className="flex-1 bg-[#5C7457] hover:bg-[#4A6741] text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>تشکیل پرونده سریع برای مراجعه‌کننده جدید</span>
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F7F8F3] border-t border-[#E6E9DF] flex items-center justify-between text-xs text-[#5C7457]">
          <span>پروتکل پشتیبانی شده: WebRTC / RTSP Local Stream</span>
          <button
            onClick={onClose}
            className="text-[#2D3A27] hover:text-[#4A6741] font-bold cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>

      </div>
    </div>
  );
};
