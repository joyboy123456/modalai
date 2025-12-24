import React from 'react';
import { Construction } from 'lucide-react';
import { translations, Language } from '../translations';

interface ImageEditorProps {
    lang: Language;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ lang }) => {
    const t = translations[lang];
    
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                    <Construction className="w-10 h-10 text-purple-400" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-3">
                    {t.editor_coming_soon}
                </h2>
                <p className="text-white/60">
                    {t.editor_desc}
                </p>
            </div>
        </div>
    );
};
