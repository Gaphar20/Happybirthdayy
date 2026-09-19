import {
  uploadDadPhotoToStorage,
  uploadBirthdayMusicToStorage,
  fetchDadPhotosFromStorage,
  fetchBirthdayMusicFromStorage,
  deleteDadPhotoFromStorage,
  deleteBirthdayMusicFromStorage,
  setFeaturedHeroPhoto,
} from '../services/storageService';

export * from '../services/storageService';

/**
 * Backwards compatibility helper for uploading photo
 */
export const uploadMemoryPhoto = async (
  file: File,
  folderName: string = 'dad-photos'
): Promise<string> => {
  const isHero = folderName === 'hero-portraits' || folderName === 'hero';
  const result = await uploadDadPhotoToStorage(file, { isHero });
  return result.url;
};
