import React, { useState, useEffect } from "react";
import { X, Save, Languages, Server } from "lucide-react";
import { Language } from "../translations";
import { getModalEndpoint, saveModalEndpoint } from "../services/modalService";

interface SettingsModalProps {
  onClose: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
  t: any;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, lang, setLang, t }) => {
  const [modalEndpoint, setModalEndpoint] = useState("");

  useEffect(() => {
    setModalEndpoint(getModalEndpoint());
  }, []);

  const handleSave = () => {
    saveModalEndpoint(modalEndpoint);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#0D0B14]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_0_50px_-12px_rgba(124,58,237,0.15)] overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <h2 className="text-lg font-bold text-white">{t.settings}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Language */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-3">
              <Languages className="w-4 h-4 text-purple-400" />
              {t.language}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLang("en")}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                  lang === "en"
                    ? "bg-purple-600/90 border-purple-500/50 text-white"
                    : "bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/[0.06]"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang("zh")}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                  lang === "zh"
                    ? "bg-purple-600/90 border-purple-500/50 text-white"
                    : "bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/[0.06]"
                }`}
              >
                中文
              </button>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Modal Endpoint */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2.5">
              <Server className="w-4 h-4 text-green-400" />
              Modal Endpoint
            </label>
            <input
              type="text"
              value={modalEndpoint}
              onChange={(e) => setModalEndpoint(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-0 focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 font-mono text-sm"
            />
            <p className="mt-2 text-xs text-white/40">
              Modal 服务端点地址，用于图片生成和放大
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-white/[0.06] bg-white/[0.02]">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all"
          >
            <Save className="w-4 h-4" />
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};
