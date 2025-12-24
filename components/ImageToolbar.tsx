
import React, { useState, useEffect } from 'react';
import { Info as LucideInfo, Eye as LucideEye, EyeOff as LucideEyeOff, Download as LucideDownload, Trash2 as LucideTrash2, X as LucideX, Check as LucideCheck, Loader2 as LucideLoader2, Film as LucideFilm, CloudUpload } from 'lucide-react';
import { Icon4x as CustomIcon4x } from './Icons';
import { Tooltip } from './Tooltip';
import { GeneratedImage, ProviderOption } from '../types';
import { isStorageConfigured } from '../services/storageService';

interface ImageToolbarProps {
    currentImage: GeneratedImage | null;
    isComparing: boolean;
    showInfo: boolean;
    setShowInfo: (val: boolean) => void;
    isUpscaling: boolean;
    isDownloading: boolean;
    handleUpscale: () => void;
    handleToggleBlur: () => void;
    handleDownload: () => void;
    handleDelete: () => void;
    handleCancelUpscale: () => void;
    handleApplyUpscale: () => void;
    t: any;
    // New Props for Live
    isLiveMode?: boolean;
    onLiveClick?: () => void;
    isLiveGenerating?: boolean;
    isGeneratingVideoPrompt?: boolean;
    provider?: ProviderOption;
    // Cloud Props
    handleUploadToS3?: () => void;
    isUploading?: boolean;
    isUploaded?: boolean;
}

export const ImageToolbar: React.FC<ImageToolbarProps> = ({
    currentImage,
    isComparing,
    showInfo,
    setShowInfo,
    isUpscaling,
    isDownloading,
    handleUpscale,
    handleToggleBlur,
    handleDownload,
    handleDelete,
    handleCancelUpscale,
    handleApplyUpscale,
    t,
    isLiveMode,
    onLiveClick,
    isLiveGenerating,
    isGeneratingVideoPrompt,
    provider,
    handleUploadToS3,
    isUploading,
    isUploaded
}) => {
    const [isStorageEnabled, setIsStorageEnabled] = useState(false);

    useEffect(() => {
        const checkStorage = () => {
            setIsStorageEnabled(isStorageConfigured());
        };
        checkStorage();
        window.addEventListener('storage', checkStorage);
        // Fallback polling for settings changes
        const interval = setInterval(checkStorage, 2000);
        return () => {
            window.removeEventListener('storage', checkStorage);
            clearInterval(interval);
        };
    }, []);

    if (!currentImage) return null;

    // Use currentImage.provider to determine capabilities relative to the image source
    // Fallback to current provider prop if image provider is missing (should be rare)
    const imgProvider = currentImage.provider || provider;

    // Logic for button visibility:
    // 1. Details, NSFW, Download, Delete -> Always
    // 2. Live -> Always (supported via cross-provider handling)
    // 3. Upscale -> Always available (now uses Settings config)
    // 4. Upload -> If storage configured
    
    // Live button is now enabled for all images
    const showLiveButton = !isLiveMode; // Only hide if actively viewing the video (replaced by 'Image' button in PreviewStage)
    const showUpscaleButton = !isLiveMode; // Upscale is available unless in video mode
    const showUploadButton = isStorageEnabled;
    
    const isBusy = isLiveGenerating || isGeneratingVideoPrompt;
    // Disable live button if busy (generating) OR if already in Live Mode (viewing video)
    const isLiveDisabled = isBusy || isLiveMode;

    return (
        <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none z-40">
            {isComparing ? (
                /* Comparison Controls */
                <div className="pointer-events-auto flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
                    <button
                        onClick={handleCancelUpscale}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all shadow-xl hover:shadow-red-900/10 hover:border-red-500/30"
                    >
                        <LucideX className="w-5 h-5 text-red-400" />
                        <span className="font-medium text-sm">{t.discard}</span>
                    </button>
                    <button
                        onClick={handleApplyUpscale}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all shadow-xl hover:shadow-purple-900/10 hover:border-purple-500/30"
                    >
                        <LucideCheck className="w-5 h-5 text-purple-400" />
                        <span className="font-medium text-sm">{t.apply}</span>
                    </button>
                </div>
            ) : (
                /* Standard Toolbar */
                <div className="pointer-events-auto max-w-[90%] overflow-x-auto scrollbar-hide rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl transition-opacity duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                    <div className="flex items-center gap-1 p-1.5 min-w-max">

                        <Tooltip content={t.details}>
                            <button
                                onClick={() => setShowInfo(!showInfo)}
                                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${showInfo ? 'bg-purple-600 text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                            >
                                <LucideInfo className="w-5 h-5" />
                            </button>
                        </Tooltip>

                        <div className="w-px h-5 bg-white/10 mx-1"></div>

                        {/* Live Button for Gitee or Hugging Face */}
                        {showLiveButton && (
                            <>
                                 <Tooltip content={isGeneratingVideoPrompt ? t.liveGeneratingDesc : (isLiveGenerating ? t.liveGenerating : t.live)}>
                                    <button
                                        onClick={onLiveClick}
                                        disabled={isLiveDisabled}
                                        className={`
                                            flex items-center justify-center w-10 h-10 rounded-xl transition-all
                                            ${isLiveMode ? 'text-red-400 bg-red-500/10' : 'text-white/70 hover:text-red-400 hover:bg-white/10'}
                                            ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}
                                            ${isLiveMode && !isBusy ? 'cursor-default' : ''}
                                            ${!isLiveMode && !isBusy ? 'cursor-pointer' : ''}
                                        `}
                                    >
                                        {(isLiveGenerating || isGeneratingVideoPrompt) ? (
                                            <LucideLoader2 className="w-5 h-5 animate-spin text-red-400" />
                                        ) : (
                                            <LucideFilm className="w-5 h-5" />
                                        )}
                                    </button>
                                </Tooltip>
                                <div className="w-px h-5 bg-white/10 mx-1"></div>
                            </>
                        )}

                        {/* Upscale Button - Always shown if not live mode */}
                        {showUpscaleButton && (
                            <>
                                <Tooltip content={isUpscaling ? t.upscaling : t.upscale}>
                                    <button
                                        onClick={handleUpscale}
                                        disabled={isUpscaling || currentImage.isUpscaled}
                                        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${currentImage.isUpscaled ? 'text-purple-400 bg-purple-500/10' : 'text-white/70 hover:text-purple-400 hover:bg-white/10'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isUpscaling ? (
                                            <LucideLoader2 className="w-5 h-5 animate-spin text-purple-400" />
                                        ) : (
                                            <CustomIcon4x className="w-5 h-5 transition-colors duration-300" />
                                        )}
                                    </button>
                                </Tooltip>
                                <div className="w-px h-5 bg-white/10 mx-1"></div>
                            </>
                        )}

                        <Tooltip content={t.toggleBlur}>
                            <button
                                onClick={handleToggleBlur}
                                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${currentImage.isBlurred ? 'text-purple-400 bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                            >
                                {currentImage.isBlurred ? <LucideEyeOff className="w-5 h-5" /> : <LucideEye className="w-5 h-5" />}
                            </button>
                        </Tooltip>

                        <div className="w-px h-5 bg-white/10 mx-1"></div>

                        {/* Upload Button */}
                        {showUploadButton && (
                            <>
                                <Tooltip content={isUploading ? t.uploading : (isUploaded ? t.upload_success : t.upload)}>
                                    <button
                                        onClick={handleUploadToS3}
                                        disabled={isUploading}
                                        className={`
                                            flex items-center justify-center w-10 h-10 rounded-xl transition-all 
                                            ${isUploading 
                                                ? 'text-green-400 bg-green-500/10 cursor-not-allowed' 
                                                : (isUploaded 
                                                    ? 'text-green-400 bg-green-500/20 border border-green-500/30 shadow-[0_0_10px_-3px_rgba(74,222,128,0.3)] hover:bg-green-500/30' 
                                                    : 'text-white/70 hover:text-green-400 hover:bg-white/10'
                                                )
                                            }
                                        `}
                                    >
                                        {isUploading ? (
                                            <LucideLoader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <CloudUpload className="w-5 h-5" />
                                        )}
                                    </button>
                                </Tooltip>
                                <div className="w-px h-5 bg-white/10 mx-1"></div>
                            </>
                        )}

                        <Tooltip content={t.download}>
                            <button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${isDownloading ? 'text-purple-400 bg-purple-500/10 cursor-not-allowed' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                            >
                                {isDownloading ? (
                                    <LucideLoader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <LucideDownload className="w-5 h-5" />
                                )}
                            </button>
                        </Tooltip>

                        <Tooltip content={t.delete}>
                            <button
                                onClick={handleDelete}
                                className="flex items-center justify-center w-10 h-10 rounded-xl text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                                <LucideTrash2 className="w-5 h-5" />
                            </button>
                        </Tooltip>
                    </div>
                </div>
            )}
        </div>
    );
};