import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RECIPE_PATH = path.resolve(__dirname, '../../data/recipe.json');

let recipeDatabase = null;
let itemsById = new Map();
let allItems = [];

export function loadRecipes() {
  const raw = fs.readFileSync(RECIPE_PATH, 'utf8');
  recipeDatabase = JSON.parse(raw);
  itemsById.clear();
  allItems = [];

  for (const section of recipeDatabase.forge_items) {
    for (const item of section.items) {
      allItems.push(item);
      itemsById.set(item.id, item);
    }
  }
  console.log(`Loaded ${allItems.length} forge items`);
}

export function getRecipeById(id) {
  return itemsById.get(id) || null;
}

export function getAllRecipes() {
  return allItems;
}

export function getRecipeIngredients(recipe) {
  return recipe?.recipe?.ingredients || [];
}

export function getItemSource(itemId) {
  return getRecipeById(itemId)?.source || null;
}

// Initial load
loadRecipes();
