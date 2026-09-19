import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  Disc,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  Upload,
  RotateCcw,
} from 'lucide-react';
import {
  fetchBirthdayMusicFromStorage,
  uploadBirthdayMusicToStorage,
  getDesignatedBirthdayMusic,
} from '../services/storageService';
import { DadMusicTrack } from '../types';

interface MusicPlayerProps {
  customAudioUrl?: string;
  songTitle?: string;
  onOpenAdmin?: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  customAudioUrl,
  songTitle,
  onOpenAdmin,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Autoplay & gesture unlock state
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [userManuallyPaused, setUserManuallyPaused] = useState(false);

  // Initialize synchronously with locally cached designated track for zero-delay playback
  const [storageTrack, setStorageTrack] = useState<DadMusicTrack | null>(() =>
    getDesignatedBirthdayMusic()
  );
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isQuickUploading, setIsQuickUploading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Fetch user's uploaded track from Firestore 'music' / IndexedDB / LocalStorage
  const reloadTrack = async () => {
    setIsLoadingTrack(true);
    try {
      const { track } = await fetchBirthdayMusicFromStorage();
      if (track) {
        setStorageTrack(track);
        setPlaybackError(null);
      }
    } catch (err: any) {
      console.warn('Birthday music retrieval notice:', err?.message || String(err));
    } finally {
      setIsLoadingTrack(false);
    }
  };

  useEffect(() => {
    reloadTrack();
  }, [customAudioUrl]);

  // Listen to cross-component music update events (e.g. from Admin Portal)
  useEffect(() => {
    const handleMusicUpdated = (e: Event) => {
      const customEvt = e as CustomEvent<{ track?: DadMusicTrack | null }>;
      if (customEvt.detail?.track) {
        const newTrack = customEvt.detail.track;
        setStorageTrack(newTrack);
        setUserManuallyPaused(false);
        setPlaybackError(null);
        if (audioRef.current) {
          audioRef.current.src = newTrack.url;
          audioRef.current.load();
          audioRef.current
            .play()
            .then(() => {
              setIsPlaying(true);
              setAutoplayBlocked(false);
            })
            .catch(() => {
              setAutoplayBlocked(true);
            });
        }
      } else {
        reloadTrack();
      }
    };

    const handlePlayRequest = () => {
      setUserManuallyPaused(false);
      if (audioRef.current) {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setAutoplayBlocked(false);
          })
          .catch(() => {});
      }
    };

    const handleToggleRequest = () => {
      togglePlay();
    };

    window.addEventListener('dad-birthday-music-updated', handleMusicUpdated);
    window.addEventListener('dad-birthday-music-play', handlePlayRequest);
    window.addEventListener('dad-birthday-music-toggle', handleToggleRequest);

    return () => {
      window.removeEventListener('dad-birthday-music-updated', handleMusicUpdated);
      window.removeEventListener('dad-birthday-music-play', handlePlayRequest);
      window.removeEventListener('dad-birthday-music-toggle', handleToggleRequest);
    };
  }, []);

  // Priority: customAudioUrl prop > user uploaded track from Firestore/IndexedDB
  const activeTrackUrl = customAudioUrl || storageTrack?.url || '';

  const activeTitle =
    customAudioUrl
      ? songTitle || 'Dad’s Birthday Soundtrack'
      : storageTrack?.title || songTitle || 'Dad’s Birthday Soundtrack';

  const activeSubtitle =
    storageTrack?.subtitle || 'Celebration of Grace & Life • 60th Diamond Jubilee';

  // Format seconds to mm:ss
  const formatTime = (secs: number): string => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const min = Math.floor(secs / 60);
    const sec = Math.floor(secs % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // 2. Manage Audio Element source & Autoplay on Site Open
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeTrackUrl) return;

    audio.volume = isMuted ? 0 : volume;
    audio.loop = true;

    // Update src if changed
    if (audio.src !== activeTrackUrl) {
      audio.src = activeTrackUrl;
      audio.load();
    }

    // Direct autoplay attempt for the user's authentic uploaded track
    const attemptAutoplay = async () => {
      if (userManuallyPaused) return;
      try {
        await audio.play();
        setIsPlaying(true);
        setAutoplayBlocked(false);
      } catch {
        // Browser Autoplay Policy required a user gesture first
        setAutoplayBlocked(true);
      }
    };

    attemptAutoplay();

    // Universal gesture unlock: first click, tap, scroll or key starts the audio
    const handleFirstGesture = () => {
      if (userManuallyPaused) return;
      if (audioRef.current && audioRef.current.paused && activeTrackUrl) {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setAutoplayBlocked(false);
          })
          .catch(() => {
            // Autoplay restriction still in effect
          });
      }
    };

    const gestures = ['click', 'touchstart', 'touchend', 'scroll', 'keydown'];
    gestures.forEach((evt) => {
      window.addEventListener(evt, handleFirstGesture, { once: true, passive: true });
    });

    return () => {
      gestures.forEach((evt) => {
        window.removeEventListener(evt, handleFirstGesture);
      });
    };
  }, [activeTrackUrl, userManuallyPaused]);

  // Toggle Play / Pause
  const togglePlay = () => {
    setPlaybackError(null);

    if (!activeTrackUrl) {
      if (onOpenAdmin) {
        onOpenAdmin();
      } else if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      setUserManuallyPaused(true);
    } else {
      setUserManuallyPaused(false);
      if (audioRef.current) {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setAutoplayBlocked(false);
          })
          .catch(() => {
            setPlaybackError('Could not play audio track. Please check file format.');
          });
      }
    }
  };

  // Immediate 1-tap unlock from banner
  const handleBannerUnlock = () => {
    setUserManuallyPaused(false);
    if (audioRef.current && activeTrackUrl) {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch(() => {
          // Playback blocked
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
      setDuration(audioRef.current.duration);
      setPlaybackError(null);
    }
  };

  // Safely handle audio error without logging synthetic events or DOM elements that contain circular FiberNodes
  const handleAudioError = () => {
    if (activeTrackUrl) {
      setPlaybackError('Audio could not be decoded. Tap to re-select your file.');
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetSec = parseFloat(e.target.value);
    setCurrentTime(targetSec);
    if (audioRef.current) {
      audioRef.current.currentTime = targetSec;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const nextMuted = !isMuted;
      setIsMuted(nextMuted);
      audioRef.current.muted = nextMuted;
    }
  };

  // Quick direct file selector for uploaded audio
  const handleDirectFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsQuickUploading(true);
    setPlaybackError(null);
    try {
      const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const newTrack = await uploadBirthdayMusicToStorage(file, title);
      setStorageTrack(newTrack);
      setUserManuallyPaused(false);
      if (audioRef.current) {
        audioRef.current.src = newTrack.url;
        audioRef.current.load();
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        }).catch(() => {});
      }
    } catch (err: any) {
      console.warn('Quick audio upload notice:', err?.message || String(err));
      // Even if unauthenticated, read as local blob URL for immediate playback
      try {
        const localBlobUrl = URL.createObjectURL(file);
        const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const directTrack: DadMusicTrack = {
          id: `local_track_${Date.now()}`,
          name: file.name,
          fullPath: `local/${file.name}`,
          url: localBlobUrl,
          title,
          subtitle: 'Dad’s Birthday Soundtrack',
          timeCreated: new Date().toISOString(),
          size: file.size,
        };
        setStorageTrack(directTrack);
        setUserManuallyPaused(false);
        if (audioRef.current) {
          audioRef.current.src = localBlobUrl;
          audioRef.current.load();
          audioRef.current.play().then(() => {
            setIsPlaying(true);
            setAutoplayBlocked(false);
          }).catch(() => {});
        }
      } catch (inner) {
        setPlaybackError('Failed to load audio file. Please retry.');
      }
    } finally {
      setIsQuickUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <aside aria-label="Tribute music player" className="fixed bottom-5 right-5 z-40">
      {/* Hidden audio element - loops continuously */}
      {activeTrackUrl ? (
        <audio
          ref={audioRef}
          src={activeTrackUrl}
          preload="auto"
          loop={true}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleAudioError}
          onEnded={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
            }
          }}
        />
      ) : null}

      {/* Hidden direct file input for instant file selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/mp4,video/*,.mp3,.m4a,.wav,.aac,.ogg,.mp4,.mov,.webm"
        onChange={handleDirectFileSelect}
        className="hidden"
      />

      {/* Autoplay Invitation Toast (Shows if browser blocked initial autoplay until first interaction) */}
      {autoplayBlocked && !isPlaying && !userManuallyPaused && activeTrackUrl && (
        <div
          onClick={handleBannerUnlock}
          className="mb-2.5 px-3.5 py-2.5 bg-gradient-to-r from-[#775a19] via-[#c5a059] to-[#775a19] text-white rounded-2xl shadow-xl flex items-center justify-between gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-medium border border-amber-300/40 animate-pulse"
          role="button"
          tabIndex={0}
          aria-label="Click to start Dad's birthday music"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-200 shrink-0" />
            <span className="font-semibold text-[11px] sm:text-xs">
              Tap anywhere or click here to play Dad’s Soundtrack 🎵
            </span>
          </div>
          <Volume2 className="w-4 h-4 shrink-0 text-amber-100" />
        </div>
      )}

      {/* Floating Player Widget Container */}
      <div className="bg-[#fcf9f4]/95 backdrop-blur-xl border border-[#c5a059]/40 rounded-2xl shadow-[0_8px_30px_rgba(43,38,35,0.15)] overflow-hidden transition-all duration-300 w-80 sm:w-96">
        {/* Main Bar */}
        <div className="p-3.5 flex items-center justify-between gap-3">
          {/* Spinning Vinyl Record Visual */}
          <div className="relative flex items-center justify-center shrink-0">
            <div
              className={`w-12 h-12 rounded-full bg-[#1c1c19] border-2 border-[#ffdea5]/50 flex items-center justify-center shadow-md transition-transform ${
                isPlaying ? 'animate-spin-slow' : ''
              }`}
            >
              <Disc className="w-8 h-8 text-[#c5a059]" />
              <div className="absolute w-3.5 h-3.5 rounded-full bg-[#ffdea5] border border-[#775a19]" />
            </div>
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c5a059] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#775a19]"></span>
              </span>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-[#775a19] shrink-0" />
              <p className="text-xs font-bold text-[#1c1c19] truncate">
                {activeTrackUrl ? activeTitle : 'No audio file uploaded yet'}
              </p>
              {/* Equalizer Visualizer Bars */}
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-3 shrink-0 ml-1">
                  <span className="w-0.5 bg-[#775a19] rounded-full animate-music-bar-1 h-3"></span>
                  <span className="w-0.5 bg-[#775a19] rounded-full animate-music-bar-2 h-2"></span>
                  <span className="w-0.5 bg-[#775a19] rounded-full animate-music-bar-3 h-3.5"></span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#7f7667] truncate">
              {activeTrackUrl ? (
                <>
                  <span className="inline-flex items-center gap-0.5 text-[#775a19] font-medium">
                    <Sparkles className="w-2.5 h-2.5 text-[#c5a059]" />
                    <span>Uploaded Track</span>
                    <span>•</span>
                  </span>
                  <span className="truncate">{activeSubtitle}</span>
                </>
              ) : (
                <span className="text-amber-800 font-medium">
                  Tap upload below to select your audio file
                </span>
              )}
            </div>
          </div>

          {/* Play/Pause Button */}
          {activeTrackUrl ? (
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause music' : 'Play tribute music'}
              className="w-10 h-10 rounded-full bg-[#775a19] text-white flex items-center justify-center hover:bg-[#c5a059] hover:text-[#261900] transition-colors shadow-sm shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              title="Select audio file"
              disabled={isQuickUploading}
              className="px-3 py-1.5 rounded-full bg-[#775a19] text-white text-xs font-semibold hover:bg-[#c5a059] hover:text-[#261900] transition-colors shadow-sm shrink-0 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isQuickUploading ? 'Loading...' : 'Upload'}</span>
            </button>
          )}

          {/* Expand Details Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse player controls' : 'Expand player controls'}
            className="p-1.5 rounded-lg text-[#7f7667] hover:text-[#1c1c19] hover:bg-[#f0ede9] transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Expandable Controls: Progress Bar, Volume, File Management */}
        {isExpanded && (
          <div className="px-4 pb-3.5 pt-1 border-t border-[#c5a059]/15 flex flex-col gap-2.5">
            {playbackError && (
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[10px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{playbackError}</span>
              </div>
            )}

            {/* Progress Slider (when track is active) */}
            {activeTrackUrl && (
              <div>
                <div className="flex justify-between text-[10px] font-semibold text-[#7f7667] mb-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-[#ebe8e3] rounded-lg appearance-none cursor-pointer accent-[#775a19]"
                  aria-label="Seek track"
                />
              </div>
            )}

            {/* Volume Control and Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="text-[#7f7667] hover:text-[#1c1c19] transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-[#775a19]" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#775a19]" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 sm:w-24 h-1.5 bg-[#ebe8e3] rounded-lg appearance-none cursor-pointer accent-[#775a19]"
                  aria-label="Volume slider"
                />
                <span className="text-[10px] text-[#7f7667] font-medium">
                  {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
                </span>
              </div>

              {/* Action Buttons: Choose / Replace Audio File */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) fileInputRef.current.click();
                  }}
                  disabled={isQuickUploading}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-[#f4eee3] hover:bg-[#ebdcc4] text-[#775a19] rounded-lg transition-colors flex items-center gap-1"
                  title="Choose or replace audio file"
                >
                  <Upload className="w-3 h-3" />
                  <span>{activeTrackUrl ? 'Change Track' : 'Choose File'}</span>
                </button>

                {onOpenAdmin && (
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="px-2 py-1 text-[11px] font-medium text-[#7f7667] hover:text-[#1c1c19] rounded-lg hover:bg-[#f0ede9] transition-colors"
                    title="Open Admin Portal"
                  >
                    Admin
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
