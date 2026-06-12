import axios from 'axios';
import Bottleneck from 'bottleneck';
import { COFLNET_BASE, API_RATE_LIMIT, REQUEST_TIMEOUT_MS, MAX_RETRIES } from '../config/constants.js';

const limiter = new Bottleneck({
  minTime: 1000 / API_RATE_LIMIT, // 1 request per second
  maxConcurrent: 1
});

const client = axios.create({
  baseURL: COFLNET_BASE,
  timeout: REQUEST_TIMEOUT_MS
});

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await limiter.schedule(() => client.get(url));
      return response.data;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// AH cluster median price
export async function getClusterPrice(itemTag) {
  try {
    const data = await fetchWithRetry(`/auctions/tag/${itemTag}/active/bin`);
    if (!Array.isArray(data) || data.length === 0) return null;
    const prices = data
      .map(a => a.startingBid)
      .filter(p => typeof p === 'number' && p > 0)
      .sort((a, b) => a - b)
      .slice(0, 6);
    if (prices.length === 0) return null;
    const clusters = [];
    for (const price of prices) {
      let placed = false;
      for (const cluster of clusters) {
        const avg = cluster.reduce((s, v) => s + v, 0) / cluster.length;
        if (Math.abs(price - avg) / avg <= 0.05) {
          cluster.push(price);
          placed = true;
          break;
        }
      }
      if (!placed) clusters.push([price]);
    }
    const largest = clusters.reduce((best, c) => c.length > best.length ? c : best);
    const sorted = [...largest].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid-1] + sorted[mid]) / 2 : sorted[mid];
  } catch (err) {
    console.error(`getClusterPrice ${itemTag} failed:`, err.message);
    return null;
  }
}

// Bazaar price (instant buy)
export async function getBazaarPrice(itemId, quantity) {
  try {
    const data = await fetchWithRetry(`/bazaar/${itemId}/snapshot`);
    if (!data?.buyOrders?.length) return null;
    let remaining = quantity;
    let total = 0;
    for (const order of data.buyOrders) {
      const available = order.amount * (order.orders || 1);
      const taken = Math.min(remaining, available);
      total += taken * order.pricePerUnit;
      remaining -= taken;
      if (remaining === 0) break;
    }
    return remaining === 0 ? total : null;
  } catch (err) {
    console.error(`getBazaarPrice ${itemId} failed:`, err.message);
    return null;
  }
}

// Detailed AH stats (for detail endpoint)
export async function getAuctionStats(itemTag) {
  try {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    const toISTDate = (ts) => new Date(ts + IST_OFFSET).toISOString().slice(0,10);
    const formatIST = (ts) => {
      const d = new Date(ts + IST_OFFSET);
      const day = d.getUTCDate();
      const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()];
      const year = d.getUTCFullYear();
      let hours = d.getUTCHours();
      const minutes = String(d.getUTCMinutes()).padStart(2,'0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      return `${day} ${mon} ${year}, ${hours}:${minutes} ${ampm}`;
    };
    const parseEnd = (endStr) => new Date(endStr + 'Z').getTime();

    const [bins, sold] = await Promise.all([
      fetchWithRetry(`/auctions/tag/${itemTag}/active/bin`),
      fetchWithRetry(`/auctions/tag/${itemTag}/sold`)
    ]);
    const binsArr = Array.isArray(bins) ? bins : [];
    const soldArr = Array.isArray(sold) ? sold : [];

    const lbin = [...binsArr].sort((a,b)=>a.startingBid-b.startingBid).slice(0,10).map(b=>b.startingBid);
    const validSales = soldArr.filter(s => s.highestBidAmount > 0 && s.highestBidAmount === s.startingBid);
    const salePrices = validSales.map(s => s.highestBidAmount);
    const avgSoldPrice = salePrices.length ? salePrices.reduce((a,b)=>a+b,0)/salePrices.length : null;
    let medianSoldPrice = null;
    if (validSales.length) {
      const prices = [...salePrices].sort((a,b)=>a-b);
      const mid = Math.floor(prices.length/2);
      medianSoldPrice = prices.length%2===0 ? (prices[mid-1]+prices[mid])/2 : prices[mid];
    }
    let salesPerDay = null;
    if (validSales.length > 1) {
      const timestamps = validSales.map(s=>parseEnd(s.end));
      const daysDiff = (Math.max(...timestamps)-Math.min(...timestamps))/(1000*3600*24);
      salesPerDay = daysDiff>0 ? Math.round((validSales.length/daysDiff)*10)/10 : validSales.length;
    } else if (validSales.length === 1) salesPerDay = 1;

    const now = Date.now();
    const sevenDaysAgo = now - 7*24*3600*1000;
    const salesLast7Days = {};
    for (const sale of validSales) {
      const endMs = parseEnd(sale.end);
      if (endMs >= sevenDaysAgo) {
        const date = toISTDate(endMs);
        salesLast7Days[date] = (salesLast7Days[date]||0)+1;
      }
    }
    const twentyFourAgo = now - 24*3600*1000;
    const sales24h = validSales.filter(s=>parseEnd(s.end)>=twentyFourAgo);
    let lowestSales24h = null;
    if (sales24h.length) {
      lowestSales24h = [...sales24h].sort((a,b)=>a.highestBidAmount-b.highestBidAmount).slice(0,10).map(s=>({
        price: s.highestBidAmount,
        soldAt: formatIST(parseEnd(s.end))
      }));
    }
    return { lbin, avgSoldPrice, medianSoldPrice, salesPerDay, salesLast7Days, lowestSales24h, activeAuctions: lbin.length };
  } catch (err) {
    console.error(`getAuctionStats ${itemTag} failed:`, err.message);
    return null;
  }
}
