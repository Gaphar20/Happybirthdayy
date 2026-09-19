import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Tag } from 'lucide-react';
import { Memory } from '../types';

interface LightboxModalProps {
  memory: Memory | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  memory,
  onClose,
  onNext,
  onPrev,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!memory) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [memory, onClose, onNext, onPrev]);

  if (!memory) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={memory.title}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 bg-[#fcf9f4] max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl border border-[#c5a059]/40 flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close memory modal"
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black transition-colors flex items-center justify-center shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Previous & Next Navigation Buttons */}
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous photograph"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[#1c1c19] flex items-center justify-center shadow-md transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next photograph"
          className="absolute right-3 md:right-[calc(40%+12px)] top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[#1c1c19] flex items-center justify-center shadow-md transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Large Image View */}
        <div className="md:w-3/5 bg-black flex items-center justify-center relative overflow-hidden min-h-[300px] md:min-h-[480px]">
          <img
            src={memory.imageUrl}
            alt={memory.alt || memory.title}
            className="w-full h-full object-contain max-h-[75vh]"
          />
        </div>

        {/* Memory Details Sidebar */}
        <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto bg-[#fcf9f4]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#f6f3ee] border border-[#c5a059]/30 text-xs font-semibold text-[#775a19]">
                <Tag className="w-3 h-3" />
                <span>{memory.category}</span>
              </span>
              {memory.location && (
                <span className="inline-flex items-center gap-1 text-xs text-[#7f7667]">
                  <MapPin className="w-3 h-3 text-[#775a19]" />
                  <span>{memory.location}</span>
                </span>
              )}
            </div>

            <h3 className="font-serif text-2xl text-[#1c1c19] font-medium leading-snug mb-4">
              {memory.title}
            </h3>

            <p className="text-sm sm:text-base text-[#4e4639] leading-relaxed mb-6">
              {memory.description}
            </p>
          </div>

          <div className="pt-4 border-t border-[#ebe8e3] text-xs text-[#7f7667] flex items-center justify-between">
            <span className="font-semibold text-[#775a19]">{memory.badge}</span>
            <span>September 19 Collection</span>
          </div>
        </div>
      </div>
    </div>
  );
};
