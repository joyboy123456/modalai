import React, { useRef, useState, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HistoryGalleryProps {
  history: GeneratedImage[];
  currentImage: GeneratedImage | null;
  onSelect: (image: GeneratedImage) => void;
  t: any;
}

export const HistoryGallery: React.FC<HistoryGalleryProps> = ({ history, currentImage, onSelect, t }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = 0;
            checkScroll();
        }
    }, 0);
    
    window.addEventListener('resize', checkScroll);
    return () => {
        window.removeEventListener('resize', checkScroll);
        clearTimeout(timer);
    };
  }, [history]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount 
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  if (history.length === 0) return null;

  return (
    <div className="relative mt-4 w-full">
      <div className="flex items-center gap-2">
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className="flex-shrink-0 flex items-center justify-center size-10 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex-1 w-full overflow-hidden relative">
            <div 
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="flex items-center gap-3 p-3 overflow-x-auto scrollbar-hide snap-x"
            >
            {history.map((img) => (
                <div
                key={img.id}
                onClick={() => onSelect(img)}
                className={`
                    relative group flex-shrink-0 h-24 w-24 rounded-lg overflow-hidden cursor-pointer transition-all snap-start select-none
                    ${currentImage?.id === img.id ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-[#0D0B14]' : 'ring-2 ring-transparent hover:ring-white/50'}
                `}
                >
                <img
                    src={img.url}
                    alt={img.prompt}
                    className={`h-full w-full object-cover transform group-hover:scale-110 transition-transform duration-500 ${img.isBlurred ? 'blur-sm' : ''}`}
                    loading="lazy"
                    onContextMenu={(e) => e.preventDefault()}
                />
                </div>
            ))}
            </div>
        </div>

        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className="flex-shrink-0 flex items-center justify-center size-10 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
