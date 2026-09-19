import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  LogOut,
  Trash2,
  Upload,
  RefreshCw,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
  Camera,
  Music,
  MessageSquare,
  Sparkles,
  Star,
  Check,
  FileAudio,
  Plus,
  LogIn,
  Play,
  Volume2,
  Video,
} from 'lucide-react';
import { Wish, DadPhoto, DadMusicTrack } from '../types';
import {
  fetchAllWishesForAdmin,
  approveWish,
  hideWish,
  deleteWish,
} from '../firebase/wishes';
import { adminLogin, adminGoogleLogin, adminLogout, isLocalAdminAuthenticated } from '../firebase/auth';
import { isFirebaseConfigured } from '../firebase/config';
import {
  fetchDadPhotosFromStorage,
  uploadDadPhotoToStorage,
  deleteDadPhotoFromStorage,
  setFeaturedHeroPhoto,
  fetchBirthdayMusicFromStorage,
  uploadBirthdayMusicToStorage,
  deleteBirthdayMusicFromStorage,
  setDesignatedBirthdayMusic,
  getDesignatedBirthdayMusic,
  optimizeImage,
  OptimizedImageResult,
} from '../services/storageService';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateHeroImage?: (newUrl: string) => void;
  onDataChanged?: () => void;
}

type AdminTab = 'wishes' | 'photos' | 'music';

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onUpdateHeroImage,
  onDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('wishes');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wishes state
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [isLoadingWishes, setIsLoadingWishes] = useState(false);

  // Photos state (dad-photos/)
  const [photos, setPhotos] = useState<DadPhoto[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [preOptimizedPhoto, setPreOptimizedPhoto] = useState<OptimizedImageResult | null>(null);
  const [isPreOptimizing, setIsPreOptimizing] = useState(false);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');
  const [photoCategory, setPhotoCategory] = useState('Celebration');
  const [photoLocation, setPhotoLocation] = useState('Family Hearth');
  const [isHeroPhoto, setIsHeroPhoto] = useState(false);
  const [photoSuccessMsg, setPhotoSuccessMsg] = useState<string | null>(null);
  const [photoErrorMsg, setPhotoErrorMsg] = useState<string | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [deleteConfirmPhotoId, setDeleteConfirmPhotoId] = useState<string | null>(null);

  // Music state (birthday-music/)
  const [musicTracks, setMusicTracks] = useState<DadMusicTrack[]>([]);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicTitle, setMusicTitle] = useState('');
  const [musicSuccessMsg, setMusicSuccessMsg] = useState<string | null>(null);
  const [musicErrorMsg, setMusicErrorMsg] = useState<string | null>(null);
  const [deleteConfirmMusicId, setDeleteConfirmMusicId] = useState<string | null>(null);
  const [deleteConfirmWishId, setDeleteConfirmWishId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const authed = isLocalAdminAuthenticated();
      setIsAuthenticated(authed);
      if (authed) {
        loadAdminWishes();
        loadStoragePhotos();
        loadStorageMusic();
      }
    }
  }, [isOpen]);

  const loadAdminWishes = async () => {
    setIsLoadingWishes(true);
    try {
      const all = await fetchAllWishesForAdmin();
      setWishes(all);
    } catch (err) {
      console.error('Failed to load admin wishes:', err);
    } finally {
      setIsLoadingWishes(false);
    }
  };

  const loadStoragePhotos = async () => {
    setIsLoadingPhotos(true);
    try {
      const { memories } = await fetchDadPhotosFromStorage();
      setPhotos(memories);
    } catch (err) {
      console.error('Failed to load storage photos:', err);
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const loadStorageMusic = async () => {
    setIsLoadingMusic(true);
    try {
      const { allTracks } = await fetchBirthdayMusicFromStorage();
      setMusicTracks(allTracks);
    } catch (err) {
      console.error('Failed to load storage music:', err);
    } finally {
      setIsLoadingMusic(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const res = await adminLogin(email.trim(), password.trim());
      if (res.success) {
        setIsAuthenticated(true);
        loadAdminWishes();
        loadStoragePhotos();
        loadStorageMusic();
      } else {
        setAuthError(res.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      const res = await adminGoogleLogin();
      if (res.success) {
        setIsAuthenticated(true);
        loadAdminWishes();
        loadStoragePhotos();
        loadStorageMusic();
      } else {
        setAuthError(res.error || 'Google sign-in was canceled or failed.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
  };

  // Wishes handlers
  const handleApprove = async (wishId: string) => {
    try {
      await approveWish(wishId);
      loadAdminWishes();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      alert(`Error approving wish: ${err.message || 'Permission denied'}`);
    }
  };

  const handleHide = async (wishId: string) => {
    try {
      await hideWish(wishId);
      loadAdminWishes();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      console.warn('Error hiding wish:', err);
    }
  };

  const handleDelete = async (wishId: string) => {
    try {
      await deleteWish(wishId);
      setDeleteConfirmWishId(null);
      loadAdminWishes();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      console.warn('Error deleting wish:', err);
    }
  };

  // Photo handlers (dad-photos/)
  const processSelectedPhoto = (file: File) => {
    setPhotoErrorMsg(null);
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    if (!photoTitle) {
      setPhotoTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }

    // Pre-compress immediately in background so clicking "Upload Photo" is instant
    setIsPreOptimizing(true);
    optimizeImage(file, 1200, 0.78)
      .then((res) => {
        setPreOptimizedPhoto(res);
        setIsPreOptimizing(false);
      })
      .catch(() => {
        setIsPreOptimizing(false);
      });
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedPhoto(file);
    }
  };

  const handlePhotoDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPhoto(true);
  };

  const handlePhotoDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPhoto(false);
  };

  const handlePhotoDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPhoto(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setPhotoErrorMsg('Please select or drop an image file (PNG, JPG, WEBP).');
        return;
      }
      processSelectedPhoto(file);
    }
  };

  const handleUploadDadPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) {
      setPhotoErrorMsg('Please select a photograph to upload.');
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoSuccessMsg(null);
    setPhotoErrorMsg(null);

    try {
      const uploaded = await uploadDadPhotoToStorage(photoFile, {
        title: photoTitle,
        description: photoDescription,
        category: photoCategory,
        location: photoLocation,
        isHero: isHeroPhoto,
        preOptimized: preOptimizedPhoto || undefined,
      });

      // Instant optimistic UI update: immediately add new photo to top of list
      setPhotos((prev) => [uploaded, ...prev.filter((p) => p.id !== uploaded.id)]);

      // Only update website hero portrait if the user EXPLICITLY checked the box
      if (isHeroPhoto) {
        if (onUpdateHeroImage) {
          onUpdateHeroImage(uploaded.url);
        }
        setPhotoSuccessMsg('Photograph added and set as featured Hero portrait!');
      } else {
        setPhotoSuccessMsg('Photograph added to memories gallery successfully!');
      }

      setPhotoFile(null);
      setPhotoPreview(null);
      setPreOptimizedPhoto(null);
      setPhotoTitle('');
      setPhotoDescription('');
      setIsHeroPhoto(false);

      if (onDataChanged) onDataChanged();

      // Silent non-blocking sync in background
      loadStoragePhotos();

      setTimeout(() => setPhotoSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error uploading Dad photo:', err);
      setPhotoErrorMsg(`Upload failed: ${err.message || 'Please check the file and try again'}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeleteDadPhoto = async (fullPath: string, id: string) => {
    try {
      // Optimistically remove from state immediately
      setPhotos((prev) => prev.filter((p) => p.fullPath !== fullPath && p.id !== id));
      setDeleteConfirmPhotoId(null);
      await deleteDadPhotoFromStorage(fullPath, id);
      if (onDataChanged) onDataChanged();
      setPhotoSuccessMsg('Photo removed from gallery.');
      setTimeout(() => setPhotoSuccessMsg(null), 3000);
    } catch (err: any) {
      setPhotoErrorMsg(`Failed to delete photo: ${err.message || 'Error occurred'}`);
      loadStoragePhotos();
    }
  };

  const handleSetHeroPhoto = async (fullPath: string, id: string, url: string) => {
    try {
      // Optimistically update hero status across photos
      setPhotos((prev) =>
        prev.map((p) => ({
          ...p,
          isHero: p.id === id || p.fullPath === fullPath,
        }))
      );
      if (onUpdateHeroImage) {
        onUpdateHeroImage(url);
      }
      await setFeaturedHeroPhoto(fullPath, id, url);
      if (onDataChanged) onDataChanged();
      setPhotoSuccessMsg('Featured as Hero Portrait successfully!');
      setTimeout(() => setPhotoSuccessMsg(null), 3000);
    } catch (err: any) {
      setPhotoErrorMsg(`Failed to set hero photo: ${err.message || 'Error occurred'}`);
      loadStoragePhotos();
    }
  };

  // Music handlers (birthday-music/)
  const handleMusicFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMusicFile(file);
      setMusicErrorMsg(null);
      if (!musicTitle) {
        const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setMusicTitle(rawName);
      }
    }
  };

  const handleSetActiveMusicTrack = async (track: DadMusicTrack) => {
    try {
      await setDesignatedBirthdayMusic(track);
      setMusicTracks((prev) =>
        prev.map((t) => ({
          ...t,
          isActive: t.id === track.id || t.fullPath === track.fullPath,
        }))
      );
      setMusicSuccessMsg(`"${track.title}" is now active as Dad’s celebration soundtrack across the website!`);
      if (onDataChanged) onDataChanged();
      setTimeout(() => setMusicSuccessMsg(null), 5000);
    } catch (err: any) {
      setMusicErrorMsg(`Failed to activate soundtrack: ${err?.message || 'Error occurred'}`);
    }
  };

  const handleUploadBirthdayMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicFile) {
      setMusicErrorMsg('Please choose an audio or video file to upload.');
      return;
    }

    setIsUploadingMusic(true);
    setMusicSuccessMsg(null);
    setMusicErrorMsg(null);

    try {
      const newTrack = await uploadBirthdayMusicToStorage(musicFile, musicTitle);
      setMusicSuccessMsg(`"${newTrack.title}" uploaded and set as active celebration soundtrack!`);
      setMusicFile(null);
      setMusicTitle('');

      await loadStorageMusic();
      if (onDataChanged) onDataChanged();

      setTimeout(() => setMusicSuccessMsg(null), 6000);
    } catch (err: any) {
      console.error('Error uploading birthday music:', err);
      setMusicErrorMsg(`Music upload failed: ${err.message || 'Error occurred'}`);
    } finally {
      setIsUploadingMusic(false);
    }
  };

  const handleDeleteMusicTrack = async (fullPath: string, id: string) => {
    try {
      // Optimistically remove from state immediately
      setMusicTracks((prev) => prev.filter((t) => t.fullPath !== fullPath && t.id !== id));
      setDeleteConfirmMusicId(null);
      await deleteBirthdayMusicFromStorage(fullPath, id);
      if (onDataChanged) onDataChanged();
      setMusicSuccessMsg('Music track deleted.');
      setTimeout(() => setMusicSuccessMsg(null), 3000);
    } catch (err: any) {
      setMusicErrorMsg(`Failed to delete music: ${err.message || 'Error occurred'}`);
      loadStorageMusic();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-dialog-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="bg-[#fcf9f4] w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-[#c5a059]/40 max-h-[92vh] flex flex-col relative animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#c5a059]/20 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ffdea5]/40 border border-[#c5a059]/30 flex items-center justify-center text-[#775a19]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 id="admin-dialog-title" className="font-serif text-xl text-[#1c1c19] font-medium">
                Admin Portal & Storage Console
              </h3>
              <p className="text-xs text-[#7f7667]">
                {isFirebaseConfigured()
                  ? 'Firebase Auth, Firestore & Cloud Storage'
                  : 'Demonstration & Storage Mode'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f6f3ee] text-[#4e4639] hover:text-red-700 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#f6f3ee] text-[#4e4639] hover:text-[#1c1c19] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          {!isAuthenticated ? (
            /* Login Form */
            <div className="max-w-md mx-auto py-6">
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-full bg-[#f6f3ee] border border-[#c5a059]/30 flex items-center justify-center text-[#775a19] mx-auto mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-2xl text-[#1c1c19] font-semibold mb-2">
                  Admin Sign In
                </h4>
                <p className="text-xs text-[#4e4639] leading-relaxed">
                  Enter administrator credentials to moderate tribute wishes, manage Dad’s photographs, and upload birthday soundtrack files.
                </p>
              </div>

              {authError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 mb-6">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 mb-4 rounded-full bg-white border border-[#d1c5b4] hover:bg-[#f6f3ee] text-[#1c1c19] text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <LogIn className="w-4 h-4 text-[#775a19]" />
                <span>Sign in with Google (Admin)</span>
              </button>

              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-[#d1c5b4]/40" />
                <span className="px-3 text-[11px] text-[#7f7667] uppercase font-medium">Or use passcode</span>
                <div className="flex-1 border-t border-[#d1c5b4]/40" />
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1c1c19] uppercase tracking-wider mb-2">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@idris.family"
                    className="w-full px-4 py-3 rounded-2xl bg-[#f6f3ee] border border-[#d1c5b4]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#775a19]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1c1c19] uppercase tracking-wider mb-2">
                    Passcode / Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password (e.g. september19)"
                    className="w-full px-4 py-3 rounded-2xl bg-[#f6f3ee] border border-[#d1c5b4]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#775a19]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-full bg-[#775a19] hover:bg-[#c5a059] text-white hover:text-[#261900] transition-colors font-semibold text-xs uppercase tracking-wider shadow-md"
                  >
                    {isSubmitting ? 'Verifying...' : 'Access Admin Dashboard'}
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#f6f3ee] border border-[#d1c5b4]/30 text-[11px] text-[#7f7667] text-center">
                  <span>Demo access passcode: </span>
                  <strong className="text-[#1c1c19]">september19</strong>
                </div>
              </form>
            </div>
          ) : (
            /* Authenticated Admin Dashboard with Tabs */
            <div className="space-y-6">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-[#d1c5b4]/30 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('wishes')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'wishes'
                      ? 'bg-[#775a19] text-white shadow-sm'
                      : 'bg-white text-[#4e4639] hover:bg-[#f6f3ee]'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Wishes Moderation ({wishes.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('photos')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'photos'
                      ? 'bg-[#775a19] text-white shadow-sm'
                      : 'bg-white text-[#4e4639] hover:bg-[#f6f3ee]'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Dad’s Photos ({photos.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('music')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'music'
                      ? 'bg-[#775a19] text-white shadow-sm'
                      : 'bg-white text-[#4e4639] hover:bg-[#f6f3ee]'
                  }`}
                >
                  <Music className="w-4 h-4" />
                  <span>Birthday Music ({musicTracks.length})</span>
                </button>
              </div>

              {/* TAB 1: WISHES MODERATION */}
              {activeTab === 'wishes' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-serif text-xl text-[#1c1c19] font-medium">
                        Guestbook Wishes Moderation ({wishes.length})
                      </h4>
                      <p className="text-xs text-[#7f7667]">
                        Approve or delete messages before or after they appear publicly.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={loadAdminWishes}
                      className="p-2 text-[#7f7667] hover:text-[#1c1c19] hover:bg-[#f6f3ee] rounded-xl transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingWishes ? 'animate-spin text-[#775a19]' : ''}`} />
                    </button>
                  </div>

                  {isLoadingWishes ? (
                    <div className="p-8 text-center text-xs text-[#7f7667]">
                      Refreshing moderation queue...
                    </div>
                  ) : wishes.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-[#d1c5b4]/30 text-xs text-[#7f7667]">
                      No guestbook wishes submitted yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {wishes.map((w) => (
                        <div
                          key={w.id}
                          className="bg-white p-4 sm:p-5 rounded-2xl border border-[#d1c5b4]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-serif font-medium text-sm text-[#1c1c19]">
                                {w.name}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f6f3ee] text-[#775a19] font-semibold">
                                {w.relationship || 'Well-wisher'}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  w.approved
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {w.approved ? 'Public / Visible' : 'Hidden'}
                              </span>
                            </div>
                            <p className="text-xs text-[#4e4639] italic line-clamp-2">
                              "{w.message}"
                            </p>
                            <p className="text-[10px] text-[#7f7667] mt-1">{w.createdAt}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {w.approved ? (
                              <button
                                type="button"
                                onClick={() => handleHide(w.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 text-xs font-semibold hover:bg-amber-100 transition-colors"
                                title="Hide wish from public guestbook"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Hide</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleApprove(w.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#775a19] text-white text-xs font-semibold hover:bg-[#c5a059] transition-colors"
                                title="Make wish visible on public guestbook"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Unhide</span>
                              </button>
                            )}
                            {deleteConfirmWishId === w.id ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[11px] text-red-600 font-medium">Delete?</span>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(w.id)}
                                  className="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-semibold hover:bg-red-700 transition-colors"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmWishId(null)}
                                  className="px-2 py-1 rounded bg-[#f6f3ee] text-[#1c1c19] text-[10px] hover:bg-[#e8e4dc] transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmWishId(w.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors shrink-0"
                                title="Permanently delete wish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DAD'S PHOTOS (dad-photos/) */}
              {activeTab === 'photos' && (
                <div className="space-y-6">
                  {/* Upload New Photo Card */}
                  <div className="bg-white p-6 rounded-2xl border border-[#c5a059]/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-[#775a19]" />
                        <h4 className="font-serif text-lg text-[#1c1c19] font-medium">
                          Upload to dad-photos/ (Firebase Storage)
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-[#7f7667]">dad-photos/</span>
                    </div>

                    {photoErrorMsg && (
                      <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span className="flex-1">{photoErrorMsg}</span>
                        <button
                          type="button"
                          onClick={() => setPhotoErrorMsg(null)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold px-1"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {photoSuccessMsg && (
                      <div className="p-3 mb-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600 shrink-0" />
                        <span>{photoSuccessMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handleUploadDadPhoto} className="space-y-4">
                      {/* File Selector */}
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <label
                          onDragOver={handlePhotoDragOver}
                          onDragLeave={handlePhotoDragLeave}
                          onDrop={handlePhotoDrop}
                          className={`w-full sm:w-auto flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-center ${
                            isDraggingPhoto
                              ? 'border-[#775a19] bg-[#f7efe3] ring-2 ring-[#775a19]/30'
                              : 'border-[#c5a059]/40 hover:border-[#775a19] bg-[#fcf9f4]'
                          }`}
                        >
                          {photoPreview ? (
                            <div className="relative mb-2">
                              <img
                                src={photoPreview}
                                alt="Upload preview"
                                className="w-36 h-28 object-cover rounded-xl border border-[#c5a059]/40 shadow-sm"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setPhotoFile(null);
                                  setPhotoPreview(null);
                                }}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs shadow hover:bg-red-700"
                                title="Remove selected photo"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <Upload className="w-8 h-8 text-[#775a19] mb-2" />
                          )}
                          <span className="text-xs font-semibold text-[#1c1c19]">
                            {photoFile ? photoFile.name : (isDraggingPhoto ? 'Drop photo here now' : 'Select or drag & drop Dad’s photograph')}
                          </span>
                          <span className="text-[11px] text-[#7f7667] mt-1 flex items-center gap-1.5">
                            {isPreOptimizing ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin text-[#775a19]" />
                                <span>Pre-optimizing image in background...</span>
                              </>
                            ) : preOptimizedPhoto ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700 font-medium">Ready for instant upload ({(preOptimizedPhoto.size / 1024).toFixed(0)} KB)</span>
                              </>
                            ) : (
                              <span>PNG, JPG, WEBP • Fast client-side optimization</span>
                            )}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Photo Metadata Form */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#1c1c19] mb-1">
                            Photo Title
                          </label>
                          <input
                            type="text"
                            value={photoTitle}
                            onChange={(e) => setPhotoTitle(e.target.value)}
                            placeholder="e.g. Dad at Milestone Celebration"
                            className="w-full px-3 py-2 rounded-xl bg-[#f6f3ee] border border-[#d1c5b4]/40 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#1c1c19] mb-1">
                            Category
                          </label>
                          <select
                            value={photoCategory}
                            onChange={(e) => setPhotoCategory(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-[#f6f3ee] border border-[#d1c5b4]/40 text-xs"
                          >
                            <option value="Celebration">Celebration</option>
                            <option value="Milestone">Milestone</option>
                            <option value="Counsel">Counsel</option>
                            <option value="Grandpa">Grandpa</option>
                            <option value="Generations">Generations</option>
                            <option value="Serenity">Serenity</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1c1c19] mb-1">
                          Caption / Story
                        </label>
                        <textarea
                          rows={2}
                          value={photoDescription}
                          onChange={(e) => setPhotoDescription(e.target.value)}
                          placeholder="A brief memory or caption for this photograph..."
                          className="w-full px-3 py-2 rounded-xl bg-[#f6f3ee] border border-[#d1c5b4]/40 text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-start gap-2.5 cursor-pointer max-w-sm">
                          <input
                            type="checkbox"
                            checked={isHeroPhoto}
                            onChange={(e) => setIsHeroPhoto(e.target.checked)}
                            className="mt-0.5 rounded text-[#775a19] focus:ring-[#775a19]"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-[#1c1c19]">
                              Set as Featured Hero Portrait
                            </span>
                            <span className="text-[10px] text-[#7f7667]">
                              Leave unchecked to add to gallery without changing the current Hero image
                            </span>
                          </div>
                        </label>

                        <button
                          type="submit"
                          disabled={!photoFile || isUploadingPhoto}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#775a19] hover:bg-[#c5a059] hover:text-[#261900] text-white text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          {isUploadingPhoto ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Saving Photo...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Photo</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* List of Photos in dad-photos/ */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-serif text-lg text-[#1c1c19] font-medium">
                        Photos in Storage ({photos.length})
                      </h4>
                      <button
                        type="button"
                        onClick={loadStoragePhotos}
                        className="p-1.5 text-[#7f7667] hover:text-[#1c1c19] hover:bg-[#f6f3ee] rounded-xl transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingPhotos ? 'animate-spin text-[#775a19]' : ''}`} />
                      </button>
                    </div>

                    {isLoadingPhotos ? (
                      <div className="p-8 text-center text-xs text-[#7f7667]">
                        Loading photos from dad-photos/...
                      </div>
                    ) : photos.length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-2xl border border-[#d1c5b4]/30 text-xs text-[#7f7667]">
                        No photos found in dad-photos/. Upload the first photograph above!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {photos.map((p) => (
                          <div
                            key={p.id}
                            className="bg-white p-3 rounded-2xl border border-[#d1c5b4]/30 flex flex-col justify-between"
                          >
                            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#f0ede9] mb-3">
                              <img
                                src={p.url}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                              {p.isHero && (
                                <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#775a19] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                                  <Star className="w-3 h-3 fill-current" />
                                  <span>Hero Featured</span>
                                </span>
                              )}
                            </div>

                            <div className="mb-3">
                              <h5 className="font-medium text-xs text-[#1c1c19] truncate">{p.title}</h5>
                              <p className="text-[11px] text-[#7f7667] truncate">{p.category} • {p.location}</p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#f6f3ee]">
                              {!p.isHero && (
                                <button
                                  type="button"
                                  onClick={() => handleSetHeroPhoto(p.fullPath, p.id, p.url)}
                                  className="text-[11px] font-semibold text-[#775a19] hover:underline flex items-center gap-1"
                                >
                                  <Star className="w-3 h-3" />
                                  <span>Set as Hero</span>
                                </button>
                              )}
                              {deleteConfirmPhotoId === p.id ? (
                                <div className="flex items-center gap-1.5 ml-auto">
                                  <span className="text-[10px] text-red-600 font-medium">Delete?</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDadPhoto(p.fullPath, p.id)}
                                    className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-semibold hover:bg-red-700 transition-colors"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmPhotoId(null)}
                                    className="px-2 py-0.5 rounded bg-[#f6f3ee] text-[#1c1c19] text-[10px] hover:bg-[#e8e4dc] transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmPhotoId(p.id)}
                                  className="text-[11px] font-semibold text-red-600 hover:text-red-800 ml-auto flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: BIRTHDAY MUSIC (birthday-music/) */}
              {activeTab === 'music' && (
                <div className="space-y-6">
                  {/* Current Active Soundtrack Showcase */}
                  {(() => {
                    const activeTrack =
                      musicTracks.find((t) => t.isActive) ||
                      getDesignatedBirthdayMusic() ||
                      musicTracks[0];

                    return (
                      <div className="p-5 rounded-2xl bg-[#ffdea5]/25 border border-[#c5a059]/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-[#775a19] text-white flex items-center justify-center shrink-0 shadow-sm">
                            {activeTrack?.isVideo ? (
                              <Video className="w-6 h-6 text-[#ffdea5]" />
                            ) : (
                              <Sparkles className="w-6 h-6 text-[#ffdea5]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#775a19] bg-[#ffdea5]/80 border border-[#c5a059]/60 px-2.5 py-0.5 rounded-full">
                                <Star className="w-2.5 h-2.5 fill-[#775a19]" />
                                Active Website Soundtrack
                              </span>
                            </div>
                            <h4 className="font-serif font-medium text-sm text-[#1c1c19] truncate">
                              {activeTrack ? activeTrack.title : 'Default: Yusuf Islam — Mother (Father & Son)'}
                            </h4>
                            <p className="text-[11px] text-[#7f7667] truncate">
                              {activeTrack
                                ? activeTrack.subtitle || 'Celebration of Grace & Life'
                                : 'Plays automatically for all visitors via the floating music player'}
                            </p>
                          </div>
                        </div>

                        {activeTrack && activeTrack.url && (
                          <div className="flex items-center gap-2 shrink-0">
                            <audio controls src={activeTrack.url} className="h-8 max-w-[220px]" />
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Upload Music Card */}
                  <div className="bg-white p-6 rounded-2xl border border-[#c5a059]/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Music className="w-5 h-5 text-[#775a19]" />
                        <h4 className="font-serif text-lg text-[#1c1c19] font-medium">
                          Upload Dad’s Audio / Video Celebration
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-[#7f7667] bg-[#f6f3ee] px-2 py-0.5 rounded-lg border border-[#d1c5b4]/40">
                        birthday-music/
                      </span>
                    </div>

                    <p className="text-xs text-[#7f7667] mb-4 leading-relaxed">
                      Upload your audio or video file (such as your <em>Alhamdulillah</em> video or tribute prayer).
                      The uploaded audio is instantly set as Dad’s active celebration soundtrack across the website.
                    </p>

                    {musicErrorMsg && (
                      <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span className="flex-1">{musicErrorMsg}</span>
                        <button
                          type="button"
                          onClick={() => setMusicErrorMsg(null)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold px-1"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {musicSuccessMsg && (
                      <div className="p-3 mb-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="flex-1">{musicSuccessMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handleUploadBirthdayMusic} className="space-y-4">
                      <div>
                        <label className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#c5a059]/40 hover:border-[#775a19] rounded-2xl bg-[#fcf9f4] cursor-pointer transition-colors text-center">
                          <FileAudio className="w-8 h-8 text-[#775a19] mb-2" />
                          <span className="text-xs font-semibold text-[#1c1c19]">
                            {musicFile ? musicFile.name : 'Select or drop Dad’s Birthday Audio or Video (.mp3, .mp4, .m4a, .wav)'}
                          </span>
                          <span className="text-[11px] text-[#7f7667] mt-1">
                            Audio & video celebration files up to 50MB (e.g., your Alhamdulillah celebration track)
                          </span>
                          <input
                            type="file"
                            accept="audio/*,video/mp4,video/*,.mp3,.wav,.m4a,.aac,.ogg,.mp4,.mov,.webm"
                            onChange={handleMusicFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1c1c19] mb-1">
                          Song / Track Title
                        </label>
                        <input
                          type="text"
                          value={musicTitle}
                          onChange={(e) => setMusicTitle(e.target.value)}
                          placeholder="e.g. Alhamdulillah — 68th Birthday Celebration Prayer"
                          className="w-full px-3 py-2 rounded-xl bg-[#f6f3ee] border border-[#d1c5b4]/40 text-xs"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={!musicFile || isUploadingMusic}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#775a19] hover:bg-[#c5a059] hover:text-[#261900] text-white text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingMusic ? 'Uploading & Activating...' : 'Upload & Set as Active Music'}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Tracks List */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-serif text-lg text-[#1c1c19] font-medium">
                        Soundtracks in Library ({musicTracks.length})
                      </h4>
                      <button
                        type="button"
                        onClick={loadStorageMusic}
                        className="p-1.5 text-[#7f7667] hover:text-[#1c1c19] hover:bg-[#f6f3ee] rounded-xl transition-colors"
                        title="Refresh tracks list"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingMusic ? 'animate-spin text-[#775a19]' : ''}`} />
                      </button>
                    </div>

                    {isLoadingMusic ? (
                      <div className="p-8 text-center text-xs text-[#7f7667]">
                        Loading celebration soundtracks...
                      </div>
                    ) : musicTracks.length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-2xl border border-[#d1c5b4]/30 text-xs text-[#7f7667]">
                        No tracks in birthday-music/ yet. Upload Dad’s audio or video celebration above!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {musicTracks.map((t) => (
                          <div
                            key={t.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                              t.isActive
                                ? 'bg-[#fffbf2] border-[#c5a059] shadow-sm'
                                : 'bg-white border-[#d1c5b4]/30 hover:border-[#c5a059]/40'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  t.isActive
                                    ? 'bg-[#775a19] text-[#ffdea5]'
                                    : 'bg-[#f6f3ee] text-[#775a19]'
                                }`}
                              >
                                {t.isVideo ? (
                                  <Video className="w-5 h-5" />
                                ) : (
                                  <Music className="w-5 h-5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-xs text-[#1c1c19] truncate">{t.title}</p>
                                  {t.isActive && (
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#ffdea5] text-[#775a19] text-[9px] font-bold uppercase tracking-wider shrink-0">
                                      <Star className="w-2.5 h-2.5 fill-[#775a19]" />
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#7f7667] truncate">
                                  {t.name} {t.size ? `• ${(t.size / (1024 * 1024)).toFixed(1)} MB` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 justify-end">
                              {t.url ? (
                                <audio controls src={t.url} className="h-8 max-w-[200px]" />
                              ) : null}

                              {!t.isActive && (
                                <button
                                  type="button"
                                  onClick={() => handleSetActiveMusicTrack(t)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f6f3ee] hover:bg-[#775a19] text-[#1c1c19] hover:text-white text-xs font-semibold border border-[#d1c5b4]/40 transition-colors shrink-0"
                                >
                                  <Star className="w-3.5 h-3.5 text-[#c5a059]" />
                                  <span>Set as Active</span>
                                </button>
                              )}

                              {deleteConfirmMusicId === t.id ? (
                                <div className="flex items-center gap-1.5 shrink-0 bg-red-50 p-1 rounded-xl border border-red-200">
                                  <span className="text-[10px] text-red-700 font-medium px-1">Delete?</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMusicTrack(t.fullPath, t.id)}
                                    className="px-2 py-0.5 rounded-lg bg-red-600 text-white text-[10px] font-semibold hover:bg-red-700 transition-colors"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmMusicId(null)}
                                    className="px-2 py-0.5 rounded-lg bg-white text-[#1c1c19] text-[10px] hover:bg-[#f6f3ee] transition-colors border border-gray-200"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmMusicId(t.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
