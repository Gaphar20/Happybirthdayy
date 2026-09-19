import React, { useState } from 'react';
import { Heart, Sparkles, ArrowUp, Share2, Check, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TRIBUTE_PROFILE } from '../data/tributeData';

export const Footer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const triggerConfetti = () => {
    try {
      const end = Date.now() + 1500;
      const colors = ['#c5a059', '#ffdea5', '#775a19', '#ffffff', '#e9c176'];

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch {
      // ignore if canvas blocked
    }
  };

  const handleShare = () => {
    const text = `Join us in celebrating the birthday of Alhaji Idris Abdulrazaq Oluwatoyin! Send your heartfelt wishes and view memories: ${window.location.href}`;
    if (navigator.share) {
      navigator.share({
        title: 'Happy Birthday, Dad! - Idris Abdulrazaq Oluwatoyin',
        text: text,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Join us in celebrating the birthday of Alhaji Idris Abdulrazaq Oluwatoyin on September 19! View the tribute and send your heartfelt wish here: ${window.location.href}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#1c1c19] text-[#fcf9f4] pt-16 pb-12 border-t border-[#c5a059]/30 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#c5a059]/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-5 lg:px-8 flex flex-col items-center text-center">
        {/* Confetti Trigger Action Banner */}
        <div className="mb-12">
          <button
            type="button"
            onClick={triggerConfetti}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#c5a059] to-[#775a19] text-[#261900] hover:text-white font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-[0_0_30px_rgba(197,160,89,0.5)] transition-all duration-300 transform hover:scale-105"
          >
            <Sparkles className="w-5 h-5 animate-spin" />
            <span>Release Birthday Confetti! 🎉</span>
          </button>
        </div>

        {/* Monogram Brand */}
        <div className="w-14 h-14 rounded-full bg-[#31302d] flex items-center justify-center border-2 border-[#c5a059]/50 shadow-md mb-6">
          <span className="font-serif text-2xl text-[#ffdea5] font-bold">IA</span>
        </div>

        {/* Required Footer Headings */}
        <h3 className="font-serif text-3xl sm:text-4xl text-white font-medium mb-3">
          Happy Birthday, Dad! 🎂
        </h3>

        <p className="text-[#dcdad5] text-base max-w-md mx-auto mb-2">
          Honoring a lifetime of unwavering grace, profound wisdom, and selfless fatherhood.
        </p>

        <p className="text-xs font-semibold text-[#c5a059] uppercase tracking-widest mb-8">
          Made with ❤️ for {TRIBUTE_PROFILE.name} • {TRIBUTE_PROFILE.birthday}
        </p>

        {/* Share Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors text-xs font-semibold"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Share via WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#31302d] text-white hover:bg-[#c5a059] hover:text-[#261900] transition-colors text-xs font-semibold"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share Tribute</span>
              </>
            )}
          </button>
        </div>

        {/* Divider & Back to Top */}
        <div className="w-full pt-8 border-t border-[#31302d] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7f7667]">
          <span>© {new Date().getFullYear()} The Idris Family. All rights reserved.</span>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1 text-[#c5a059] hover:text-white transition-colors"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
