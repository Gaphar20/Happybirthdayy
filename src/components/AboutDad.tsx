import React from 'react';
import { Heart, Compass, BookOpen, Users, Sparkles, Quote } from 'lucide-react';
import { TRIBUTE_PROFILE } from '../data/tributeData';

export const AboutDad: React.FC = () => {
  const highlights = [
    {
      icon: Heart,
      title: 'Loving Father & Anchor',
      description:
        'A continuous source of sacrificial devotion, boundless warmth, patience, and sheltering care for his children and grandchildren.',
    },
    {
      icon: Compass,
      title: 'Mentor & Moral Compass',
      description:
        'Guiding family and countless community members with steadfast moral integrity, sound principle, and quiet strength.',
    },
    {
      icon: BookOpen,
      title: 'Timeless Wisdom',
      description:
        'A repository of rich life experiences, practical insight, profound faith, and measured speech that calms every storm.',
    },
    {
      icon: Users,
      title: 'Community Pillar',
      description:
        'Widely respected for his generosity, bridging generations, settling disputes with fairness, and building lasting harmony.',
    },
  ];

  return (
    <section id="about" className="py-20 bg-[#f6f3ee] border-y border-[#d1c5b4]/20 relative">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#c5a059]/30 text-xs font-semibold text-[#775a19] uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Measure of a Great Life</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1c1c19] font-semibold tracking-tight mb-4">
            About Our Patriarch
          </h2>
          <p className="text-base sm:text-lg text-[#4e4639]">
            {TRIBUTE_PROFILE.aboutSubtitle} • {TRIBUTE_PROFILE.aboutCaption}
          </p>
        </div>

        {/* 2-Column Editorial Tribute Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Editorial Card */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-[#c5a059]/25 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#c5a059]/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <span className="text-xs font-bold text-[#775a19] uppercase tracking-widest block mb-3">
                Legacy of Honor
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-[#1c1c19] font-medium leading-snug mb-6">
                {TRIBUTE_PROFILE.aboutTitle}
              </h3>
              <p className="text-[#4e4639] leading-relaxed text-base mb-6">
                {TRIBUTE_PROFILE.aboutBio}
              </p>
              <p className="text-[#4e4639] leading-relaxed text-base">
                Whether through thoughtful counsel in his study or a celebratory dance at a family gathering, his warmth leaves an indelible mark on everyone fortunate enough to share his journey.
              </p>
            </div>

            {/* Quote pullout */}
            <div className="mt-8 pt-6 border-t border-[#f0ede9] relative">
              <Quote className="w-8 h-8 text-[#c5a059]/40 mb-2" />
              <blockquote className="font-serif italic text-base sm:text-lg text-[#1c1c19] leading-relaxed mb-3">
                {TRIBUTE_PROFILE.quote}
              </blockquote>
              <span className="text-xs font-semibold text-[#775a19] uppercase tracking-wider block">
                — Family Reflection
              </span>
            </div>
          </div>

          {/* Right Column: 4 Hallmarks Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {highlights.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#d1c5b4]/25 hover:border-[#c5a059]/50 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#f6f3ee] border border-[#c5a059]/30 flex items-center justify-center text-[#775a19] mb-5 group-hover:bg-[#775a19] group-hover:text-white transition-colors shadow-sm">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <h4 className="font-serif text-lg sm:text-xl font-medium text-[#1c1c19] mb-2.5">
                      {item.title}
                    </h4>
                    <p className="text-sm text-[#4e4639] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-3 border-t border-[#f6f3ee] flex items-center gap-2 text-xs font-medium text-[#775a19]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059]" />
                    <span>Cherished Trait</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
