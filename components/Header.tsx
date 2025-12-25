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
    <header className="w-full sticky top-0 z-50 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5">
          <Logo className="size-8" />
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          <Tooltip content={t.sourceCode} position="bottom">
            <a
              href="https://github.com/Amery2010/peinture"
              className="flex items-center justify-center p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              <Github className="w-5 h-5" />
            </a>
          </Tooltip>

          <Tooltip content={t.help} position="bottom">
            <button
              onClick={onOpenFAQ}
              className="flex items-center justify-center p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <CircleHelp className="w-5 h-5" />
            </button>
          </Tooltip>

          <Tooltip content={t.settings} position="bottom">
            <button
              onClick={onOpenSettings}
              className="flex items-center justify-center p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
      </div>
    </header>
  )
}
