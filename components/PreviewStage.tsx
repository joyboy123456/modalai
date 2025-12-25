"use client"

import type React from "react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { ImageComparison } from "./ImageComparison"
import { Paintbrush, AlertCircle, Sparkles, Timer, Copy, Check, X } from "lucide-react"
import type { GeneratedImage } from "../types"
import { MODEL_OPTIONS } from "../constants"

interface PreviewStageProps {
  currentImage: GeneratedImage | null
  isWorking: boolean
  elapsedTime: number
  error: string | null
  onCloseError: () => void
  isComparing: boolean
  tempUpscaledImage: string | null
  showInfo: boolean
  setShowInfo: (val: boolean) => void
  imageDimensions: { width: number; height: number } | null
  setImageDimensions: (val: { width: number; height: number } | null) => void
  t: any
  copiedPrompt: boolean
  handleCopyPrompt: () => void
  children?: React.ReactNode
}

export const PreviewStage: React.FC<PreviewStageProps> = ({
  currentImage,
  isWorking,
  elapsedTime,
  error,
  onCloseError,
  isComparing,
  tempUpscaledImage,
  showInfo,
  setShowInfo,
  imageDimensions,
  setImageDimensions,
  t,
  copiedPrompt,
  handleCopyPrompt,
  children,
}) => {
  const getModelLabel = (modelValue: string) => {
    const option = MODEL_OPTIONS.find((o) => o.value === modelValue)
    return option ? option.label : modelValue
  }

  return (
    <section className="relative w-full flex flex-col h-[360px] md:h-[520px] items-center justify-center bg-muted rounded-xl border border-border shadow-sm overflow-hidden group">
      {isWorking ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-card/80 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-border border-t-primary animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Paintbrush className="text-primary w-7 h-7" />
            </div>
          </div>
          <p className="mt-6 text-foreground font-medium text-base">{t.dreaming}</p>
          <p className="mt-2 font-mono text-primary text-lg">{elapsedTime.toFixed(1)}s</p>
        </div>
      ) : null}

      {error ? (
        <div className="text-center p-8 max-w-md animate-in zoom-in-95 duration-300 relative">
          <button
            onClick={onCloseError}
            className="absolute -top-2 -right-2 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
            title={t.close}
          >
            <X className="w-5 h-5" />
          </button>
          <AlertCircle className="w-14 h-14 mx-auto mb-4 text-destructive/60" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t.generationFailed}</h3>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      ) : currentImage ? (
        <div className="w-full h-full flex items-center justify-center bg-card animate-in zoom-in-95 duration-500 relative">
          {isComparing && tempUpscaledImage ? (
            <div className="w-full h-full">
              <ImageComparison
                beforeImage={currentImage.url}
                afterImage={tempUpscaledImage}
                alt={currentImage.prompt}
                labelBefore={t.compare_original}
                labelAfter={t.compare_upscaled}
              />
            </div>
          ) : (
            <TransformWrapper
              initialScale={1}
              minScale={1}
              maxScale={8}
              centerOnInit={true}
              key={currentImage.id}
              wheel={{ step: 0.5 }}
            >
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={currentImage.url || "/placeholder.svg"}
                  alt={currentImage.prompt}
                  className={`max-w-full max-h-full object-contain shadow-md cursor-grab active:cursor-grabbing transition-all duration-300 ${currentImage.isBlurred ? "blur-lg scale-105" : ""}`}
                  onContextMenu={(e) => e.preventDefault()}
                  onLoad={(e) => {
                    setImageDimensions({
                      width: e.currentTarget.naturalWidth,
                      height: e.currentTarget.naturalHeight,
                    })
                  }}
                />
              </TransformComponent>
            </TransformWrapper>
          )}

          {showInfo && !isComparing && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-[90%] md:w-[400px] bg-card border border-border rounded-xl p-5 shadow-lg text-sm animate-in slide-in-from-bottom-2 fade-in duration-200">
              <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                <h4 className="font-medium text-foreground">{t.imageDetails}</h4>
                <button onClick={() => setShowInfo(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-0.5">
                      {t.model}
                    </span>
                    <p className="text-foreground truncate">{getModelLabel(currentImage.model)}</p>
                  </div>
                  <div>
                    <span className="block text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-0.5">
                      {t.dimensions}
                    </span>
                    <p className="text-foreground">
                      {imageDimensions
                        ? `${imageDimensions.width} x ${imageDimensions.height}`
                        : currentImage.aspectRatio}
                      {currentImage.isUpscaled && (
                        <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-bold">
                          4K
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {currentImage.duration !== undefined && (
                    <div>
                      <span className="block text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-0.5">
                        {t.duration}
                      </span>
                      <p className="font-mono text-foreground flex items-center gap-1">
                        <Timer className="w-3 h-3 text-primary" />
                        {currentImage.duration.toFixed(1)}s
                      </p>
                    </div>
                  )}
                  {currentImage.seed !== undefined && (
                    <div>
                      <span className="block text-muted-foreground text-[10px] uppercase tracking-wider font-semibold mb-0.5">
                        {t.seed}
                      </span>
                      <p className="font-mono text-foreground">{currentImage.seed}</p>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="block text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                      {t.prompt}
                    </span>
                    <button
                      onClick={handleCopyPrompt}
                      className="flex items-center gap-1.5 text-[10px] font-medium text-primary hover:text-primary-hover transition-colors"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="w-3 h-3" />
                          {t.copied}
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          {t.copy}
                        </>
                      )}
                    </button>
                  </div>
                  <div className="max-h-24 overflow-y-auto p-2 bg-muted rounded-lg border border-border">
                    <p className="text-xs leading-relaxed text-muted-foreground italic select-text">
                      {currentImage.prompt}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {children}
        </div>
      ) : (
        !isWorking && (
          <div className="text-center p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-16 h-16 mx-auto text-border" />
            <h2 className="mt-5 text-xl font-semibold text-foreground">{t.galleryEmptyTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">{t.galleryEmptyDesc}</p>
          </div>
        )
      )}
    </section>
  )
}
