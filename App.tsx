"use client"

import { useState, useEffect, useRef, useCallback, memo } from "react"
import { generateImage, upscaleImage, decomposeImage, type LayerResult } from "./services/modalService"
import type { GeneratedImage, AspectRatioOption, ModelOption } from "./types"
import { HistoryGallery } from "./components/HistoryGallery"
import { SettingsModal } from "./components/SettingsModal"
import { FAQModal } from "./components/FAQModal"
import { translations, type Language } from "./translations"
import { Header } from "./components/Header"
import { Sparkles, Loader2, X, Download } from "lucide-react"
import { getModelConfig } from "./constants"
import { ControlPanel } from "./components/ControlPanel"
import { PreviewStage } from "./components/PreviewStage"
import { PromptInput } from "./components/PromptInput"
import { ImageToolbar } from "./components/ImageToolbar"
import { Button } from "@/components/ui/button"

const HISTORY_KEY = "peinture_history"

const MemoizedHeader = memo(Header)

const ASPECT_RATIO_OPTIONS = [
  { value: "1:1", label: "1:1" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "3:2", label: "3:2" },
  { value: "2:3", label: "2:3" },
]

export default function App() {
  const [lang, setLang] = useState<Language>("zh")
  const t = translations[lang]

  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState<ModelOption>("z-image-turbo")
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>("1:1")
  const [steps, setSteps] = useState(9)
  const [seed, setSeed] = useState("")
  const [enableHD, setEnableHD] = useState(false)

  const [isGenerating, setIsGenerating] = useState(false)
  const [isUpscaling, setIsUpscaling] = useState(false)
  const [isComparing, setIsComparing] = useState(false)
  const [isDecomposing, setIsDecomposing] = useState(false)
  const [decomposedLayers, setDecomposedLayers] = useState<LayerResult[] | null>(null)
  const [showLayersModal, setShowLayersModal] = useState(false)
  const [decomposedImageId, setDecomposedImageId] = useState<string | null>(null)

  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null)
  const [tempUpscaledImage, setTempUpscaledImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [history, setHistory] = useState<GeneratedImage[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [showFAQ, setShowFAQ] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  const [elapsedTime, setElapsedTime] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load history and language from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) setHistory(JSON.parse(saved))
      const savedLang = localStorage.getItem("app_language")
      if (savedLang === "en" || savedLang === "zh") setLang(savedLang)
    } catch (e) {
      console.warn("Failed to load from localStorage")
    }
  }, [])

  // Save language
  useEffect(() => {
    localStorage.setItem("app_language", lang)
  }, [lang])

  // Save history
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    }
  }, [history])

  // Update steps when model changes
  useEffect(() => {
    const config = getModelConfig(model)
    setSteps(config.default)
  }, [model])

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startTimer = () => {
    setElapsedTime(0)
    const startTime = Date.now()
    timerRef.current = setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000)
    }, 100)
  }

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return

    setIsGenerating(true)
    setError(null)
    setGeneratedImage(null)
    setTempUpscaledImage(null)
    setIsComparing(false)
    startTimer()

    try {
      const finalPrompt = prompt.trim()

      const parsedSeed = seed ? Number.parseInt(seed, 10) : undefined
      const result = await generateImage(finalPrompt, aspectRatio, parsedSeed, steps, enableHD)

      const newImage: GeneratedImage = {
        ...result,
        prompt: finalPrompt,
        aspectRatio,
        model,
        steps,
        seed: parsedSeed,
        duration: elapsedTime,
        timestamp: Date.now(),
      }

      setGeneratedImage(newImage)
      setHistory((prev) => [newImage, ...prev].slice(0, 50))
    } catch (e: any) {
      setError(e.message || t.generationFailed)
    } finally {
      setIsGenerating(false)
      stopTimer()
    }
  }, [prompt, aspectRatio, model, enableHD, steps, seed, isGenerating, t, elapsedTime])

  const handleUpscale = useCallback(async () => {
    if (!generatedImage || isUpscaling || generatedImage.isUpscaled) return

    setIsUpscaling(true)
    setError(null)

    try {
      const result = await upscaleImage(generatedImage.url)
      setTempUpscaledImage(result.image)
      setIsComparing(true)
    } catch (e: any) {
      setError(e.message || "Upscale failed")
    } finally {
      setIsUpscaling(false)
    }
  }, [generatedImage, isUpscaling])

  const handleApplyUpscale = useCallback(() => {
    if (!tempUpscaledImage || !generatedImage) return
    const updatedImage: GeneratedImage = {
      ...generatedImage,
      url: tempUpscaledImage,
      isUpscaled: true,
    }
    setGeneratedImage(updatedImage)
    setHistory((prev) => prev.map((img) => (img.id === updatedImage.id ? updatedImage : img)))
    setIsComparing(false)
    setTempUpscaledImage(null)
  }, [tempUpscaledImage, generatedImage])

  const handleCancelUpscale = useCallback(() => {
    setTempUpscaledImage(null)
    setIsComparing(false)
  }, [])

  const handleDecompose = useCallback(async () => {
    if (!generatedImage || isDecomposing) return

    if (decomposedLayers && decomposedImageId === generatedImage.id) {
      setShowLayersModal(true)
      return
    }

    setIsDecomposing(true)
    setError(null)

    try {
      const result = await decomposeImage(generatedImage.url, 4, 640)
      setDecomposedLayers(result.layers)
      setDecomposedImageId(generatedImage.id)
      setShowLayersModal(true)
    } catch (e: any) {
      setError(e.message || "图层分解失败")
    } finally {
      setIsDecomposing(false)
    }
  }, [generatedImage, isDecomposing, decomposedLayers, decomposedImageId])

  const handleDownloadLayer = useCallback((layer: LayerResult) => {
    const link = document.createElement("a")
    link.href = layer.image
    link.download = `layer-${layer.index + 1}.png`
    link.click()
  }, [])

  const handleLoadFromHistory = useCallback(
    (image: GeneratedImage) => {
      setGeneratedImage(image)
      setPrompt(image.prompt)
      setAspectRatio(image.aspectRatio as AspectRatioOption)
      if (image.steps) setSteps(image.steps)
      if (image.seed) setSeed(image.seed.toString())
      setTempUpscaledImage(null)
      setIsComparing(false)
      setShowInfo(false)
      if (image.id !== decomposedImageId) {
        setDecomposedLayers(null)
        setDecomposedImageId(null)
      }
    },
    [decomposedImageId],
  )

  const handleClearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }, [])

  const handleDownload = useCallback(async () => {
    if (!generatedImage) return
    setIsUpscaling(true)
    try {
      const link = document.createElement("a")
      link.href = generatedImage.url
      link.download = `peinture-${generatedImage.id}.png`
      link.click()
    } finally {
      setIsUpscaling(false)
    }
  }, [generatedImage])

  const handleDelete = useCallback(() => {
    if (!generatedImage) return
    setHistory((prev) => prev.filter((img) => img.id !== generatedImage.id))
    setGeneratedImage(null)
    setTempUpscaledImage(null)
    setIsComparing(false)
  }, [generatedImage])

  const handleToggleBlur = useCallback(() => {
    if (!generatedImage) return
    const updated = { ...generatedImage, isBlurred: !generatedImage.isBlurred }
    setGeneratedImage(updated)
    setHistory((prev) => prev.map((img) => (img.id === updated.id ? updated : img)))
  }, [generatedImage])

  const handleCopyPrompt = useCallback(() => {
    if (!generatedImage) return
    navigator.clipboard.writeText(generatedImage.prompt)
    setCopiedPrompt(true)
    setTimeout(() => setCopiedPrompt(false), 2000)
  }, [generatedImage])

  return (
    <div className="min-h-screen bg-background-muted">
      <MemoizedHeader onOpenSettings={() => setShowSettings(true)} onOpenFAQ={() => setShowFAQ(true)} t={t} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
          {/* Left Panel */}
          <div className="space-y-6 bg-card rounded-xl border border-border p-6 shadow-sm h-fit">
            <PromptInput prompt={prompt} setPrompt={setPrompt} t={t} />

            <ControlPanel
              model={model}
              setModel={setModel}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              steps={steps}
              setSteps={setSteps}
              seed={seed}
              setSeed={setSeed}
              enableHD={enableHD}
              setEnableHD={setEnableHD}
              t={t}
              aspectRatioOptions={ASPECT_RATIO_OPTIONS}
            />

            {/* Button */}
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary-hover text-primary-foreground border-0 shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t.dreaming}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  {t.generate}
                </>
              )}
            </Button>

            {/* History */}
            <HistoryGallery history={history} onSelect={handleLoadFromHistory} onClear={handleClearHistory} t={t} />
          </div>

          {/* Right Panel - Preview */}
          <div className="relative">
            <PreviewStage
              currentImage={generatedImage}
              isWorking={isGenerating}
              elapsedTime={elapsedTime}
              error={error}
              onCloseError={() => setError(null)}
              isComparing={isComparing}
              tempUpscaledImage={tempUpscaledImage}
              showInfo={showInfo}
              setShowInfo={setShowInfo}
              imageDimensions={imageDimensions}
              setImageDimensions={setImageDimensions}
              t={t}
              copiedPrompt={copiedPrompt}
              handleCopyPrompt={handleCopyPrompt}
            >
              <ImageToolbar
                currentImage={generatedImage}
                isComparing={isComparing}
                showInfo={showInfo}
                setShowInfo={setShowInfo}
                isUpscaling={isUpscaling}
                isDownloading={false}
                isDecomposing={isDecomposing}
                handleUpscale={handleUpscale}
                handleDecompose={handleDecompose}
                handleToggleBlur={handleToggleBlur}
                handleDownload={handleDownload}
                handleDelete={handleDelete}
                handleCancelUpscale={handleCancelUpscale}
                handleApplyUpscale={handleApplyUpscale}
                t={t}
              />
            </PreviewStage>
          </div>
        </div>
      </main>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} lang={lang} setLang={setLang} t={t} />

      <FAQModal isOpen={showFAQ} onClose={() => setShowFAQ(false)} t={t} />

      {/* Layers Modal */}
      {showLayersModal && decomposedLayers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] m-4 bg-card rounded-xl border border-border shadow-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {t.decompose} - {decomposedLayers.length} 个图层
              </h2>
              <button
                onClick={() => setShowLayersModal(false)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {decomposedLayers.map((layer) => (
                  <div
                    key={layer.index}
                    className="group relative rounded-lg overflow-hidden bg-muted border border-border"
                  >
                    <img
                      src={layer.image || "/placeholder.svg"}
                      alt={`Layer ${layer.index + 1}`}
                      className="w-full aspect-square object-contain bg-checkerboard"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-foreground/80 to-transparent">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-primary-foreground">图层 {layer.index + 1}</span>
                        <button
                          onClick={() => handleDownloadLayer(layer)}
                          className="p-1.5 rounded-lg bg-card/80 hover:bg-card text-foreground transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
