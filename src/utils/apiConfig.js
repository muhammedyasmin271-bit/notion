export const getBackendUrl = () => {
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  // Ensure it's a non-empty string that looks like a URL
  if (typeof envUrl === 'string' && envUrl !== 'undefined' && envUrl.trim() !== '' && envUrl.startsWith('http')) {
    return envUrl.trim();
  }
  return 'https://notion-l9ti.onrender.com';
};

export const getApiUrl = (path) => {
  const baseUrl = getBackendUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

