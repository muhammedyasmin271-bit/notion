export const getBackendUrl = () => {
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  if (envUrl && envUrl !== 'undefined' && envUrl !== '') {
    return envUrl;
  }
  return 'https://notion-l9ti.onrender.com';
};

export const getApiUrl = (path) => {
  const baseUrl = getBackendUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

