"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ChevronsUpDown, Check } from "lucide-react"

export interface Option {
  value: string
  label: string
}

export interface OptionGroup {
  label: string
  options: Option[]
}

interface SelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: (Option | OptionGroup)[]
  icon?: React.ReactNode
  headerContent?: React.ReactNode
  dense?: boolean
  horizontal?: boolean
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  icon,
  headerContent,
  dense = false,
  horizontal = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [maxHeight, setMaxHeight] = useState<number>(300)

  const flattenedOptions = options.flatMap((opt) => ("options" in opt ? opt.options : [opt]))

  const selectedOption = flattenedOptions.find((opt) => opt.value === value) || flattenedOptions[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const scrollY = window.scrollY || document.documentElement.scrollTop
      const elementBottom = rect.bottom + scrollY
      const docHeight = document.documentElement.scrollHeight
      const spaceBelow = docHeight - elementBottom - 20
      const calculatedMaxHeight = Math.max(120, Math.min(300, spaceBelow))
      setMaxHeight(calculatedMaxHeight)
    }
  }, [isOpen])

  const renderOption = (option: Option) => (
    <button
      key={option.value}
      onClick={() => {
        onChange(option.value)
        setIsOpen(false)
      }}
      className={`
        w-full flex items-center justify-between px-4 py-2.5 text-sm text-left
        transition-colors hover:bg-muted
        ${option.value === value ? "text-primary bg-primary/5" : "text-foreground"}
      `}
    >
      <span className="truncate mr-2">{option.label}</span>
      {option.value === value && <Check className="w-4 h-4 flex-shrink-0" />}
    </button>
  )

  return (
    <div className={`group relative ${horizontal ? "flex items-center gap-4" : ""}`} ref={containerRef}>
      {label && (
        <div
          className={
            horizontal ? "w-1/3 flex-shrink-0" : `flex items-center justify-between ${dense ? "pb-1.5" : "pb-2"}`
          }
        >
          <p
            className={`text-foreground font-medium leading-normal ${dense ? "text-sm" : "text-sm"} ${horizontal ? "truncate" : ""}`}
          >
            {label}
          </p>
          {!horizontal && headerContent}
        </div>
      )}

      <div className={horizontal ? "w-2/3 relative" : "relative"}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
              relative w-full flex items-center justify-between rounded-lg 
              text-foreground border border-border bg-input 
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary
              transition-all px-4 text-sm font-medium
              ${isOpen ? "ring-2 ring-ring border-primary" : ""}
              ${dense ? "h-10" : "h-11"}
            `}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {icon && <span className="text-muted-foreground flex-shrink-0">{icon}</span>}
            <span className="truncate">{selectedOption?.label || value}</span>
          </div>
          <ChevronsUpDown className="text-muted-foreground w-4 h-4 flex-shrink-0 ml-2" />
        </button>

        <div
          className={`
              absolute z-50 w-full mt-2 left-0
              grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out 
              ${isOpen ? "grid-rows-[1fr] opacity-100 translate-y-0" : "grid-rows-[0fr] opacity-0 -translate-y-2 pointer-events-none"}
            `}
        >
          <div className="overflow-hidden">
            <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-y-auto py-1" style={{ maxHeight: `${maxHeight}px` }}>
                {options.map((item, index) => {
                  if ("options" in item) {
                    return (
                      <div key={item.label || index} className="mb-1 last:mb-0">
                        <div className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          {item.label}
                          <div className="h-px bg-border flex-1"></div>
                        </div>
                        {item.options.map((opt) => renderOption(opt))}
                      </div>
                    )
                  } else {
                    return renderOption(item)
                  }
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
