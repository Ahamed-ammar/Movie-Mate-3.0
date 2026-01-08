export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const TMDB_IMAGE_BASE_URL = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500';

export const LIST_TYPES = {
  WATCHED: 'watched',
  WATCHING: 'watching',
  WISHLIST: 'wishlist',
  FAVORITES: 'favorites'
};

export const LIST_TYPE_LABELS = {
  [LIST_TYPES.WATCHED]: 'Watched',
  [LIST_TYPES.WATCHING]: 'Watching',
  [LIST_TYPES.WISHLIST]: 'Wishlist',
  [LIST_TYPES.FAVORITES]: 'Favorites'
};
