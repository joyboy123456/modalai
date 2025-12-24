import React, { useState, useRef, useEffect } from 'react';
import { History, Languages, Loader2, Wand2 } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface PromptInputProps {
    prompt: string;
    setPrompt: (value: string) => void;
    isOptimizing: boolean;
    onOptimize: () => void;
    isTranslating: boolean;
    autoTranslate: boolean;
    setAutoTranslate: (value: boolean) => void;
    t: any;
    addToPromptHistory: (text: string) => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({
    prompt,
    setPrompt,
    isOptimizing,
    onOptimize,
    isTranslating,
    autoTranslate,
    setAutoTranslate,
    t,
    addToPromptHistory
}) => {
    const [promptHistory, setPromptHistory] = useState<string[]>(() => {
        try {
            const saved = sessionStorage.getItem('prompt_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [showPromptHistory, setShowPromptHistory] = useState<boolean>(false);
    const promptHistoryRef = useRef<HTMLDivElement>(null);

    // Prompt History Persistence
    useEffect(() => {
        sessionStorage.setItem('prompt_history', JSON.stringify(promptHistory));
    }, [promptHistory]);

    // Expose a method for parent to update history, but we manage the list here locally primarily
    // Actually, parent calls addToPromptHistory from `handleGenerate`.
    // We need to sync the local state when the parent triggers an add.
    // Instead of complex syncing, let's just intercept the parent's add function or rely on the parent passing history?
    // Better: let's keep promptHistory state LOCAL here, but expose the "add" function via useImperativeHandle or 
    // simply move the state back to App if it's needed elsewhere. 
    // Given the previous design, App.tsx added to history on generate. 
    // Let's make `addToPromptHistory` a prop passed DOWN from App (which maintains the state) OR 
    // move the state here and expose a ref.
    
    // DECISION: To clean App.tsx, we move the state here. 
    // BUT App.tsx needs to call "addToPromptHistory" when generate is clicked.
    // So we will actually keep the state in this component, and use an effect to listen to changes?
    // No, simpler: App.tsx passes a "trigger" or we just export the helper. 
    
    // REVISED DECISION for cleaner code: 
    // We will Accept `addToPromptHistory` as a PROP to *update* the history list, 
    // but the LIST itself is passed down from App.tsx. 
    // Wait, the user asked to refactor App.tsx to reduce code.
    // Let's keep the history logic INSIDE this component, and use a Ref or Context? No.
    // Let's stick to Props for data flow. App.tsx holds the history state.
    
    // RE-READING: I see I put `addToPromptHistory` in the props. 
    // Let's implement the internal UI logic here.
    
    // NOTE: To make this component truly encapsulated, we should handle the "add" logic internally
    // but the trigger is the "Generate" button which is in another component.
    // So App.tsx MUST hold the `promptHistory` state to pass it to `PromptInput` (for display) 
    // and call `setPromptHistory` (on generate).
    // Let's keep `promptHistory` in App.tsx for now to avoid refactoring the Generate flow too much.

    // Close prompt history on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (promptHistoryRef.current && !promptHistoryRef.current.contains(event.target as Node)) {
                setShowPromptHistory(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // We need to consume the history from props or storage. 
    // To decouple, let's read from sessionStorage in App.tsx and pass down.
    
    return (
        <div className="group flex flex-col flex-1">
            <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                    <label htmlFor="prompt-input" className="text-white text-lg font-medium leading-normal group-focus-within:text-purple-400 transition-colors cursor-pointer">{t.prompt}</label>

                    {/* History Prompt Button */}
                    <div className="relative" ref={promptHistoryRef}>
                        <Tooltip content={t.promptHistory}>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowPromptHistory(!showPromptHistory);
                                }}
                                className={`flex items-center justify-center h-7 w-7 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10 animate-in fade-in zoom-in-0 duration-300 ${showPromptHistory ? 'text-purple-400 bg-white/10 border-white/10' : ''}`}
                                type="button"
                            >
                                <History className="w-4 h-4" />
                            </button>
                        </Tooltip>

                        {/* History Dropdown */}
                        {showPromptHistory && (
                            <div className="absolute left-0 top-full mt-2 w-72 max-h-[300px] overflow-y-auto custom-scrollbar rounded-xl bg-[#1A1625] border border-white/10 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col">
                                <div className="p-1">
                                    {/* We need to access history here. Let's assume we read from sessionStorage directly here to avoid prop drilling arrays? */}
                                    {/* Actually, let's use a prop for the list to be clean react. */}
                                    {/* For this specific refactor step, I will use a local read since the parent also reads it. */}
                                    {(() => {
                                        let historyItems: string[] = [];
                                        try {
                                             const saved = sessionStorage.getItem('prompt_history');
                                             historyItems = saved ? JSON.parse(saved) : [];
                                        } catch(e) {}
                                        
                                        if (historyItems.length === 0) {
                                            return (
                                                <div className="p-4 text-center text-white/40 text-sm italic">
                                                    {t.historyEmpty}
                                                </div>
                                            );
                                        }
                                        return historyItems.map((historyPrompt, index) => (
                                            <button
                                                key={index}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setPrompt(historyPrompt);
                                                    setShowPromptHistory(false);
                                                }}
                                                className="w-full text-left p-3 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors group border-b border-white/5 last:border-0 last:border-b-0"
                                                type="button"
                                            >
                                                <p className="line-clamp-4 text-xs leading-relaxed opacity-80 group-hover:opacity-100 break-words">{historyPrompt}</p>
                                            </button>
                                        ));
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Auto Translate Toggle */}
                    <Tooltip content={autoTranslate ? t.autoTranslate : t.autoTranslate}>
                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <Languages className="w-3.5 h-3.5 text-white/60" />
                            <button
                                onClick={() => setAutoTranslate(!autoTranslate)}
                                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/50 ${autoTranslate ? 'bg-purple-600' : 'bg-white/10'}`}
                            >
                                <span
                                    className={`${autoTranslate ? 'translate-x-3.5' : 'translate-x-0.5'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                                />
                            </button>
                        </div>
                    </Tooltip>

                    <Tooltip content={t.optimizeTitle}>
                        <button
                            onClick={onOptimize}
                            disabled={isOptimizing || !prompt.trim()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/60 bg-white/5 hover:bg-white/10 hover:text-purple-300 rounded-lg transition-all border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                            type="button"
                        >
                            {isOptimizing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Wand2 className="w-3.5 h-3.5" />
                            )}
                            {t.optimize}
                        </button>
                    </Tooltip>
                </div>
            </div>
            <textarea
                id="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isOptimizing || isTranslating}
                className="form-input flex w-full min-w-0 flex-1 resize-none rounded-lg text-white/90 focus:outline-0 focus:ring-2 focus:ring-purple-500/50 border border-white/10 bg-white/5 focus:border-purple-500 min-h-32 placeholder:text-white/30 p-4 text-base font-normal leading-normal transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={t.promptPlaceholder}
            />
        </div>
    );
};
