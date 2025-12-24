
import React, { useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ImageComparison } from './ImageComparison';
import { Paintbrush, AlertCircle, Sparkles, Timer, Copy, Check, X, Film, Image as ImageIcon } from 'lucide-react';
import { GeneratedImage } from '../types';
import { HF_MODEL_OPTIONS, GITEE_MODEL_OPTIONS, MS_MODEL_OPTIONS } from '../constants';
import { getCustomProviders } from '../services/utils';

interface PreviewStageProps {
    currentImage: GeneratedImage | null;
    isWorking: boolean;
    isTranslating: boolean;
    elapsedTime: number;
    error: string | null;
    onCloseError: () => void;
    isComparing: boolean;
    tempUpscaledImage: string | null;
    showInfo: boolean;
    setShowInfo: (val: boolean) => void;
    imageDimensions: { width: number, height: number } | null;
    setImageDimensions: (val: { width: number, height: number } | null) => void;
    t: any;
    copiedPrompt: boolean;
    handleCopyPrompt: () => void;
    children?: React.ReactNode;
    // New Props for Live
    isLiveMode?: boolean;
    onToggleLiveMode?: () => void;
    isGeneratingVideoPrompt?: boolean;
}

export const PreviewStage: React.FC<PreviewStageProps> = ({
    currentImage,
    isWorking,
    isTranslating,
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
    isLiveMode,
    onToggleLiveMode,
    isGeneratingVideoPrompt
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    const getProviderLabel = (providerId?: string) => {
        if (!providerId) return 'Hugging Face';
        if (providerId === 'gitee') return 'Gitee AI';
        if (providerId === 'modelscope') return 'Model Scope';
        if (providerId === 'huggingface') return 'Hugging Face';
        
        // Check Custom Providers
        const customProviders = getCustomProviders();
        const custom = customProviders.find(p => p.id === providerId);
        return custom ? custom.name : providerId; // Fallback to ID if not found
    };

    const getModelLabel = (modelValue: string, providerId?: string) => {
        // First check standard lists
        const option = [...HF_MODEL_OPTIONS, ...GITEE_MODEL_OPTIONS, ...MS_MODEL_OPTIONS].find(o => o.value === modelValue);
        if (option) return option.label;

        // Then check custom provider models if available
        if (providerId) {
            const customProviders = getCustomProviders();
            const custom = customProviders.find(p => p.id === providerId);
            if (custom) {
                // Search in all categories
                const allModels = [
                    ...(custom.models.generate || []),
                    ...(custom.models.edit || []),
                    ...(custom.models.video || []),
                    ...(custom.models.text || [])
                ];
                const customModel = allModels.find(m => m.id === modelValue);
                if (customModel) return customModel.name;
            }
        }
        
        return modelValue;
    };

    const isLiveGenerating = currentImage?.videoStatus === 'generating';

    return (
        <section className="relative w-full flex flex-col h-[360px] md:h-[480px] items-center justify-center bg-black/20 rounded-xl backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 overflow-hidden relative group">

            {isWorking ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40 backdrop-blur-sm animate-in fade-in duration-500">
                    <div className="relative">
                        <div className="h-24 w-24 rounded-full border-4 border-white/10 border-t-purple-500 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Paintbrush className="text-purple-400 animate-pulse w-8 h-8" />
                        </div>
                    </div>
                    <p className="mt-8 text-white/80 font-medium animate-pulse text-lg">
                        {isTranslating ? t.translating : t.dreaming}
                    </p>
                    {!isTranslating && (
                        <p className="mt-2 font-mono text-purple-300 text-lg">{elapsedTime.toFixed(1)}s</p>
                    )}
                </div>
            ) : null}

            {error ? (
                <div className="text-center text-red-400 p-8 max-w-md animate-in zoom-in-95 duration-300 relative group/error">
                    <button 
                        onClick={onCloseError}
                        className="absolute -top-2 -right-2 p-2 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                        title={t.close}
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500/50" />
                    <h3 className="text-xl font-bold text-white mb-2">{t.generationFailed}</h3>
                    <p className="text-white/60">{error}</p>
                </div>
            ) : currentImage ? (
                <div className="w-full h-full flex items-center justify-center bg-black/40 animate-in zoom-in-95 duration-500 relative">

                    {/* Image View, Comparison View, or Video View */}
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
                    ) : isLiveMode && currentImage.videoUrl ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <video
                                ref={videoRef}
                                src={currentImage.videoUrl}
                                className={`max-w-full max-h-full object-contain shadow-2xl transition-all duration-300 ${currentImage.isBlurred ? 'blur-lg scale-105' : ''}`}
                                autoPlay
                                loop
                                playsInline
                            />
                        </div>
                    ) : (
                        <TransformWrapper
                            initialScale={1}
                            minScale={1}
                            maxScale={8}
                            centerOnInit={true}
                            key={currentImage.id} // Forces component reset on new image
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

                    {/* Live Generation Overlay for both Prompt and Video generation phases */}
                    {(isGeneratingVideoPrompt || isLiveGenerating) && !isLiveMode && (
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white/80 text-xs px-2 py-1 rounded flex items-center gap-1.5 border border-white/10 z-20">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                            {isGeneratingVideoPrompt ? t.liveGeneratingDesc : t.liveGenerating}
                        </div>
                    )}
                    
                    {/* Live/Image Toggle Button (Top Right, persistent if video exists) */}
                    {currentImage.videoStatus === 'success' && currentImage.videoUrl && !isComparing && (
                         <div className="absolute top-4 right-4 z-20">
                             <button
                                onClick={onToggleLiveMode}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur border border-white/20 text-white/90 hover:bg-white/10 transition-all shadow-lg active:scale-95"
                            >
                                {isLiveMode ? (
                                    <>
                                        <ImageIcon className="w-4 h-4 text-purple-400" />
                                        <span className="text-xs font-medium">Image</span>
                                    </>
                                ) : (
                                    <>
                                        <Film className="w-4 h-4 text-red-400" />
                                        <span className="text-xs font-medium">Live</span>
                                    </>
                                )}
                            </button>
                         </div>
                    )}

                    {/* Info Popover */}
                    {showInfo && !isComparing && (
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-[90%] md:w-[400px] bg-[#1A1625]/95 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-2xl text-sm text-white/80 animate-in slide-in-from-bottom-2 fade-in duration-200">
                            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                                <h4 className="font-medium text-white">{t.imageDetails}</h4>
                                <button onClick={() => setShowInfo(false)} className="text-white/40 hover:text-white">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-0.5">{t.provider}</span>
                                        <p className="text-white/90 capitalize truncate" title={getProviderLabel(currentImage.provider)}>
                                            {getProviderLabel(currentImage.provider)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="block text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-0.5">{t.model}</span>
                                        <p className="text-white/90 truncate" title={getModelLabel(currentImage.model, currentImage.provider)}>
                                            {getModelLabel(currentImage.model, currentImage.provider)}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-0.5">{t.dimensions}</span>
                                        <p className="text-white/90">
                                            {imageDimensions ? `${imageDimensions.width} x ${imageDimensions.height}` : currentImage.aspectRatio}
                                            {/* Show aspect ratio if not custom or if dimensions match */}
                                            {currentImage.aspectRatio !== 'custom' && imageDimensions && ` (${currentImage.aspectRatio})`}
                                            {currentImage.isUpscaled && <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-bold">HD</span>}
                                        </p>
                                    </div>
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
                                <div className="grid grid-cols-2 gap-4">
                                    {currentImage.seed !== undefined && (
                                        <div>
                                            <span className="block text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-0.5">{t.seed}</span>
                                            <p className="font-mono text-white/90">{currentImage.seed}</p>
                                        </div>
                                    )}
                                    {currentImage.guidanceScale !== undefined && (
                                        <div>
                                            <span className="block text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-0.5">{t.guidanceScale}</span>
                                            <p className="font-mono text-white/90">{currentImage.guidanceScale.toFixed(1)}</p>
                                        </div>
                                    )}
                                    {currentImage.steps !== undefined && (
                                        <div>
                                            <span className="block text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-0.5">{t.steps}</span>
                                            <p className="font-mono text-white/90">{currentImage.steps}</p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="block text-white/40 text-[10px] uppercase tracking-wider font-semibold">{t.prompt}</span>
                                        <button
                                            onClick={handleCopyPrompt}
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

                    {children}
                </div>
            ) : !isWorking && (
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