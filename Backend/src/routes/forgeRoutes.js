import express from 'express';
import { getCachedList, manualRefresh, getFullDetail, refreshEventEmitter } from '../services/forgeService.js';

const router = express.Router();

// GET /api/forge/list – returns cached data immediately
router.get('/list', (req, res) => {
  const cached = getCachedList();
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    cached: true,
    lastUpdate: cached.lastUpdate,
    isRefreshing: cached.isRefreshing,
    progress: cached.progress,
    items: cached.items
  });
});

// GET /api/forge/:itemId/details – returns full detail with recipe & market stats
router.get('/:itemId/details', async (req, res) => {
  const { itemId } = req.params;
  const quickForgeLevel = parseInt(req.query.quickForgeLevel) || 0;
  const detail = await getFullDetail(itemId, quickForgeLevel);
  if (!detail) {
    return res.status(404).json({ success: false, error: 'Item not found' });
  }
  res.json(detail);
});

// POST /api/forge/refresh – manual refresh trigger
router.post('/refresh', async (req, res) => {
  const { quickForgeLevel = 0 } = req.body;
  await manualRefresh(quickForgeLevel);
  res.json({ success: true, message: 'Refresh started' });
});

// SSE endpoint for real‑time updates
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const onRefreshStart = () => sendEvent('refresh-start', {});
  const onPriceFetched = (data) => sendEvent('price-fetched', data);
  const onRefreshComplete = (data) => sendEvent('refresh-complete', data);

  refreshEventEmitter.on('refresh-start', onRefreshStart);
  refreshEventEmitter.on('price-fetched', onPriceFetched);
  refreshEventEmitter.on('refresh-complete', onRefreshComplete);

  req.on('close', () => {
    refreshEventEmitter.off('refresh-start', onRefreshStart);
    refreshEventEmitter.off('price-fetched', onPriceFetched);
    refreshEventEmitter.off('refresh-complete', onRefreshComplete);
    res.end();
  });
});

export default router;