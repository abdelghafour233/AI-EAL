import React, { useState, useCallback, useRef } from 'react';
import { Image as ImageIcon, Wand2, Upload, Download, AlertCircle, RefreshCw, Sparkles, Github } from 'lucide-react';
import { ImageState, ProcessingStatus } from './types';
import { generateImageTransformation } from './services/geminiService';
import { Spinner } from './components/Spinner';

const App: React.FC = () => {
  const [inputImage, setInputImage] = useState<ImageState>({
    file: null,
    previewUrl: null,
    base64: null,
    mimeType: '',
  });
  
  const [prompt, setPrompt] = useState<string>('');
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMessage("يرجى تحميل ملف صورة صالح (JPG, PNG, WEBP)");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setInputImage({
        file,
        previewUrl: URL.createObjectURL(file),
        base64,
        mimeType: file.type
      });
      setGeneratedImage(null);
      setStatus(ProcessingStatus.IDLE);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage("فشل في قراءة ملف الصورة");
    }
  };

  const handleGenerate = async () => {
    if (!inputImage.base64 || !prompt.trim()) {
      setErrorMessage("يرجى تحميل صورة وكتابة وصف للتحويل.");
      return;
    }

    setStatus(ProcessingStatus.GENERATING);
    setErrorMessage(null);
    setGeneratedImage(null);

    try {
      const resultBase64 = await generateImageTransformation(
        inputImage.base64,
        inputImage.mimeType,
        prompt
      );
      setGeneratedImage(resultBase64);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (error: any) {
      setStatus(ProcessingStatus.ERROR);
      setErrorMessage(error.message || "حدث خطأ غير متوقع أثناء المعالجة.");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white selection:bg-purple-500 selection:text-white flex flex-col">
      
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-purple-500 to-pink-500 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-purple-400 to-pink-300">
              محول الصور الذكي
            </h1>
          </div>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer"
            className="hidden sm:flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <Github className="w-5 h-5" />
            <span>GitHub</span>
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full">
        
        {/* Intro */}
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
            حول أفكارك إلى <span className="text-purple-400">واقع بصري</span>
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            قم برفع صورة واطلب من الذكاء الاصطناعي تعديلها أو تحويلها بالكامل.
            <br />
            مدعوم بواسطة Google Gemini 2.5.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Input */}
          <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-bold">1. رفع الصورة الأصلية</h3>
            </div>

            {/* Upload Area */}
            <div 
              onClick={triggerFileInput}
              className={`
                relative group cursor-pointer
                border-2 border-dashed rounded-xl p-8 transition-all duration-300
                flex flex-col items-center justify-center min-h-[300px] overflow-hidden
                ${inputImage.previewUrl ? 'border-purple-500/50 bg-slate-900/50' : 'border-slate-600 hover:border-purple-400 hover:bg-slate-800'}
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              
              {inputImage.previewUrl ? (
                <>
                  <img 
                    src={inputImage.previewUrl} 
                    alt="Original" 
                    className="absolute inset-0 w-full h-full object-contain p-2" 
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <p className="text-white font-medium flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" /> تغيير الصورة
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-slate-200">اضغط لرفع صورة</p>
                    <p className="text-sm text-slate-500 mt-1">PNG, JPG, WEBP حتى 5 ميجابايت</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2 pt-4 border-t border-white/10">
              <Wand2 className="w-5 h-5 text-pink-400" />
              <h3 className="text-xl font-bold">2. وصف التعديل</h3>
            </div>

            {/* Prompt Input */}
            <div className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="مثال: اجعل الصورة بأسلوب الكرتون، أضف نظارات شمسية للقطة، غير الخلفية إلى الفضاء..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none h-32 transition-all"
                dir="auto"
              />
              
              <button
                onClick={handleGenerate}
                disabled={status === ProcessingStatus.GENERATING || !inputImage.base64 || !prompt.trim()}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                  ${status === ProcessingStatus.GENERATING 
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/50 hover:shadow-purple-700/50 transform hover:-translate-y-1 active:translate-y-0'}
                `}
              >
                {status === ProcessingStatus.GENERATING ? (
                  <>
                    <Spinner />
                    <span>جاري المعالجة...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>تحويل الصورة الآن</span>
                  </>
                )}
              </button>

              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{errorMessage}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl min-h-[500px] flex flex-col">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-green-400" />
              النتيجة
            </h3>

            <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden relative min-h-[400px]">
              
              {status === ProcessingStatus.IDLE && !generatedImage && (
                <div className="text-center text-slate-500 px-6">
                  <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>ستظهر الصورة المعدلة هنا</p>
                </div>
              )}

              {status === ProcessingStatus.GENERATING && (
                <div className="flex flex-col items-center gap-4 animate-pulse">
                  <Spinner />
                  <p className="text-purple-300 font-medium">الذكاء الاصطناعي يقوم بالرسم...</p>
                  <p className="text-xs text-slate-500">قد يستغرق هذا بضع ثوانٍ</p>
                </div>
              )}

              {generatedImage && (
                <div className="relative w-full h-full flex items-center justify-center group">
                  <img 
                    src={generatedImage} 
                    alt="AI Generated Result" 
                    className="max-w-full max-h-[600px] object-contain shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8 pointer-events-none">
                     {/* Overlay content if needed */}
                  </div>
                </div>
              )}
            </div>

            {generatedImage && (
              <div className="mt-6">
                <a 
                  href={generatedImage} 
                  download={`ai-generated-${Date.now()}.png`}
                  className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/30"
                >
                  <Download className="w-5 h-5" />
                  تحميل الصورة
                </a>
              </div>
            )}
          </div>

        </div>
      </main>

      <footer className="border-t border-white/10 mt-auto py-8 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-slate-400 text-sm">
            © {new Date().getFullYear()} محول الصور الذكي | AI Image Transformer
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
              <Github className="w-5 h-5 group-hover:text-purple-400 transition-colors" />
              <span>GitHub</span>
            </a>
            <a href="https://vercel.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 group-hover:text-white transition-colors"><path d="M24 22.525H0l12-21.05 12 21.05z"/></svg>
              <span>Vercel</span>
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;