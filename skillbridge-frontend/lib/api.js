import { useAuth, useUser } from '@clerk/nextjs';
import axios from 'axios';

// Base URL
let BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!BASE_URL) {
  if (process.env.NODE_ENV !== 'production') {
    BASE_URL = 'http://localhost:3001/api';
  } else {
    console.error('CRITICAL: NEXT_PUBLIC_BACKEND_URL is not set!');
    BASE_URL = '';
  }
}

if (BASE_URL && !BASE_URL.endsWith('/api')) {
  BASE_URL = `${BASE_URL.replace(/\/$/, '')}/api`;
}

// Client factory
const createApiClient = (token, devUserId, role) => {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Attach headers dynamically
  client.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (devUserId) {
      config.headers['x-clerk-user'] = devUserId;
    }

    // ✅ FIX: send role to backend
    if (role) {
      config.headers['x-role'] = role;
    }

    console.log(
      `API Request → ${config.method?.toUpperCase()} ${BASE_URL}${config.url}`,
      '| role:', role
    );

    return config;
  });

  return client;
};

// Hook
export const useApi = () => {
  const { getToken } = useAuth();
  const { user } = useUser();

  const request = async (method, url, data = null) => {
    try {
      const token = await getToken();

      console.log(
        'Auth Debug → token:',
        token ? 'YES' : 'NO',
        '| user:',
        user?.id
      );

      // Use actual user role from Clerk metadata or let backend fallback to DB
      const role = user?.publicMetadata?.role || null;

      const client = createApiClient(token, user?.id, role);

      const response = await client({
        method,
        url,
        data,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('API ERROR FULL:', error);

      return {
        success: false,
        status: error.response?.status,
        error:
          error.response?.data?.error ||
          error.message ||
          'Request failed',
        details: error.response?.data || null,
      };
    }
  };

  return {
    get: (url) => request('GET', url),
    post: (url, data) => request('POST', url, data),
    put: (url, data) => request('PUT', url, data),
    delete: (url) => request('DELETE', url),
  };
};

export default createApiClient;