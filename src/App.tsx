/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MusicPlayer } from './components/MusicPlayer';
import { AboutDad } from './components/AboutDad';
import { Memories } from './components/Memories';
import { Wishes } from './components/Wishes';
import { SendGift } from './components/SendGift';
import { FamilyNote } from './components/FamilyNote';
import { Footer } from './components/Footer';
import { AdminModal } from './components/AdminModal';
import { subscribeToAdminAuth, isLocalAdminAuthenticated } from './firebase/auth';
import { getDesignatedHeroPhotoUrl, setDesignatedHeroPhoto } from './services/storageService';

export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [customHeroImage, setCustomHeroImage] = useState<string | undefined>(
    () => getDesignatedHeroPhotoUrl() || undefined
  );
  const [dataVersion, setDataVersion] = useState(0);

  const handleDataChanged = () => {
    setDataVersion((v) => v + 1);
  };

  useEffect(() => {
    // Check initial auth state
    setIsAdminAuthenticated(isLocalAdminAuthenticated());

    // Subscribe to admin auth changes
    const unsubscribe = subscribeToAdminAuth((_, isLocalAdmin) => {
      setIsAdminAuthenticated(isLocalAdmin);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fcf9f4] text-[#1c1c19] selection:bg-[#ffdea5] selection:text-[#261900]">
      {/* Fixed Navigation Bar */}
      <Navbar
        onOpenAdmin={() => setIsAdminOpen(true)}
        isAdminAuthenticated={isAdminAuthenticated}
      />

      {/* Main Content Area */}
      <main className="flex-1 pt-20">
        {/* Section 1: Hero */}
        <Hero key={`hero-${dataVersion}`} customHeroImage={customHeroImage} />

        {/* Section 2: About Dad */}
        <AboutDad />

        {/* Section 3: Memories Gallery */}
        <Memories
          key={`memories-${dataVersion}`}
          onOpenAdminUpload={() => setIsAdminOpen(true)}
        />

        {/* Section 4: Birthday Wishes & Guestbook */}
        <Wishes key={`wishes-${dataVersion}`} />

        {/* Section 5: Send Dad a Birthday Gift (Direct OPay & PalmPay) */}
        <SendGift />

        {/* Section 6: Family Note Letter */}
        <FamilyNote />
      </main>

      {/* Section 7: Celebratory Footer with Confetti Burst */}
      <Footer />

      {/* Sticky / Floating Background Music Player (autoplays on open with universal gesture unlock) */}
      <MusicPlayer
        key={`music-${dataVersion}`}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Admin Moderation Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onUpdateHeroImage={(newUrl) => {
          setCustomHeroImage(newUrl);
          setDesignatedHeroPhoto(newUrl);
        }}
        onDataChanged={handleDataChanged}
      />
    </div>
  );
}

