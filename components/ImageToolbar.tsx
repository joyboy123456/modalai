"use client"

import type React from "react"
import {
  LucideInfo,
  LucideEye,
  LucideEyeOff,
  LucideDownload,
  LucideTrash2,
  LucideX,
  LucideCheck,
  LucideLoader2,
} from "lucide-react"
import { Icon4x as CustomIcon4x } from "./Icons"
import { Tooltip } from "./Tooltip"
import type { GeneratedImage } from "../types"

interface ImageToolbarProps {
  currentImage: GeneratedImage | null
  isComparing: boolean
  showInfo: boolean
  setShowInfo: (val: boolean) => void
  isUpscaling: boolean
  isDownloading: boolean
  handleUpscale: () => void
  handleToggleBlur: () => void
  handleDownload: () => void
  handleDelete: () => void
  handleCancelUpscale: () => void
  handleApplyUpscale: () => void
  t: any
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
}) => {
  if (!currentImage) return null

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
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${showInfo ? "bg-purple-600 text-white shadow-lg" : "text-white/70 hover:text-white hover:bg-white/10"}`}
              >
                <LucideInfo className="w-5 h-5" />
              </button>
            </Tooltip>

            <div className="w-px h-5 bg-white/10 mx-1"></div>

            {/* Upscale Button */}
            <Tooltip content={isUpscaling ? t.upscaling : t.upscale}>
              <button
                onClick={handleUpscale}
                disabled={isUpscaling || currentImage.isUpscaled}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${currentImage.isUpscaled ? "text-purple-400 bg-purple-500/10" : "text-white/70 hover:text-purple-400 hover:bg-white/10"} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isUpscaling ? (
                  <LucideLoader2 className="w-5 h-5 animate-spin text-purple-400" />
                ) : (
                  <CustomIcon4x className="w-5 h-5 transition-colors duration-300" />
                )}
              </button>
            </Tooltip>

            <div className="w-px h-5 bg-white/10 mx-1"></div>

            <Tooltip content={t.toggleBlur}>
              <button
                onClick={handleToggleBlur}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${currentImage.isBlurred ? "text-purple-400 bg-white/10" : "text-white/70 hover:text-white hover:bg-white/10"}`}
              >
                {currentImage.isBlurred ? <LucideEyeOff className="w-5 h-5" /> : <LucideEye className="w-5 h-5" />}
              </button>
            </Tooltip>

            <div className="w-px h-5 bg-white/10 mx-1"></div>

            <Tooltip content={t.download}>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${isDownloading ? "text-purple-400 bg-purple-500/10 cursor-not-allowed" : "text-white/70 hover:text-white hover:bg-white/10"}`}
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
  )
}
