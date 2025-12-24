import React, { useState, useEffect, useRef } from "react";
import { generateImage, upscaleImage, decomposeImage, LayerResult } from "./services/modalService";
import { translatePrompt } from "./services/utils";
import { GeneratedImage, AspectRatioOption, ModelOption } from "./types";
import { HistoryGallery } from "./components/HistoryGallery";
import { SettingsModal } from "./components/SettingsModal";
import { FAQModal } from "./components/FAQModal";
import { translations, Language } from "./translations";
import { ImageEditor } from "./components/ImageEditor";
import { Header, AppView } from "./components/Header";
import { Sparkles, Loader2, RotateCcw, X, Download } from "lucide-react";
import { getModelConfig, MODEL_OPTIONS } from "./constants";
import { PromptInput } from "./components/PromptInput";
import { ControlPanel } from "./components/ControlPanel";
import { PreviewStage } from "./components/PreviewStage";
import { ImageToolbar } from "./components/ImageToolbar";
import { Tooltip } from "./components/Tooltip";

export default function App() {
  // Language
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("app_language");
    if (saved === "en" || saved === "zh") return saved;
    return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  });
  const t = translations[lang];

  // Navigation
  const [currentView, setCurrentView] = useState<AppView>("creation");

  // Aspect Ratio Options
  const aspectRatioOptions = [
    { value: "1:1", label: t.ar_square },
    { value: "9:16", label: t.ar_photo_9_16 },
    { value: "16:9", label: t.ar_movie },
    { value: "3:4", label: t.ar_portrait_3_4 },
    { value: "4:3", label: t.ar_landscape_4_3 },
    { value: "3:2", label: t.ar_portrait_3_2 },
    { value: "2:3", label: t.ar_landscape_2_3 },
  ];

  // Form State
  const [prompt, setPrompt] = useState<string>("");
  const [model, setModel] = useState<ModelOption>("z-image-turbo");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(() => {
    const saved = localStorage.getItem("app_aspect_ratio");
    return (saved as AspectRatioOption) || "1:1";
  });
  const [enableHD, setEnableHD] = useState<boolean>(() => {
    return localStorage.getItem("app_enable_hd") === "true";
  });
  const [seed, setSeed] = useState<string>("");
  const [steps, setSteps] = useState<number>(9);
  const [autoTranslate, setAutoTranslate] = useState<boolean>(false);

  // UI State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isDecomposing, setIsDecomposing] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Upscale comparison
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [tempUpscaledImage, setTempUpscaledImage] = useState<string | null>(null);

  // Layer decomposition
  const [showLayersModal, setShowLayersModal] = useState<boolean>(false);
  const [decomposedLayers, setDecomposedLayers] = useState<LayerResult[]>([]);

  // History
  const [history, setHistory] = useState<GeneratedImage[]>(() => {
    try {
      const saved = localStorage.getItem("ai_image_gen_history");
      if (!saved) return [];
      const parsed: GeneratedImage[] = JSON.parse(saved);
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return parsed.filter((img) => img.timestamp > oneDayAgo);
    } catch {
      return [];
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showFAQ, setShowFAQ] = useState<boolean>(false);

  // Persistence
  useEffect(() => { localStorage.setItem("app_language", lang); }, [lang]);
  useEffect(() => { localStorage.setItem("app_aspect_ratio", aspectRatio); }, [aspectRatio]);
  useEffect(() => { localStorage.setItem("app_enable_hd", String(enableHD)); }, [enableHD]);
  useEffect(() => { localStorage.setItem("ai_image_gen_history", JSON.stringify(history)); }, [history]);

  // Initial selection
  useEffect(() => {
    if (!currentImage && history.length > 0) {
      setCurrentImage(history[0]);
    }
  }, [history.length]);

  // Cleanup timer
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startTimer = () => {
    setElapsedTime(0);
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 100);
    return startTime;
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const addToPromptHistory = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      const saved = sessionStorage.getItem("prompt_history");
      let history: string[] = saved ? JSON.parse(saved) : [];
      history = [trimmed, ...history.filter((p) => p !== trimmed)].slice(0, 50);
      sessionStorage.setItem("prompt_history", JSON.stringify(history));
    } catch {}
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    addToPromptHistory(prompt);
    setIsLoading(true);
    setError(null);
    setShowInfo(false);
    setImageDimensions(null);
    setIsComparing(false);
    setTempUpscaledImage(null);

    let finalPrompt = prompt;
    if (autoTranslate) {
      setIsTranslating(true);
      try {
        finalPrompt = await translatePrompt(prompt);
        setPrompt(finalPrompt);
      } catch {}
      setIsTranslating(false);
    }

    const startTime = startTimer();
    try {
      const seedNumber = seed.trim() === "" ? undefined : parseInt(seed, 10);
      const result = await generateImage(finalPrompt, aspectRatio, seedNumber, steps, enableHD);
      const duration = (Date.now() - startTime) / 1000;
      const newImage = { ...result, duration };
      setCurrentImage(newImage);
      setHistory((prev) => [newImage, ...prev]);
    } catch (err: any) {
      setError((t as any)[err.message] || err.message || t.generationFailed);
    } finally {
      stopTimer();
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPrompt("");
    setModel("z-image-turbo");
    setAspectRatio("1:1");
    setSeed("");
    setSteps(9);
    setEnableHD(false);
    setCurrentImage(null);
    setIsComparing(false);
    setTempUpscaledImage(null);
    setError(null);
  };

  const handleUpscale = async () => {
    if (!currentImage || isUpscaling) return;
    setIsUpscaling(true);
    setError(null);
    try {
      const { image: newUrl } = await upscaleImage(currentImage.url);
      setTempUpscaledImage(newUrl);
      setIsComparing(true);
    } catch (err: any) {
      setError(err.message || t.error_upscale_failed);
    } finally {
      setIsUpscaling(false);
    }
  };

  const handleApplyUpscale = () => {
    if (!currentImage || !tempUpscaledImage) return;
    const updated = { ...currentImage, url: tempUpscaledImage, isUpscaled: true };
    setCurrentImage(updated);
    setHistory((prev) => prev.map((img) => (img.id === updated.id ? updated : img)));
    setIsComparing(false);
    setTempUpscaledImage(null);
  };

  const handleCancelUpscale = () => {
    setIsComparing(false);
    setTempUpscaledImage(null);
  };

  const handleDecompose = async () => {
    if (!currentImage || isDecomposing) return;
    setIsDecomposing(true);
    setError(null);
    try {
      const { layers } = await decomposeImage(currentImage.url, 4, 640);
      setDecomposedLayers(layers);
      setShowLayersModal(true);
    } catch (err: any) {
      setError(err.message || "图层分解失败");
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleDownloadLayer = async (layer: LayerResult, index: number) => {
    try {
      const response = await fetch(layer.image);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `layer-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      window.open(layer.image, "_blank");
    }
  };

  const handleDownloadAllLayers = async () => {
    for (let i = 0; i < decomposedLayers.length; i++) {
      await handleDownloadLayer(decomposedLayers[i], i);
      await new Promise(r => setTimeout(r, 300));
    }
  };

  const handleHistorySelect = (image: GeneratedImage) => {
    setCurrentImage(image);
    setShowInfo(false);
    setImageDimensions(null);
    setIsComparing(false);
    setTempUpscaledImage(null);
    setError(null);
  };

  const handleDelete = () => {
    if (!currentImage) return;
    const newHistory = history.filter((img) => img.id !== currentImage.id);
    setHistory(newHistory);
    setShowInfo(false);
    setIsComparing(false);
    setTempUpscaledImage(null);
    setError(null);
    setCurrentImage(newHistory.length > 0 ? newHistory[0] : null);
  };

  const handleToggleBlur = () => {
    if (!currentImage) return;
    const updated = { ...currentImage, isBlurred: !currentImage.isBlurred };
    setCurrentImage(updated);
    setHistory((prev) => prev.map((img) => (img.id === currentImage.id ? updated : img)));
  };

  const handleCopyPrompt = async () => {
    if (!currentImage?.prompt) return;
    try {
      await navigator.clipboard.writeText(currentImage.prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {}
  };

  const handleDownload = async (imageUrl: string, fileName: string) => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const response = await fetch(imageUrl, { mode: "cors" });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(imageUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const isWorking = isLoading;
  const shouldHideToolbar = isWorking;


  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-gradient-brilliant">
      <div className="flex h-full grow flex-col">
        <Header
          currentView={currentView}
          setCurrentView={setCurrentView}
          onOpenSettings={() => setShowSettings(true)}
          onOpenFAQ={() => setShowFAQ(true)}
          t={t}
        />

        {currentView === "creation" ? (
          <main className="w-full max-w-7xl flex-1 flex flex-col-reverse md:items-stretch md:mx-auto md:flex-row gap-4 md:gap-6 px-4 md:px-8 pb-4 md:pb-8 pt-4 md:pt-6 animate-in fade-in duration-300">
            <aside className="w-full md:max-w-sm flex-shrink-0 flex flex-col gap-4 md:gap-6">
              <div className="flex-grow space-y-4 md:space-y-6">
                <div className="relative z-10 bg-black/20 p-4 md:p-6 rounded-xl backdrop-blur-xl border border-white/10 flex flex-col gap-4 md:gap-6 shadow-2xl shadow-black/20">
                  <PromptInput
                    prompt={prompt}
                    setPrompt={setPrompt}
                    isOptimizing={isOptimizing}
                    onOptimize={() => {}}
                    isTranslating={isTranslating}
                    autoTranslate={autoTranslate}
                    setAutoTranslate={setAutoTranslate}
                    t={t}
                    addToPromptHistory={addToPromptHistory}
                  />

                  <ControlPanel
                    model={model}
                    setModel={setModel}
                    aspectRatio={aspectRatio}
                    setAspectRatio={setAspectRatio}
                    seed={seed}
                    setSeed={setSeed}
                    steps={steps}
                    setSteps={setSteps}
                    enableHD={enableHD}
                    setEnableHD={setEnableHD}
                    modelOptions={MODEL_OPTIONS}
                    aspectRatioOptions={aspectRatioOptions}
                    stepsConfig={getModelConfig(model)}
                    t={t}
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={handleGenerate}
                      disabled={isWorking || !prompt.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/25"
                    >
                      {isWorking ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{t.generating} ({elapsedTime.toFixed(1)}s)</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>{t.generate}</span>
                        </>
                      )}
                    </button>
                    <Tooltip content={t.reset}>
                      <button
                        onClick={handleReset}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-5 h-5 text-white/70" />
                      </button>
                    </Tooltip>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </aside>

            <section className="flex-1 flex flex-col gap-4 md:gap-6 min-w-0">
              <PreviewStage
                currentImage={currentImage}
                isLoading={isLoading}
                isComparing={isComparing}
                tempUpscaledImage={tempUpscaledImage}
                onApplyUpscale={handleApplyUpscale}
                onCancelUpscale={handleCancelUpscale}
                showInfo={showInfo}
                setShowInfo={setShowInfo}
                imageDimensions={imageDimensions}
                setImageDimensions={setImageDimensions}
                copiedPrompt={copiedPrompt}
                onCopyPrompt={handleCopyPrompt}
                t={t}
              />

              {currentImage && !shouldHideToolbar && (
                <ImageToolbar
                  currentImage={currentImage}
                  isComparing={isComparing}
                  showInfo={showInfo}
                  setShowInfo={setShowInfo}
                  isUpscaling={isUpscaling}
                  isDownloading={isDownloading}
                  isDecomposing={isDecomposing}
                  onUpscale={handleUpscale}
                  onToggleBlur={handleToggleBlur}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onCancelUpscale={handleCancelUpscale}
                  onApplyUpscale={handleApplyUpscale}
                  onDecompose={handleDecompose}
                  t={t}
                />
              )}

              <HistoryGallery
                history={history}
                currentImage={currentImage}
                onSelect={handleHistorySelect}
                t={t}
              />
            </section>
          </main>
        ) : currentView === "editor" ? (
          <ImageEditor lang={lang} />
        ) : null}
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          lang={lang}
          setLang={setLang}
          t={t}
        />
      )}

      {showFAQ && <FAQModal onClose={() => setShowFAQ(false)} t={t} />}

      {/* Layer Decomposition Modal */}
      {showLayersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] m-4 bg-gray-900/95 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">图层分解结果</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadAllLayers}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  下载全部
                </button>
                <button
                  onClick={() => setShowLayersModal(false)}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {decomposedLayers.map((layer, index) => (
                  <div key={index} className="group relative">
                    <div className="aspect-square rounded-lg overflow-hidden bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAE/xkYGBhhAmABzAJjFaBrwOaAUQ3DLgBXAGPDCMZRAFcAAQAAAP//AwCVKi8VLs7AAAAASUVORK5CYII=')] bg-repeat">
                      <img
                        src={layer.image}
                        alt={`Layer ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
                      <button
                        onClick={() => handleDownloadLayer(layer, index)}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                      >
                        <Download className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <p className="mt-2 text-center text-sm text-white/60">
                      图层 {index + 1}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
