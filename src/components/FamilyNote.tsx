import React from 'react';
import { Heart, Sparkles, Feather } from 'lucide-react';
import { TRIBUTE_PROFILE } from '../data/tributeData';

export const FamilyNote: React.FC = () => {
  const { familyNote } = TRIBUTE_PROFILE;

  return (
    <section id="tribute" className="py-20 bg-[#f6f3ee] border-y border-[#d1c5b4]/20 relative">
      <div className="max-w-4xl mx-auto px-5 lg:px-8">
        {/* Parchment Tribute Letter Container */}
        <div className="bg-[#fcf9f4] rounded-3xl p-8 sm:p-14 shadow-md border-2 border-[#c5a059]/30 relative overflow-hidden">
          {/* Subtle Watermark or Decorative Corners */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[#775a19]/40 pointer-events-none" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-[#775a19]/40 pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-[#775a19]/40 pointer-events-none" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[#775a19]/40 pointer-events-none" />

          {/* Letter Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#f6f3ee] border border-[#c5a059]/40 text-[#775a19] shadow-inner mb-4">
              <Heart className="w-6 h-6 fill-current" />
            </div>

            <span className="text-xs font-bold text-[#775a19] uppercase tracking-widest block mb-2">
              {familyNote.subtitle}
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1c1c19] font-medium tracking-tight">
              {familyNote.title}
            </h2>

            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#c5a059] to-transparent mx-auto mt-6" />
          </div>

          {/* Letter Body Paragraphs */}
          <div className="space-y-6 text-[#4e4639] text-base sm:text-lg leading-relaxed font-normal">
            {familyNote.paragraphs.map((p, idx) => (
              <p key={idx} className="first-letter:text-3xl first-letter:font-serif first-letter:text-[#775a19] first-letter:font-bold first-letter:mr-1">
                {p}
              </p>
            ))}
          </div>

          {/* Letter Signature */}
          <div className="mt-12 pt-8 border-t border-[#c5a059]/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="font-serif text-2xl text-[#1c1c19] font-semibold italic">
                {familyNote.signature}
              </p>
              <p className="text-xs sm:text-sm text-[#775a19] font-medium mt-1">
                {familyNote.signatureSub}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#c5a059]/30 text-xs text-[#7f7667] font-semibold">
              <Feather className="w-3.5 h-3.5 text-[#775a19]" />
              <span>{familyNote.date}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
