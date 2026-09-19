import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, MessageSquareHeart, AlertCircle } from 'lucide-react';
import { Wish } from '../types';
import { fetchApprovedWishes, subscribeToApprovedWishes } from '../firebase/wishes';
import { WishCard } from './WishCard';
import { WishForm } from './WishForm';

export const Wishes: React.FC = () => {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'family' | 'popular'>('all');

  const loadWishes = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchApprovedWishes();
      setWishes(data);
    } catch (err: any) {
      console.error('Error loading wishes:', err);
      setErrorMessage('Unable to load approved wishes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    // Real-time Firestore subscription for approved == true wishes
    const unsubscribe = subscribeToApprovedWishes(
      (updatedList) => {
        setWishes(updatedList);
        setIsLoading(false);
        setErrorMessage(null);
      },
      (error) => {
        console.warn('Real-time subscription notice:', error);
        loadWishes();
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleWishSubmitted = () => {
    // Re-check or refresh
    loadWishes();
  };

  const filteredWishes = wishes.filter((w) => {
    if (activeFilter === 'family') {
      const rel = (w.relationship || '').toLowerCase();
      return (
        rel.includes('son') ||
        rel.includes('daughter') ||
        rel.includes('child') ||
        rel.includes('sister') ||
        rel.includes('brother') ||
        rel.includes('grand') ||
        rel.includes('family')
      );
    }
    if (activeFilter === 'popular') {
      return (w.reactionsCount || 0) > 10;
    }
    return true;
  });

  return (
    <section id="wishes" className="py-20 bg-[#f6f3ee] border-y border-[#d1c5b4]/20 relative">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#c5a059]/30 text-xs font-semibold text-[#775a19] uppercase tracking-widest mb-3">
            <Mail className="w-3.5 h-3.5" />
            <span>Tribute Registry</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1c1c19] font-semibold tracking-tight mb-4">
            Birthday Wishes 💌
          </h2>
          <p className="text-base sm:text-lg text-[#4e4639]">
            Read the heartfelt messages, prayers, and tributes shared by family, friends, and colleagues across the world.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-medium text-emerald-800 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Connected to Firebase Firestore &bull; Real-time Guestbook</span>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form (Sticky on desktop) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <WishForm onWishSubmitted={handleWishSubmitted} />
          </div>

          {/* Right Column: Wishes Stream */}
          <div className="lg:col-span-7 space-y-6">
            {/* Filter Bar & Refresh */}
            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#d1c5b4]/30 shadow-sm">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-[#775a19] text-white'
                      : 'text-[#4e4639] hover:bg-[#f6f3ee]'
                  }`}
                >
                  All ({wishes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('family')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeFilter === 'family'
                      ? 'bg-[#775a19] text-white'
                      : 'text-[#4e4639] hover:bg-[#f6f3ee]'
                  }`}
                >
                  Family
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('popular')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeFilter === 'popular'
                      ? 'bg-[#775a19] text-white'
                      : 'text-[#4e4639] hover:bg-[#f6f3ee]'
                  }`}
                >
                  Most Loved ❤️
                </button>
              </div>

              <button
                type="button"
                onClick={loadWishes}
                title="Refresh wishes from Firestore"
                className="p-2 text-[#7f7667] hover:text-[#1c1c19] hover:bg-[#f6f3ee] rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#775a19]' : ''}`} />
              </button>
            </div>

            {/* Error State */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={loadWishes}
                  className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && wishes.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-[#d1c5b4]/30">
                <RefreshCw className="w-8 h-8 animate-spin text-[#775a19] mx-auto mb-3" />
                <p className="text-sm font-medium text-[#4e4639]">Connecting to Firestore and loading approved wishes...</p>
              </div>
            ) : filteredWishes.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-[#d1c5b4]/30">
                <MessageSquareHeart className="w-10 h-10 text-[#c5a059] mx-auto mb-3" />
                <h4 className="font-serif text-lg font-medium text-[#1c1c19] mb-1">
                  Be the first to leave a wish in this category!
                </h4>
                <p className="text-xs text-[#7f7667]">
                  Use the form on the left to send your personal tribute to Dad.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWishes.map((wish) => (
                  <WishCard key={wish.id} wish={wish} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
