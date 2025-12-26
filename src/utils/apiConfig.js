const BACKEND_URL = 'https://notion-l9ti.onrender.com';

export const getBackendUrl = () => {
  return BACKEND_URL;
};

export const getApiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}${normalizedPath}`;
};

