import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hypixelskyblockforgeprofitcalculator.onrender.com/api/forge';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use((config) => {
  console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('API Timeout - Backend might be starting up');
    } else if (error.response?.status === 500) {
      console.error('Server error - Check backend logs');
    }
    return Promise.reject(error);
  }
);

/**
 * Fetch all forge items with profits
 */
export async function fetchForgeItems(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.quickForgeLevel !== undefined && filters.quickForgeLevel !== null && filters.quickForgeLevel !== 0) {
    params.append('quickForgeLevel', filters.quickForgeLevel);
  }
  if (filters.minProfit && filters.minProfit > 0) {
    params.append('minProfit', filters.minProfit);
  }
  if (filters.maxBudget) {
    params.append('maxBudget', filters.maxBudget);
  }
  if (filters.minDuration) {
    params.append('minDuration', filters.minDuration);
  }
  if (filters.minActiveAuctions !== undefined && filters.minActiveAuctions !== null && filters.minActiveAuctions !== 5) {
    params.append('minActiveAuctions', filters.minActiveAuctions);
  }
  if (filters.sortBy) {
    params.append('sortBy', filters.sortBy);
  }
  
  const url = `/list${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await api.get(url);
  return response.data;
}

/**
 * Fetch detailed information for a specific forge item
 */
export async function fetchForgeDetail(itemId) {
  const response = await api.get(`/${itemId}/details`);
  return response.data;
}

/**
 * Check if backend is healthy
 */
export async function checkHealth() {
  const response = await axios.get('https://hypixelskyblockforgeprofitcalculator.onrender.com/health');
  return response.data;
}

/**
 * Clear API cache (admin)
 */
export async function clearCache() {
  const response = await api.post('/cache/clear');
  return response.data;
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  const response = await api.get('/cache/stats');
  return response.data;
}
 
/**
 * Manually trigger background refresh
 */
export async function manualRefresh() {
  const response = await api.post('/refresh');
  return response.data;
}

export default api;