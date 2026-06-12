import fs from 'fs';
import path from 'path';
import { CACHE_FILE_PATH } from '../config/constants.js';

class CacheService {
  constructor() {
    this.cache = {
      listItems: [],       // array of item objects
      lastUpdate: null,    // ISO timestamp
      isRefreshing: false,
      progress: { current: 0, total: 0, status: 'idle' }
    };
    this.loadFromDisk();
    this.forceResetIfStuck(); // 🔥 Auto-reset stuck refreshes on startup
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(CACHE_FILE_PATH)) {
        const data = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
        const saved = JSON.parse(data);
        this.cache = { ...this.cache, ...saved };
        console.log(`Cache loaded from disk, ${this.cache.listItems.length} items`);
      }
    } catch (err) {
      console.error('Failed to load cache from disk:', err.message);
    }
  }

  // 🔥 New method: Force reset if refresh has been stuck for more than 5 minutes
  forceResetIfStuck() {
    if (this.cache.isRefreshing) {
      const lastUpdate = this.cache.lastUpdate;
      const stuckDuration = Date.now() - new Date(lastUpdate || 0).getTime();
      if (stuckDuration > 5 * 60 * 1000) { // 5 minutes timeout
        console.log('⚠️ Found stuck refresh state on startup (running for ' + Math.floor(stuckDuration / 1000) + 's), resetting...');
        this.cache.isRefreshing = false;
        this.cache.progress = { current: 0, total: 0, status: 'idle' };
        this.saveToDisk();
      }
    }
  }

  saveToDisk() {
    try {
      const dir = path.dirname(CACHE_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(this.cache, null, 2));
    } catch (err) {
      console.error('Failed to save cache to disk:', err.message);
    }
  }

  getList() {
    return {
      items: this.cache.listItems,
      lastUpdate: this.cache.lastUpdate,
      isRefreshing: this.cache.isRefreshing,
      progress: this.cache.progress
    };
  }

  setList(items, lastUpdate = new Date().toISOString()) {
    this.cache.listItems = items;
    this.cache.lastUpdate = lastUpdate;
    this.saveToDisk();
  }

  setRefreshing(isRefreshing, progress = null) {
    this.cache.isRefreshing = isRefreshing;
    if (progress) this.cache.progress = progress;
    else if (!isRefreshing) this.cache.progress = { current: 0, total: 0, status: 'idle' };
    this.saveToDisk();
  }

  updateProgress(current, total, status) {
    this.cache.progress = { current, total, status };
    this.saveToDisk();
  }
}

export default new CacheService();