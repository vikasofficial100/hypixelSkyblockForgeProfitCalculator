import cacheService from './cacheService.js';
import { getAllRecipes, getRecipeById, getRecipeIngredients, getItemSource } from '../utils/recipeLoader.js';
import { getClusterPrice, getBazaarPrice, getAuctionStats } from '../utils/priceFetcher.js';
import { calculateSellPriceAfterTax, calculateTotalCost, generateWarnings, adjustDuration } from '../utils/profitCalculator.js';
import EventEmitter from 'events';

export const refreshEventEmitter = new EventEmitter();

// Global price map from the last refresh (used for fast detail lookups)
export let globalPriceMap = new Map();

// In-memory price map for the ongoing refresh
let currentPriceMap = new Map();

// Build unique list of all items that need price fetching
function getUniquePriceItems() {
  const allRecipes = getAllRecipes();
  const uniqueItems = new Map(); // key: itemId, value: source
  
  for (const recipe of allRecipes) {
    // Add the forge item itself
    if (recipe.source !== 'NONE') {
      uniqueItems.set(recipe.id, recipe.source);
    }
    
    // Add all ingredients with their correct source
    const ingredients = getRecipeIngredients(recipe);
    for (const ing of ingredients) {
      if (ing.source !== 'COINS' && ing.source !== 'NONE') {
        // If already exists, prioritize AH over BAZAAR
        if (!uniqueItems.has(ing.id) || ing.source === 'AH') {
          uniqueItems.set(ing.id, ing.source);
        }
      }
    }
  }
  
  // Convert Map to array of objects
  return Array.from(uniqueItems.entries()).map(([id, source]) => ({ id, source }));
}


//Helper function for invalid profit per hour
  const MIN_DURATION_HOURS = 0.1; // 6 minutes

  function safeProfitPerHour(profitPerForge, durationHours) {
    if (!durationHours || durationHours < MIN_DURATION_HOURS) {
      return null;
    }
    return profitPerForge / durationHours;
  }

// Compute profit for a single forge item using current price map
function computeItemProfit(recipe, quickForgeLevel = 0, priceMap) {
  const ingredients = getRecipeIngredients(recipe);
  const totalCost = calculateTotalCost(ingredients, priceMap);
  const sellPriceRaw = priceMap[recipe.id] || 0;
  const sellPriceAfterTax = calculateSellPriceAfterTax(sellPriceRaw, recipe.source);
  const profitPerForge = sellPriceAfterTax - totalCost;
  const adjustedDuration = adjustDuration(recipe.duration, quickForgeLevel);
  const profitPerHour = safeProfitPerHour(profitPerForge, adjustedDuration);
  const ratio = totalCost > 0 ? sellPriceRaw / totalCost : 0;
  const warnings = generateWarnings(profitPerForge, null, totalCost, null, 5);

  return {
    itemId: recipe.id,
    name: recipe.name,
    rarity: recipe.rarity,
    category: recipe.section || 'FORGING',
    tier: recipe.requirements?.[0]?.match(/\d+/)?.[0] || 0,
    duration: recipe.duration,
    durationAdjusted: adjustedDuration,
    soldOn: recipe.source,
    prices: {
      sellPrice: sellPriceRaw,
      sellPriceWithTax: sellPriceAfterTax,
      source: recipe.source,
      activeAuctions: null
    },
    cost: { totalCost },
    profit: { profitPerForge, profitPerHour, ratio, warnings }
  };
}

// Full background refresh
export async function runFullRefresh(quickForgeLevel = 0) {
  if (cacheService.cache.isRefreshing) {
    console.log(`[${new Date().toLocaleTimeString()}] Refresh already running, skipping`);
    return;
  }
  console.log(`[${new Date().toLocaleTimeString()}] Starting full refresh`);
  // 🔥 Load old prices from current cache before refresh starts
  const oldPriceMap = new Map();
  const currentCache = cacheService.getList();
  for (const item of currentCache.items) {
    if (item.prices?.sellPrice && item.prices.sellPrice > 0) {
      oldPriceMap.set(item.itemId, item.prices.sellPrice);
    }
  }
  // Also add ingredient prices from globalPriceMap
  for (const [id, price] of globalPriceMap.entries()) {
    if (price > 0) oldPriceMap.set(id, price);
  }
  
  cacheService.setRefreshing(true, { current: 0, total: 0, status: 'starting' });
  refreshEventEmitter.emit('refresh-start');

  const uniqueItems = getUniquePriceItems();
  const total = uniqueItems.length;
  cacheService.updateProgress(0, total, 'fetching prices');

  currentPriceMap.clear();
  let fetched = 0;
  const errors = [];
  console.log(`[${new Date().toLocaleTimeString('en-GB')}] Starting price fetch for ${total} items`);
  for (const { id: itemId, source } of uniqueItems) {
    let price = null;
    try {
     console.log(`[${new Date().toLocaleTimeString('en-GB')}] ${fetched + 1}/${total} ${itemId}`);
      if (source === 'BAZAAR') price = await getBazaarPrice(itemId, 1);
      else if (source === 'AH') price = await getClusterPrice(itemId);
      if (price !== null) {
        currentPriceMap.set(itemId, price);
      } else {
        // 🔥 Use old price if fetch returned null
        const oldPrice = oldPriceMap.get(itemId);
        if (oldPrice !== undefined && oldPrice > 0) {
          currentPriceMap.set(itemId, oldPrice);
          console.log(`⚠️ Using OLD price for ${itemId}: ${oldPrice}`);
        } else {
          errors.push(itemId);
        }
      }
    } catch (err) {
      // 🔥 On error, also use old price
      const oldPrice = oldPriceMap.get(itemId);
      if (oldPrice !== undefined && oldPrice > 0) {
        currentPriceMap.set(itemId, oldPrice);
        console.log(`⚠️ Using OLD price for ${itemId} (error: ${err.message})`);
      } else {
        errors.push(itemId);
      }
    }
    fetched++;
    cacheService.updateProgress(fetched, total, `fetching (${fetched}/${total})`);
    refreshEventEmitter.emit('price-fetched', { itemId, price, fetched, total });
  }

  // Update global price map for later detail lookups
  globalPriceMap.clear();
  for (const [id, price] of currentPriceMap.entries()) {
    globalPriceMap.set(id, price);
  }

  cacheService.updateProgress(total, total, 'calculating profits');
  const allRecipes = getAllRecipes();
  const updatedItems = [];
  for (const recipe of allRecipes) {
    if (recipe.source === 'NONE') {
      updatedItems.push({
        itemId: recipe.id,
        name: recipe.name,
        rarity: recipe.rarity,
        category: recipe.section || 'FORGING',
        tier: recipe.requirements?.[0]?.match(/\d+/)?.[0] || 0,
        duration: recipe.duration,
        durationAdjusted: adjustDuration(recipe.duration, quickForgeLevel),
        soldOn: recipe.source,
        prices: { sellPrice: 0, sellPriceWithTax: 0, source: recipe.source, activeAuctions: null },
        cost: { totalCost: 0 },
        profit: { profitPerForge: 0, profitPerHour: 0, ratio: 0, warnings: ['No market source'] }
      });
    } else {
      const priceMap = Object.fromEntries(currentPriceMap);
      updatedItems.push(computeItemProfit(recipe, quickForgeLevel, priceMap));
    }
  }
  //=========================================================
              console.log(
        `[${new Date().toLocaleTimeString('en-GB')}] Failed items:`,
        errors
      );
  //=======================================================

  cacheService.setList(updatedItems);
  cacheService.setRefreshing(false);
  refreshEventEmitter.emit('refresh-complete', { items: updatedItems, lastUpdate: new Date().toISOString() });
  console.log(
  `[${new Date().toLocaleTimeString('en-GB')}] Full refresh completed. ${updatedItems.length} items cached. Errors: ${errors.length}`);
}


// Get full detail for a single item (used by detail endpoint)
export async function getFullDetail(itemId, quickForgeLevel = 0) {
  const recipe = getRecipeById(itemId);
  if (!recipe) return null;

  // Use the global price map (from last refresh) as base
  let priceMap = {};
  for (const [id, price] of globalPriceMap.entries()) {
    priceMap[id] = price;
  }

  // Ensure sell price is present
  let sellPrice = priceMap[itemId];
  if (!sellPrice && recipe.source !== 'NONE') {
    if (recipe.source === 'BAZAAR') sellPrice = await getBazaarPrice(itemId, 1);
    else if (recipe.source === 'AH') sellPrice = await getClusterPrice(itemId);
    if (sellPrice) {
      priceMap[itemId] = sellPrice;
      globalPriceMap.set(itemId, sellPrice);
    }
  }
  sellPrice = sellPrice || 0;

  // Process ingredients
  const ingredients = getRecipeIngredients(recipe);
  const ingredientDetails = [];
  let totalCost = 0;

  for (const ing of ingredients) {
    let unitPrice = 0;
    let totalPrice = 0;
    let missing = false;

    if (ing.source === 'COINS') {
      unitPrice = 1;
      totalPrice = ing.quantity;
    } else {
      let price = priceMap[ing.id];
      if (!price && ing.source !== 'NONE') {
        if (ing.source === 'BAZAAR') price = await getBazaarPrice(ing.id, 1);
        else if (ing.source === 'AH') price = await getClusterPrice(ing.id);
        if (price) {
          priceMap[ing.id] = price;
          globalPriceMap.set(ing.id, price);
        }
      }
      unitPrice = price || 0;
      totalPrice = unitPrice * ing.quantity;
    }
    totalCost += totalPrice;
    ingredientDetails.push({
      item: ing.item,
      quantity: ing.quantity,
      source: ing.source,
      unitPrice,
      totalPrice,
      missing,
      rawCost: null
    });
  }

  const sellPriceAfterTax = calculateSellPriceAfterTax(sellPrice, recipe.source);
  const profitPerForge = sellPriceAfterTax - totalCost;
  const adjustedDuration = adjustDuration(recipe.duration, quickForgeLevel);
  const profitPerHour = safeProfitPerHour(profitPerForge, adjustedDuration);
  const ratio = totalCost > 0 ? sellPrice / totalCost : 0;
  const warnings = generateWarnings(profitPerForge, null, totalCost, null, 5);

  let marketStats = null;
  if (recipe.source === 'AH') {
    marketStats = await getAuctionStats(itemId);
  }

  return {
    success: true,
    timestamp: new Date().toISOString(),
    item: {
      itemId: recipe.id,
      name: recipe.name,
      rarity: recipe.rarity,
      category: recipe.section || 'FORGING',
      tier: recipe.requirements?.[0]?.match(/\d+/)?.[0] || 0,
      duration: recipe.duration,
      source: recipe.source
    },
    market: {
      current: {
        sellPrice: sellPrice,
        sellPriceWithTax: sellPriceAfterTax,
        activeAuctions: marketStats?.activeAuctions || null,
        source: recipe.source
      },
      recent: marketStats ? {
        lowestBinsLast24h: marketStats.lowestSales24h,
        avgSoldPrice: marketStats.avgSoldPrice,
        medianSoldPrice: marketStats.medianSoldPrice,
        salesPerDay: marketStats.salesPerDay,
        salesLast7Days: marketStats.salesLast7Days
      } : null
    },
    recipe: {
      ingredients: ingredientDetails,
      totalCost
    },
    profit: {
      profitPerForge,
      profitPerHour,
      ratio,
      warnings
    }
  };
}

// For list endpoint – return cached data immediately
export function getCachedList() {
  return cacheService.getList();
}

// Manual refresh trigger
export async function manualRefresh(quickForgeLevel = 0) {
  runFullRefresh(quickForgeLevel).catch(err => console.error('Manual refresh failed:', err));
  return { success: true, message: 'Refresh started in background' };
}