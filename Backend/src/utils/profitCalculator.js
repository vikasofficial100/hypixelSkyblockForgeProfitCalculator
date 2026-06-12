import { TAX_RATES } from '../config/constants.js';

export function calculateTax(price, channel) {
  if (channel === 'AH') return price >= 1_000_000 ? price * TAX_RATES.AH_HIGH : price * TAX_RATES.AH_LOW;
  if (channel === 'BAZAAR') return price * TAX_RATES.BAZAAR;
  return 0;
}

export function calculateSellPriceAfterTax(price, channel) {
  return Math.round(price - calculateTax(price, channel));
}

export function calculateTotalCost(ingredients, priceMap) {
  let total = 0;
  for (const ing of ingredients) {
    if (ing.source === 'COINS') total += ing.quantity;
    else if (priceMap[ing.id] !== undefined) total += priceMap[ing.id] * ing.quantity;
  }
  return total;
}

export function generateWarnings(profit, activeAuctions, totalCost, budget, minAuctions) {
  const warnings = [];
  if (profit < 0) warnings.push('Trash for forging');
  if (activeAuctions !== null && activeAuctions < minAuctions) warnings.push(`Only ${activeAuctions} active auctions`);
  if (budget && totalCost > budget) warnings.push('Over budget');
  if (activeAuctions !== null && activeAuctions < 5) warnings.push('Price unstable');
  return warnings;
}

export function adjustDuration(baseHours, quickForgeLevel = 0) {
  return baseHours * (1 - quickForgeLevel * 0.01);
}
