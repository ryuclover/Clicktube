export const formatViews = (views) => {
  if (!views) return '0 views';
  const num = parseInt(views);
  if (isNaN(num)) return views;

  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M views';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K views';
  }
  return num + ' views';
};

export const formatSubscribers = (count) => {
  if (!count) return '0 subscribers';
  const num = parseInt(count);
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M subscribers';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K subscribers';
  }
  return num + ' subscribers';
};

export const formatDateBR = (value) => {
  if (!value) return 'Just now';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleDateString('pt-BR');
};
