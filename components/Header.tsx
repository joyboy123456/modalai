"use client"

import type React from "react"
import { Logo } from "./Icons"
import { Tooltip } from "./Tooltip"
import { Settings, CircleHelp, Github } from "lucide-react"

interface HeaderProps {
  onOpenSettings: () => void
  onOpenFAQ: () => void
  t: any
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenFAQ, t }) => {
  return (
    <header className="w-full backdrop-blur-md sticky top-0 z-50 bg-background-dark/30 border-b border-white/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 md:px-8 md:py-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-2 text-white">
          <Logo className="size-8 md:size-10" />
          <h1 className="text-white text-lg md:text-xl font-bold leading-tight tracking-[-0.015em]">{t.appTitle}</h1>
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          <Tooltip content={t.sourceCode} position="bottom">
            <a
              href="https://github.com/Amery2010/peinture"
              className="flex items-center justify-center p-2 rounded-lg text-white/70 hover:text-purple-400 hover:bg-white/10 transition-all active:scale-95"
              target="_blank"
              rel="noreferrer"
            >
              <Github className="w-5 h-5" />
            </a>
          </Tooltip>

          <Tooltip content={t.help} position="bottom">
            <button
              onClick={onOpenFAQ}
              className="flex items-center justify-center p-2 rounded-lg text-white/70 hover:text-green-400 hover:bg-white/10 transition-all active:scale-95"
            >
              <CircleHelp className="w-5 h-5" />
            </button>
          </Tooltip>

          <Tooltip content={t.settings} position="bottom">
            <button
              onClick={onOpenSettings}
              className="flex items-center justify-center p-2 rounded-lg text-white/70 hover:text-purple-400 hover:bg-white/10 transition-all active:scale-95"
            >
              <Settings className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
      </div>
    </header>
  )
}
