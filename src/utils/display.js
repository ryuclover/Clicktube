export const getAvatarUrl = (value) => {
  if (!value) return '/assets/default-avatar.svg';
  if (typeof value === 'string') return value;
  return value.profilePicture || value.avatar || '/assets/default-avatar.svg';
};

export const formatDateBR = (value) => {
  if (!value) return 'Agora mesmo';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Agora mesmo';
  return date.toLocaleDateString('pt-BR');
};
