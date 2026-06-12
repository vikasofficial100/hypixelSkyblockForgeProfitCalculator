export const PORT = process.env.PORT || 3000;
export const COFLNET_BASE = 'https://sky.coflnet.com/api';
export const CACHE_FILE_PATH = './data/cache.json';

export const TAX_RATES = {
  AH_LOW: 0.01,
  AH_HIGH: 0.02,
  BAZAAR: 0.01125
};

export const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 60 minutes
export const API_RATE_LIMIT = 1; // request per second

export const MAX_RETRIES = 2;
export const REQUEST_TIMEOUT_MS = 10000;
