"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Languages, RotateCcw } from "lucide-react"
import type { Language } from "../translations"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  lang: Language
  setLang: (lang: Language) => void
  t: any
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, lang, setLang, t }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setShowClearConfirm(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClearData = () => {
    localStorage.clear()
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">{t.settings}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Language Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Languages className="w-4 h-4" />
              {t.language}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setLang("zh")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  lang === "zh" ? "bg-purple-600 text-white" : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                中文
              </button>
              <button
                onClick={() => setLang("en")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  lang === "en" ? "bg-purple-600 text-white" : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Clear Data */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <RotateCcw className="w-4 h-4" />
              {t.clearData || "清除数据"}
            </label>
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                {t.clearAllData || "清除所有本地数据"}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleClearData}
                  className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  {t.confirm || "确认"}
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
                >
                  {t.cancel || "取消"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
