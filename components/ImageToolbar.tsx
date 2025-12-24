import React from 'react';
import { Info as LucideInfo, Eye as LucideEye, EyeOff as LucideEyeOff, Download as LucideDownload, Trash2 as LucideTrash2, X as LucideX, Check as LucideCheck, Loader2 as LucideLoader2, Layers as LucideLayers } from 'lucide-react';
import { Icon4x as CustomIcon4x } from './Icons';
import { Tooltip } from './Tooltip';
import { GeneratedImage } from '../types';

interface ImageToolbarProps {
    currentImage: GeneratedImage | null;
    isComparing: boolean;
    showInfo: boolean;
    setShowInfo: (val: boolean) => void;
    isUpscaling: boolean;
    isDownloading: boolean;
    isDecomposing?: boolean;
    onUpscale: () => void;
    onToggleBlur: () => void;
    onDownload: (url: string, filename: string) => void;
    onDelete: () => void;
    onCancelUpscale?: () => void;
    onApplyUpscale?: () => void;
    onDecompose?: () => void;
    t: any;
}

export const ImageToolbar: React.FC<ImageToolbarProps> = ({
    currentImage,
    isComparing,
    showInfo,
    setShowInfo,
    isUpscaling,
    isDownloading,
    isDecomposing = false,
    onUpscale,
    onToggleBlur,
    onDownload,
    onDelete,
    onCancelUpscale,
    onApplyUpscale,
    onDecompose,
    t,
}) => {
    if (!currentImage) return null;

    const handleDownload = () => {
        const filename = `z-image-${currentImage.id}.jpg`;
        onDownload(currentImage.url, filename);
    };

    return (
        <div className="flex justify-center pointer-events-none z-40">
            {isComparing ? (
                /* Comparison Controls */
                <div className="pointer-events-auto flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
                    <button
                        onClick={onCancelUpscale}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all shadow-xl hover:shadow-red-900/10 hover:border-red-500/30"
                    >
                        <LucideX className="w-5 h-5 text-red-400" />
                        <span className="font-medium text-sm">{t.discard}</span>
                    </button>
                    <button
                        onClick={onApplyUpscale}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all shadow-xl hover:shadow-purple-900/10 hover:border-purple-500/30"
                    >
                        <LucideCheck className="w-5 h-5 text-purple-400" />
                        <span className="font-medium text-sm">{t.apply}</span>
                    </button>
                </div>
            ) : (
                /* Standard Toolbar */
                <div className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl">

                    <Tooltip content={t.details}>
                        <button
                            onClick={() => setShowInfo(!showInfo)}
                            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${showInfo ? 'bg-purple-600 text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                        >
                            <LucideInfo className="w-5 h-5" />
                        </button>
                    </Tooltip>

                    <div className="w-px h-5 bg-white/10 mx-1"></div>

                    {/* Upscale Button */}
                    <Tooltip content={isUpscaling ? t.upscaling : t.upscale}>
                        <button
                            onClick={onUpscale}
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

                    {/* Layer Decomposition Button */}
                    {onDecompose && (
                        <Tooltip content={isDecomposing ? t.decomposing || '分层中...' : t.decompose || '图层分解'}>
                            <button
                                onClick={onDecompose}
                                disabled={isDecomposing}
                                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all text-white/70 hover:text-cyan-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isDecomposing ? (
                                    <LucideLoader2 className="w-5 h-5 animate-spin text-cyan-400" />
                                ) : (
                                    <LucideLayers className="w-5 h-5" />
                                )}
                            </button>
                        </Tooltip>
                    )}

                    <div className="w-px h-5 bg-white/10 mx-1"></div>

                    <Tooltip content={t.toggleBlur}>
                        <button
                            onClick={onToggleBlur}
                            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${currentImage.isBlurred ? 'text-purple-400 bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                        >
                            {currentImage.isBlurred ? <LucideEyeOff className="w-5 h-5" /> : <LucideEye className="w-5 h-5" />}
                        </button>
                    </Tooltip>

                    <div className="w-px h-5 bg-white/10 mx-1"></div>

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
                            onClick={onDelete}
                            className="flex items-center justify-center w-10 h-10 rounded-xl text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                            <LucideTrash2 className="w-5 h-5" />
                        </button>
                    </Tooltip>
                </div>
            )}
        </div>
    );
};
