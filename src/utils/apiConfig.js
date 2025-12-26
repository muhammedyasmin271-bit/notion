export const getBackendUrl = () => {
  // Try different possible environment variable names
  let envUrl = process.env.REACT_APP_BACKEND_URL || 
               process.env.REACT_APP_API_URL || 
               process.env.REACT_APP_SERVER_URL;
  
  // Clean up the URL if it exists
  if (envUrl && envUrl !== 'undefined' && envUrl !== '') {
    // Remove /api if it's at the end of the URL
    let url = envUrl.replace(/\/api$/, '').replace(/\/$/, '');
    // Ensure it starts with http
    if (url.startsWith('http')) {
      return url;
    }
  }
  
  // Fallback to the known OnRender URL
  const defaultUrl = 'https://notion-l9ti.onrender.com';
  return defaultUrl;
};

export const getApiUrl = (path) => {
  const baseUrl = getBackendUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const finalUrl = `${baseUrl}${normalizedPath}`;
  console.log(`📡 API Call to: ${finalUrl}`);
  return finalUrl;
};

