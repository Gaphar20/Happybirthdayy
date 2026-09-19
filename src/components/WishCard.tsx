import React, { useState } from 'react';
import { Heart, CheckCircle2, MessageSquare } from 'lucide-react';
import { Wish } from '../types';
import { updateWishReaction } from '../firebase/wishes';

interface WishCardProps {
  wish: Wish;
}

export const WishCard: React.FC<WishCardProps> = ({ wish }) => {
  const [reactions, setReactions] = useState(wish.reactionsCount || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const getInitials = (name: string): string => {
    if (!name) return 'W';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    const delta = hasLiked ? -1 : 1;
    setHasLiked(!hasLiked);
    setReactions((prev) => Math.max(0, prev + delta));

    try {
      await updateWishReaction(wish.id, delta);
    } catch (err) {
      console.warn('Reaction update error:', err);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <article
      aria-label={`Birthday wish from ${wish.name}`}
      className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-300 border border-[#d1c5b4]/30 hover:border-[#c5a059]/50 flex flex-col justify-between group"
    >
      <div>
        {/* Header: Author & Relationship */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Initials Avatar */}
            <div className="w-11 h-11 rounded-full bg-[#f6f3ee] border border-[#c5a059]/40 flex items-center justify-center text-[#775a19] font-bold text-sm shadow-inner shrink-0">
              {getInitials(wish.name)}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-serif text-base sm:text-lg font-medium text-[#1c1c19] leading-tight">
                  {wish.name}
                </h4>
                <CheckCircle2 className="w-4 h-4 text-[#775a19] shrink-0" />
              </div>
              <p className="text-[11px] text-[#7f7667]">{wish.createdAt}</p>
            </div>
          </div>

          {/* Relationship Badge */}
          {wish.relationship && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#f6f3ee] text-[11px] font-semibold text-[#775a19] border border-[#c5a059]/25 shrink-0">
              {wish.relationship}
            </span>
          )}
        </div>

        {/* Message Body */}
        <div className="relative pl-1 mb-6">
          <p className="text-sm sm:text-base text-[#4e4639] leading-relaxed italic">
            “{wish.message}”
          </p>
        </div>
      </div>

      {/* Footer: Like/Heart Reaction & Verified Status */}
      <div className="pt-4 border-t border-[#f6f3ee] flex items-center justify-between">
        <button
          type="button"
          onClick={handleLike}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            hasLiked
              ? 'bg-[#ffe088]/40 text-[#775a19]'
              : 'bg-[#f6f3ee] text-[#4e4639] hover:text-[#775a19] hover:bg-[#ebe8e3]'
          }`}
          title="Send love"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-transform ${
              hasLiked ? 'fill-current text-[#775a19] scale-110' : ''
            }`}
          />
          <span>{reactions}</span>
        </button>

        <span className="text-[11px] text-[#7f7667] flex items-center gap-1">
          <MessageSquare className="w-3 h-3 text-[#c5a059]" />
          <span>Tribute Wish</span>
        </span>
      </div>
    </article>
  );
};
