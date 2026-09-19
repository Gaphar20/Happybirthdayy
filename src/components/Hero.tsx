import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, ImageOff } from 'lucide-react';
import { TRIBUTE_PROFILE } from '../data/tributeData';
import {
  fetchDadPhotosFromStorage,
  getDesignatedHeroPhotoUrl,
} from '../services/storageService';
import dadHeroPortrait from '../assets/images/dad_hero_photo_1789487611691.jpg';

interface HeroProps {
  customHeroImage?: string;
}

export const Hero: React.FC<HeroProps> = ({ customHeroImage }) => {
  // Synchronously initialize hero image on first render frame from persistent storage
  const [storageHeroUrl, setStorageHeroUrl] = useState<string | null>(() => {
    return customHeroImage || getDesignatedHeroPhotoUrl();
  });
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Listen for real-time hero updates triggered across the application
  useEffect(() => {
    const handleHeroUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.url) {
        setStorageHeroUrl(detail.url);
        setImageError(false);
      }
    };
    window.addEventListener('dad-hero-photo-updated', handleHeroUpdate);
    return () => {
      window.removeEventListener('dad-hero-photo-updated', handleHeroUpdate);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadHeroPhoto = async () => {
      try {
        const { heroPhoto } = await fetchDadPhotosFromStorage();
        if (isMounted && heroPhoto?.url) {
          setStorageHeroUrl(heroPhoto.url);
          setImageError(false);
        }
      } catch (err) {
        console.warn('Hero photo retrieval notice:', err);
      }
    };

    loadHeroPhoto();

    return () => {
      isMounted = false;
    };
  }, [customHeroImage]);

  // Priority: 1. Passed custom image > 2. Uploaded/cached Dad hero photo > 3. Fallback portraits
  const heroImage =
    customHeroImage ||
    storageHeroUrl ||
    dadHeroPortrait ||
    TRIBUTE_PROFILE.heroPortrait ||
    '/hero_portrait.jpg';

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      className="relative max-w-7xl mx-auto px-5 lg:px-8 pt-8 pb-16 flex flex-col items-center text-center"
    >
      {/* Background Ambient Golden Lightings */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[500px] bg-gradient-to-b from-[#ffdea5]/35 via-[#c5a059]/15 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-80 -left-20 w-80 h-80 bg-[#c5a059]/10 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute top-72 -right-20 w-80 h-80 bg-[#ffe088]/10 blur-3xl rounded-full pointer-events-none -z-10" />

      {/* Date Milestone Pill */}
      <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/80 backdrop-blur-md border border-[#c5a059]/30 shadow-sm mb-6">
        <span className="w-2 h-2 rounded-full bg-[#775a19] animate-pulse" />
        <span className="text-xs font-semibold text-[#775a19] tracking-widest uppercase">
          Honoring A Remarkable Milestone
        </span>
        <span className="text-xs text-[#7f7667]">•</span>
        <span className="text-xs text-[#1c1c19] font-bold">
          {TRIBUTE_PROFILE.birthday}
        </span>
      </div>

      {/* Main Typography Hierarchy */}
      <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#1c1c19] max-w-4xl tracking-tight mb-4 font-semibold leading-tight">
        Happy Birthday, <span className="text-[#775a19] italic font-normal">Dad!</span> 👑
      </h1>

      <p className="font-serif text-xl sm:text-2xl text-[#775a19] max-w-2xl font-medium mb-3">
        Celebrating {TRIBUTE_PROFILE.name}
      </p>

      <p className="text-base sm:text-lg text-[#4e4639] max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
        {TRIBUTE_PROFILE.heroIntro}
      </p>

      {/* Primary CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
        <a
          href="#wishes"
          onClick={(e) => scrollToSection(e, 'wishes')}
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#31302d] text-[#f3f0eb] hover:bg-[#775a19] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl text-xs sm:text-sm font-semibold tracking-wider uppercase group"
        >
          <span>Leave a Birthday Wish</span>
          <span className="group-hover:translate-x-1 transition-transform">💌</span>
        </a>

        <a
          href="#gift"
          onClick={(e) => scrollToSection(e, 'gift')}
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#ebe8e3] text-[#1c1c19] hover:bg-[#c5a059] hover:text-[#261900] transition-all duration-300 shadow-sm hover:shadow-md text-xs sm:text-sm font-semibold tracking-wider uppercase"
        >
          <span>Send a Gift</span>
          <span>🎁</span>
        </a>
      </div>

      {/* Hero Portrait Showcase */}
      <div className="relative w-full max-w-3xl mx-auto mt-2">
        {/* Golden Halo Background */}
        <div className="absolute inset-0 m-auto w-4/5 h-4/5 bg-[#c5a059]/30 blur-3xl rounded-3xl -z-10" />

        {/* Luxury Framed Card */}
        <div className="relative bg-white/85 backdrop-blur-xl rounded-3xl p-4 sm:p-7 shadow-[0_12px_40px_rgba(43,38,35,0.08)] border border-[#c5a059]/35">
          {/* Gilded Corner Accents */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#775a19]/50 rounded-tl-lg pointer-events-none" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#775a19]/50 rounded-tr-lg pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#775a19]/50 rounded-bl-lg pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#775a19]/50 rounded-br-lg pointer-events-none" />

          {/* Portrait Image Container */}
          <div className="relative overflow-hidden rounded-2xl aspect-[4/3] sm:aspect-[16/11] bg-[#f0ede9]">
            {isLoadingImage && (
              <div className="absolute inset-0 bg-gradient-to-r from-[#f0ede9] via-[#ffdea5]/20 to-[#f0ede9] animate-pulse z-10" />
            )}

            {imageError ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#f6f3ee] text-[#7f7667] p-6 text-center">
                <ImageOff className="w-10 h-10 text-[#c5a059] mb-2" />
                <p className="text-sm font-serif font-medium text-[#1c1c19]">
                  {TRIBUTE_PROFILE.formalTitle}
                </p>
                <p className="text-xs text-[#7f7667] mt-1">
                  Patriarch Tribute Portrait
                </p>
              </div>
            ) : (
              <img
                id="hero-portrait-image"
                src={heroImage}
                alt={TRIBUTE_PROFILE.heroPortraitAlt}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover object-top hover:scale-[1.02] transition-transform duration-700 ease-out ${
                  isLoadingImage ? 'opacity-0' : 'opacity-100'
                }`}
                loading="eager"
                onLoad={() => setIsLoadingImage(false)}
                onError={() => {
                  setImageError(true);
                  setIsLoadingImage(false);
                }}
              />
            )}

            {/* Bottom Scrim Caption */}
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#1c1c19]/90 via-[#1c1c19]/40 to-transparent flex flex-col sm:flex-row sm:items-end justify-between gap-2 text-left">
              <div>
                <span className="text-[11px] font-bold text-[#ffdea5] uppercase tracking-widest block mb-1">
                  {TRIBUTE_PROFILE.roleBadge}
                </span>
                <p className="font-serif text-xl sm:text-2xl text-white font-medium">
                  {TRIBUTE_PROFILE.formalTitle}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold self-start sm:self-auto border border-white/20">
                <ShieldCheck className="w-4 h-4 text-[#ffdea5]" />
                <span>{TRIBUTE_PROFILE.birthday}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Callouts Below Frame */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-8 max-w-2xl mx-auto">
          {TRIBUTE_PROFILE.metrics.map((m, idx) => (
            <div
              key={idx}
              className="bg-white/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-sm border border-[#c5a059]/20 text-center hover:border-[#c5a059]/40 transition-colors"
            >
              <span className="font-serif text-xl sm:text-2xl text-[#775a19] font-bold block mb-1">
                {m.title}
              </span>
              <span className="text-[11px] sm:text-xs text-[#4e4639] uppercase tracking-wider font-semibold">
                {m.subtitle}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
