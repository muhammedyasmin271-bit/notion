export const getBackendUrl = () => {
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  
  // Explicitly check for the backend URL the user wants
  const fallbackUrl = 'https://notion-l9ti.onrender.com';
  
  // Robust check for environment variable
  if (typeof envUrl === 'string' && 
      envUrl.startsWith('http') && 
      envUrl.length > 10) { // Basic length check for valid URL
    return envUrl.trim().replace(/\/$/, ''); // Remove trailing slash
  }
  
  return fallbackUrl;
};

export const getApiUrl = (path) => {
  const baseUrl = getBackendUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

