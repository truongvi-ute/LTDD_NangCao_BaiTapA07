import Constants from 'expo-constants';

const API_BASE = Constants.expoConfig?.extra?.apiUrl || 
                 process.env.EXPO_PUBLIC_API_URL || 
                 'http://localhost:8080/api';

// Remove /api from the end to get server base URL
const SERVER_BASE = API_BASE.replace(/\/api$/, '');

export const buildImageUrl = (path: string | null | undefined, type: 'avatar' | 'moment' = 'avatar', version?: string | number): string | null => {
  if (!path) return null;
  
  let url = '';
  
  // If already a full URL, use it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    url = path;
  } else if (path.startsWith('/')) {
    // If path starts with /, it's relative to server root
    url = SERVER_BASE + path;
  } else {
    // Otherwise, assume it's just a filename - build based on type
    const folder = type === 'moment' ? 'moments' : 'avatars';
    url = `${SERVER_BASE}/uploads/${folder}/${path}`;
  }
  
  // Add cache-busting if version provided
  if (version) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}v=${version}`;
  }
  
  console.log(`Built ${type} image URL:`, url);
  return url;
};
