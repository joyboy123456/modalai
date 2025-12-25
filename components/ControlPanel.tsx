"use client"

import type React from "react"
import { useState } from "react"
import { Select } from "./Select"
import { Tooltip } from "./Tooltip"
import { Settings, ChevronUp, ChevronDown, Minus, Plus, Dices, Cpu } from "lucide-react"
import type { ModelOption, AspectRatioOption } from "../types"
import { MODEL_OPTIONS, getModelConfig } from "../constants"

interface ControlPanelProps {
  model: ModelOption
  setModel: (val: ModelOption) => void
  aspectRatio: AspectRatioOption
  setAspectRatio: (val: AspectRatioOption) => void
  steps: number
  setSteps: (val: number) => void
  seed: string
  setSeed: (val: string) => void
  enableHD: boolean
  setEnableHD: (val: boolean) => void
  t: any
  aspectRatioOptions: { value: string; label: string }[]
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  model,
  setModel,
  aspectRatio,
  setAspectRatio,
  steps,
  setSteps,
  seed,
  setSeed,
  enableHD,
  setEnableHD,
  t,
  aspectRatioOptions,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const modelConfig = getModelConfig(model)

  const handleRandomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 2147483647).toString())
  }

  const handleAdjustSeed = (amount: number) => {
    const current = Number.parseInt(seed || "0", 10)
    if (isNaN(current)) {
      setSeed((0 + amount).toString())
    } else {
      setSeed((current + amount).toString())
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-foreground text-sm font-medium mb-2">{t.model}</label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Select
              value={model}
              onChange={(val) => setModel(val as ModelOption)}
              options={MODEL_OPTIONS}
              icon={<Cpu className="w-5 h-5" />}
            />
          </div>
          <Tooltip content={t.hdMode || "高清模式"}>
            <button
              onClick={() => setEnableHD(!enableHD)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                enableHD
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-input border-border text-muted-foreground hover:border-foreground/20"
              }`}
            >
              <span className="text-xs font-medium">高清</span>
              <div className={`w-8 h-4 rounded-full transition-colors ${enableHD ? "bg-primary" : "bg-border"}`}>
                <div
                  className={`w-3 h-3 rounded-full bg-card transition-transform mt-0.5 shadow-sm ${enableHD ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`}
                />
              </div>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Aspect Ratio */}
      <Select
        label={t.aspectRatio}
        value={aspectRatio}
        onChange={(val) => setAspectRatio(val as AspectRatioOption)}
        options={aspectRatioOptions}
      />

      <div className="border-t border-border pt-5">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="flex items-center justify-between w-full text-left text-muted-foreground hover:text-foreground transition-colors group"
        >
          <span className="text-sm font-medium flex items-center gap-2">
            <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
            {t.advancedSettings}
          </span>
          {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isAdvancedOpen ? "grid-rows-[1fr] mt-5" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden">
            <div className="space-y-5">
              {/* Steps */}
              <div className="group">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-foreground text-sm font-medium">{t.steps}</p>
                  <span className="text-muted-foreground text-xs bg-muted px-2 py-0.5 rounded font-mono">{steps}</span>
                </div>
                <input
                  type="range"
                  min={modelConfig.min}
                  max={modelConfig.max}
                  value={steps}
                  onChange={(e) => setSteps(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="group">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-foreground text-sm font-medium">{t.seed}</p>
                  <span className="text-muted-foreground text-xs">{t.seedOptional}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center rounded-lg border border-border bg-input focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-all h-10 overflow-hidden">
                    <button
                      onClick={() => handleAdjustSeed(-1)}
                      className="h-full px-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-r border-border"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      className="flex-1 h-full bg-transparent border-none text-foreground focus:ring-0 placeholder:text-muted-foreground px-2 text-xs font-mono text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder={t.seedPlaceholder}
                    />
                    <button
                      onClick={() => handleAdjustSeed(1)}
                      className="h-full px-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-l border-border"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Tooltip content={t.seedPlaceholder}>
                    <button
                      onClick={handleRandomizeSeed}
                      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground hover:bg-border hover:text-foreground transition-colors active:scale-95"
                    >
                      <Dices className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
