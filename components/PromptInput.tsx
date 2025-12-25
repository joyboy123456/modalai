"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { History, Wand2, Loader2 } from "lucide-react"
import { Tooltip } from "./Tooltip"

interface PromptInputProps {
  prompt: string
  setPrompt: (value: string) => void
  isOptimizing?: boolean
  onOptimize?: () => void
  t: any
  addToPromptHistory?: (text: string) => void
}

export const PromptInput: React.FC<PromptInputProps> = ({
  prompt,
  setPrompt,
  isOptimizing = false,
  onOptimize,
  t,
  addToPromptHistory,
}) => {
  const [promptHistory, setPromptHistory] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem("prompt_history")
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })
  const [showPromptHistory, setShowPromptHistory] = useState<boolean>(false)
  const promptHistoryRef = useRef<HTMLDivElement>(null)

  // Prompt History Persistence
  useEffect(() => {
    sessionStorage.setItem("prompt_history", JSON.stringify(promptHistory))
  }, [promptHistory])

  // Close prompt history on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (promptHistoryRef.current && !promptHistoryRef.current.contains(event.target as Node)) {
        setShowPromptHistory(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="group flex flex-col flex-1">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <label htmlFor="prompt-input" className="text-foreground text-sm font-medium cursor-pointer">
            {t.prompt}
          </label>

          {/* History Prompt Button */}
          <div className="relative" ref={promptHistoryRef}>
            <Tooltip content={t.promptHistory}>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowPromptHistory(!showPromptHistory)
                }}
                className={`flex items-center justify-center h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all border border-transparent hover:border-border ${showPromptHistory ? "text-primary bg-muted border-border" : ""}`}
                type="button"
              >
                <History className="w-4 h-4" />
              </button>
            </Tooltip>

            {showPromptHistory && (
              <div className="absolute left-0 top-full mt-2 w-72 max-h-[300px] overflow-y-auto rounded-xl bg-card border border-border shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col">
                <div className="p-1">
                  {(() => {
                    let historyItems: string[] = []
                    try {
                      const saved = sessionStorage.getItem("prompt_history")
                      historyItems = saved ? JSON.parse(saved) : []
                    } catch (e) {}

                    if (historyItems.length === 0) {
                      return (
                        <div className="p-4 text-center text-muted-foreground text-sm italic">{t.historyEmpty}</div>
                      )
                    }
                    return historyItems.map((historyPrompt, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.preventDefault()
                          setPrompt(historyPrompt)
                          setShowPromptHistory(false)
                        }}
                        className="w-full text-left p-3 text-sm text-foreground hover:bg-muted rounded-lg transition-colors group border-b border-border last:border-0"
                        type="button"
                      >
                        <p className="line-clamp-4 text-xs leading-relaxed opacity-80 group-hover:opacity-100 break-words">
                          {historyPrompt}
                        </p>
                      </button>
                    ))
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOptimize && (
            <Tooltip content={t.optimizeTitle}>
              <button
                onClick={onOptimize}
                disabled={isOptimizing || !prompt.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-input hover:bg-muted hover:text-foreground rounded-lg transition-all border border-border disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {isOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {t.optimize}
              </button>
            </Tooltip>
          )}
        </div>
      </div>
      <textarea
        id="prompt-input"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={isOptimizing}
        className="flex w-full min-w-0 flex-1 resize-none rounded-lg text-foreground focus:outline-0 focus:ring-2 focus:ring-ring border border-border bg-input focus:border-primary min-h-28 placeholder:text-muted-foreground p-3 text-sm font-normal leading-relaxed transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder={t.promptPlaceholder}
      />
    </div>
  )
}
