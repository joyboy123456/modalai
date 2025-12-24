import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ImageComparison } from './ImageComparison';
import { Paintbrush, AlertCircle, Sparkles, Timer, Copy, Check, X } from 'lucide-react';
import { GeneratedImage } from '../types';

interface PreviewStageProps {
    currentImage: GeneratedImage | null;
    isLoading: boolean;
    isComparing: boolean;
    tempUpscaledImage: string | null;
    onApplyUpscale: () => void;
    onCancelUpscale: () => void;
    showInfo: boolean;
    setShowInfo: (val: boolean) => void;
    imageDimensions: { width: number, height: number } | null;
    setImageDimensions: (val: { width: number, height: number } | null) => void;
    copiedPrompt: boolean;
    onCopyPrompt: () => void;
    t: any;
}

export const PreviewStage: React.FC<PreviewStageProps> = ({
    currentImage,
    isLoading,
    isComparing,
    tempUpscaledImage,
    showInfo,
    setShowInfo,
    imageDimensions,
    setImageDimensions,
    t,
    copiedPrompt,
    onCopyPrompt,
}) => {
    return (
        <section className="relative w-full flex flex-col h-[360px] md:h-[480px] items-center justify-center bg-black/20 rounded-xl backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 overflow-hidden group">

            {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40 backdrop-blur-sm animate-in fade-in duration-500">
                    <div className="relative">
                        <div className="h-24 w-24 rounded-full border-4 border-white/10 border-t-purple-500 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Paintbrush className="text-purple-400 animate-pulse w-8 h-8" />
                        </div>
                    </div>
                    <p className="mt-8 text-white/80 font-medium animate-pulse text-lg">
                        {t.dreaming}
                    </p>
                </div>
            ) : null}

            {currentImage ? (
                <div className="w-full h-full flex items-center justify-center bg-black/40 animate-in zoom-in-95 duration-500 relative">

                    {isComparing && tempUpscaledImage ? (
                        <div className="w-full h-full">
                            <ImageComparison
                                beforeImage={currentImage.url}
                                afterImage={tempUpscaledImage}
                                alt={currentImage.prompt}
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
                                contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <img
                                    src={currentImage.url}
                                    alt={currentImage.prompt}
                                    className={`max-w-full max-h-full object-contain shadow-2xl cursor-grab active:cursor-grabbing transition-all duration-300 ${currentImage.isBlurred ? 'blur-lg scale-105' : ''}`}
                                    onContextMenu={(e) => e.preventDefault()}
                                    onLoad={(e) => {
                                        setImageDimensions({
                                            width: e.currentTarget.naturalWidth,
                                            height: e.currentTarget.naturalHeight
                                        });
                                    }}
                                />
                            </TransformComponent>
                        </TransformWrapper>
                    )}

                    {/* Info Popover */}
                    {showInfo && !isComparing && (
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-[90%] md:w-[400px] bg-[#1A1625]/95 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-2xl text-sm text-white/80 animate-in slide-in-from-bottom-2 fade-in duration-200">
                            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                                <h4 className="font-medium text-white">{t.imageDetails}</h4>
                                <button onClick={() => setShowInfo(false)} className="text-white/40 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-0.5">{t.model}</span>
                                        <p className="text-white/90 truncate">{currentImage.model}</p>
                                    </div>
                                    <div>
                                        <span className="block text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-0.5">{t.dimensions}</span>
                                        <p className="text-white/90">
                                            {imageDimensions ? `${imageDimensions.width} x ${imageDimensions.height}` : currentImage.aspectRatio}
                                            {currentImage.isUpscaled && <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-bold">4x</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {currentImage.seed !== undefined && (
                                        <div>
                                            <span className="block text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-0.5">{t.seed}</span>
                                            <p className="font-mono text-white/90">{currentImage.seed}</p>
                                        </div>
                                    )}
                                    {currentImage.steps !== undefined && (
                                        <div>
                                            <span className="block text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-0.5">{t.steps}</span>
                                            <p className="font-mono text-white/90">{currentImage.steps}</p>
                                        </div>
                                    )}
                                    {currentImage.duration !== undefined && (
                                        <div>
                                            <span className="block text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-0.5">{t.duration}</span>
                                            <p className="font-mono text-white/90 flex items-center gap-1">
                                                <Timer className="w-3 h-3 text-purple-400" />
                                                {currentImage.duration.toFixed(1)}s
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="block text-white/40 text-[10px] uppercase tracking-wider font-semibold">{t.prompt}</span>
                                        <button
                                            onClick={onCopyPrompt}
                                            className="flex items-center gap-1.5 text-[10px] font-medium text-purple-400 hover:text-purple-300 transition-colors"
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
                                    <div className="max-h-24 overflow-y-auto custom-scrollbar p-2 bg-black/20 rounded-lg border border-white/5">
                                        <p className="text-xs leading-relaxed text-white/70 italic select-text">{currentImage.prompt}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : !isLoading && (
                <div className="text-center text-white/60 p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative inline-block">
                        <Sparkles className="w-20 h-20 text-white/10" />
                        <Sparkles className="w-20 h-20 text-purple-500/40 absolute top-0 left-0 blur-lg animate-pulse" />
                    </div>
                    <h2 className="mt-6 text-2xl font-bold text-white/90">{t.galleryEmptyTitle}</h2>
                    <p className="mt-2 text-base text-white/40 max-w-xs mx-auto">{t.galleryEmptyDesc}</p>
                </div>
            )}
        </section>
    );
};
