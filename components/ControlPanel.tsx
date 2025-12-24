import React, { useState } from "react";
import { Select } from "./Select";
import { Tooltip } from "./Tooltip";
import { Settings, ChevronUp, ChevronDown, Minus, Plus, Dices, Cpu } from "lucide-react";
import { ModelOption, AspectRatioOption } from "../types";

interface ControlPanelProps {
  model: ModelOption;
  setModel: (val: ModelOption) => void;
  aspectRatio: AspectRatioOption;
  setAspectRatio: (val: AspectRatioOption) => void;
  steps: number;
  setSteps: (val: number) => void;
  seed: string;
  setSeed: (val: string) => void;
  enableHD: boolean;
  setEnableHD: (val: boolean) => void;
  modelOptions: { value: string; label: string }[];
  aspectRatioOptions: { value: string; label: string }[];
  stepsConfig: { min: number; max: number; default: number };
  t: any;
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
  modelOptions,
  aspectRatioOptions,
  stepsConfig,
  t,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleRandomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 2147483647).toString());
  };

  const handleAdjustSeed = (amount: number) => {
    const current = parseInt(seed || "0", 10);
    setSeed((isNaN(current) ? amount : current + amount).toString());
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Model Selection */}
      <Select
        label={t.model}
        value={model}
        onChange={(val) => setModel(val as ModelOption)}
        options={modelOptions}
        icon={<Cpu className="w-5 h-5" />}
        headerContent={
          <div className="flex items-center gap-2 animate-in fade-in duration-300">
            <span className="text-xs font-medium text-white/50">{t.hd}</span>
            <Tooltip content={enableHD ? t.hdEnabled : t.hdDisabled}>
              <button
                onClick={() => setEnableHD(!enableHD)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${enableHD ? "bg-purple-600" : "bg-white/10"}`}
              >
                <span
                  className={`${enableHD ? "translate-x-4" : "translate-x-1"} inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </Tooltip>
          </div>
        }
      />

      {/* Aspect Ratio */}
      <Select
        label={t.aspectRatio}
        value={aspectRatio}
        onChange={(val) => setAspectRatio(val as AspectRatioOption)}
        options={aspectRatioOptions}
      />

      {/* Advanced Settings */}
      <div className="border-t border-white/5 pt-4">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="flex items-center justify-between w-full text-left text-white/60 hover:text-purple-400 transition-colors group"
        >
          <span className="text-sm font-medium flex items-center gap-2">
            <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
            {t.advancedSettings}
          </span>
          {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isAdvancedOpen ? "grid-rows-[1fr] mt-4" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden">
            <div className="space-y-5">
              {/* Steps */}
              <div className="group">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-white/80 text-sm font-medium">{t.steps}</p>
                  <span className="text-white/50 text-xs bg-white/5 px-2 py-0.5 rounded font-mono">{steps}</span>
                </div>
                <input
                  type="range"
                  min={stepsConfig.min}
                  max={stepsConfig.max}
                  value={steps}
                  onChange={(e) => setSteps(Number(e.target.value))}
                  className="custom-range text-purple-500 w-full"
                />
              </div>

              {/* Seed */}
              <div className="group">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-white/80 text-sm font-medium">{t.seed}</p>
                  <span className="text-white/40 text-xs">{t.seedOptional}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center rounded-lg border border-white/10 bg-white/5 focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500 transition-all h-10 overflow-hidden">
                    <button
                      onClick={() => handleAdjustSeed(-1)}
                      className="h-full px-2 text-white/40 hover:text-white hover:bg-white/5 transition-colors border-r border-white/5"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      className="form-input flex-1 h-full bg-transparent border-none text-white/90 focus:ring-0 placeholder:text-white/30 px-2 text-xs font-mono text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder={t.seedPlaceholder}
                    />
                    <button
                      onClick={() => handleAdjustSeed(1)}
                      className="h-full px-2 text-white/40 hover:text-white hover:bg-white/5 transition-colors border-l border-white/5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Tooltip content={t.seedPlaceholder}>
                    <button
                      onClick={handleRandomizeSeed}
                      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors active:scale-95"
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
  );
};
