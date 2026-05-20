const DEFAULT_AVATAR = '/assets/default-avatar.svg';

const getAvatarUrl = (value) => {
  if (!value) return DEFAULT_AVATAR;
  if (typeof value === 'string') return value || DEFAULT_AVATAR;
  return value.profilePicture || value.avatar || DEFAULT_AVATAR;
};

const formatDateBR = (value) => {
  if (!value) return 'Agora mesmo';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Agora mesmo';
  return date.toLocaleDateString('pt-BR');
};

module.exports = {
  DEFAULT_AVATAR,
  getAvatarUrl,
  formatDateBR
};