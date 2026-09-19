import React, { useState, useEffect } from 'react';
import { Camera, Maximize2, MapPin, Sparkles, ImageOff, RefreshCw, FolderPlus } from 'lucide-react';
import { Memory, DadPhoto } from '../types';
import { INITIAL_MEMORIES } from '../data/tributeData';
import { LightboxModal } from './LightboxModal';
import { fetchDadPhotosFromStorage, photoToMemory } from '../services/storageService';

interface MemoriesProps {
  customMemories?: Memory[];
  onOpenAdminUpload?: () => void;
}

export const Memories: React.FC<MemoriesProps> = ({ customMemories, onOpenAdminUpload }) => {
  const [storagePhotos, setStoragePhotos] = useState<DadPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [showArchivalFallback, setShowArchivalFallback] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeMemoryIndex, setActiveMemoryIndex] = useState<number | null>(null);

  // Load photos from Firebase Storage (dad-photos/)
  const loadPhotos = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { memories, error } = await fetchDadPhotosFromStorage();
      if (error) {
        setLoadError(error);
      }
      setStoragePhotos(memories);
    } catch (err: any) {
      console.warn('Error fetching photos from Firebase Storage:', err);
      setLoadError(err?.message || 'Failed to connect to storage');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  // Determine active memories list:
  // 1. Explicit custom memories prop (if provided)
  // 2. Firebase Storage photos from dad-photos/ (if present)
  // 3. If empty and user toggled archival fallback, or if custom memories passed
  const activeStorageMemories = storagePhotos.map(photoToMemory);
  
  const memoriesList: Memory[] =
    customMemories && customMemories.length > 0
      ? customMemories
      : activeStorageMemories.length > 0
      ? activeStorageMemories
      : showArchivalFallback
      ? INITIAL_MEMORIES
      : [];

  const categories = ['All', 'Milestone', 'Counsel', 'Celebration', 'Grandpa', 'Generations', 'Serenity'];

  const filteredMemories =
    selectedCategory === 'All'
      ? memoriesList
      : memoriesList.filter((m) => m.category.toLowerCase() === selectedCategory.toLowerCase());

  const handleOpenLightbox = (indexInFiltered: number) => {
    setActiveMemoryIndex(indexInFiltered);
  };

  const handleCloseLightbox = () => {
    setActiveMemoryIndex(null);
  };

  const handleNext = () => {
    if (activeMemoryIndex !== null) {
      setActiveMemoryIndex((activeMemoryIndex + 1) % filteredMemories.length);
    }
  };

  const handlePrev = () => {
    if (activeMemoryIndex !== null) {
      setActiveMemoryIndex(
        (activeMemoryIndex - 1 + filteredMemories.length) % filteredMemories.length
      );
    }
  };

  const handleImageError = (id: string) => {
    setBrokenImages((prev) => ({ ...prev, [id]: true }));
  };

  const activeMemory =
    activeMemoryIndex !== null && filteredMemories[activeMemoryIndex]
      ? filteredMemories[activeMemoryIndex]
      : null;

  return (
    <section id="memories" className="py-20 max-w-7xl mx-auto px-5 lg:px-8">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#c5a059]/30 text-xs font-semibold text-[#775a19] uppercase tracking-widest mb-3">
          <Camera className="w-3.5 h-3.5" />
          <span>Curated Moments</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1c1c19] font-semibold tracking-tight mb-4">
          Memories With Dad 📸
        </h2>
        <p className="text-base sm:text-lg text-[#4e4639]">
          Capturing unforgettable milestones, joyful family banquets, gentle words of counsel, and timeless smiles across the years.
        </p>

        {storagePhotos.length > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f6f3ee] text-[#775a19] text-xs font-medium border border-[#c5a059]/20">
            <Sparkles className="w-3 h-3 text-[#c5a059]" />
            <span>Synced from Firebase Storage (dad-photos/)</span>
          </div>
        )}
      </div>

      {/* Category Filter Pills (Only shown when memories exist) */}
      {!isLoading && memoriesList.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setActiveMemoryIndex(null);
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-[#775a19] text-white shadow-sm'
                  : 'bg-white text-[#4e4639] hover:text-[#1c1c19] border border-[#d1c5b4]/40 hover:bg-[#f6f3ee]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* 1. Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#d1c5b4]/30 flex flex-col justify-between animate-pulse"
            >
              <div className="aspect-[4/3] bg-[#f0ede9] relative flex items-center justify-center">
                <Camera className="w-8 h-8 text-[#d1c5b4]/60 animate-bounce" />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="h-5 bg-[#f0ede9] rounded-lg w-3/4" />
                  <div className="h-3.5 bg-[#f0ede9] rounded w-full" />
                  <div className="h-3.5 bg-[#f0ede9] rounded w-2/3" />
                </div>
                <div className="pt-4 mt-4 border-t border-[#f6f3ee] flex justify-between">
                  <div className="h-3 bg-[#f0ede9] rounded w-24" />
                  <div className="h-3 bg-[#f0ede9] rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Empty Gallery State */}
      {!isLoading && memoriesList.length === 0 && (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-[#c5a059]/30 text-center max-w-xl mx-auto my-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#f6f3ee] border border-[#c5a059]/40 flex items-center justify-center text-[#775a19] mx-auto mb-4">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl font-medium text-[#1c1c19] mb-2">
            Dad’s Photo Gallery
          </h3>
          <p className="text-sm text-[#4e4639] leading-relaxed mb-6">
            No photographs have been uploaded to Firebase Storage (<code className="px-1.5 py-0.5 rounded bg-[#f6f3ee] text-[#775a19] text-xs font-mono">dad-photos/</code>) yet.
            As photos are uploaded by an administrator, they will automatically appear here with full gallery interactions.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {onOpenAdminUpload && (
              <button
                type="button"
                onClick={onOpenAdminUpload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#775a19] text-white hover:bg-[#c5a059] hover:text-[#261900] text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Upload Dad’s Photos (Admin)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowArchivalFallback(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f6f3ee] text-[#4e4639] hover:text-[#1c1c19] border border-[#d1c5b4]/40 text-xs font-semibold transition-colors"
            >
              <span>View Archival Memories Preview</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Responsive Gallery Grid */}
      {!isLoading && memoriesList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredMemories.map((memory, idx) => (
            <div
              key={memory.id}
              onClick={() => handleOpenLightbox(idx)}
              className="group cursor-pointer bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-[#d1c5b4]/30 hover:border-[#c5a059]/60 flex flex-col justify-between"
            >
              {/* Image Container with Hover Zoom & Image Error Fallback */}
              <div className="relative overflow-hidden aspect-[4/3] bg-[#f0ede9]">
                {brokenImages[memory.id] ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#f6f3ee] text-[#7f7667] text-center">
                    <ImageOff className="w-8 h-8 text-[#c5a059] mb-2" />
                    <p className="text-xs font-medium text-[#1c1c19] line-clamp-1">{memory.title}</p>
                    <p className="text-[11px] text-[#7f7667] mt-1">Image preview unavailable</p>
                  </div>
                ) : (
                  <img
                    src={memory.imageUrl}
                    alt={memory.alt || memory.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                    onError={() => handleImageError(memory.id)}
                  />
                )}

                {/* Hover Overlay Icon */}
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                  <span className="w-12 h-12 rounded-full bg-white/90 text-[#1c1c19] flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <Maximize2 className="w-5 h-5" />
                  </span>
                </div>

                {/* Category Badge */}
                <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-[#1c1c19]/70 backdrop-blur-md text-white text-[11px] font-semibold tracking-wider uppercase border border-white/20">
                  {memory.category}
                </div>
              </div>

              {/* Caption & Details */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-medium text-[#1c1c19] group-hover:text-[#775a19] transition-colors mb-2">
                    {memory.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4e4639] line-clamp-2 leading-relaxed mb-4">
                    {memory.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#f6f3ee] flex items-center justify-between text-xs text-[#7f7667]">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#775a19]" />
                    <span>{memory.location}</span>
                  </div>
                  <span className="text-[11px] font-medium text-[#775a19]">
                    {memory.badge}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <LightboxModal
        memory={activeMemory}
        onClose={handleCloseLightbox}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </section>
  );
};

