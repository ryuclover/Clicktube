export const getAvatarUrl = (value) => {
  if (!value) return '/assets/default-avatar.svg';
  if (typeof value === 'string') return value;
  return value.profilePicture || value.avatar || '/assets/default-avatar.svg';
};

/**
 * P1: optimized Cloudinary thumbnails — responsive width, auto quality/format.
 * Falls back to the original URL for non-Cloudinary hosts.
 */
export const getThumbnailUrl = (url, width = 640) => {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com')) return url;
  if (url.includes('/upload/f_auto') || url.includes('w_')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
};

export const formatDateBR = (value) => {
  if (!value) return 'Agora mesmo';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Agora mesmo';
  return date.toLocaleDateString('pt-BR');
};
