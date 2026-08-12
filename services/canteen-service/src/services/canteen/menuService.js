'use strict';

const MenuCategory = require('../../models/MenuCategory');
const MenuItem = require('../../models/MenuItem');
const ApiError = require('../../utils/ApiError');
const { getRedisClient } = require('../../config/redis');
const { REDIS_KEYS, CACHE_TTL } = require('../../config/constants');
const logger = require('../../utils/logger');

async function getCanteenMenu(canteenId) {
  const cacheKey = REDIS_KEYS.canteenMenu(canteenId);
  const redis = getRedisClient();
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug({ msg: 'Menu cache hit', canteenId });
      return JSON.parse(cached);
    }
  } catch (err) {
    logger.warn({ msg: 'Redis GET error for menu cache', err: err.message });
  }

  const [categories, items] = await Promise.all([
    MenuCategory.find({ canteenId, isActive: true }).sort({ sortOrder: 1 }),
    MenuItem.find({ canteenId, isActive: true }).sort({ name: 1 }),
  ]);

  const menuData = categories.map((cat) => ({
    ...cat.toObject(),
    items: items.filter((item) => String(item.categoryId) === String(cat._id)),
  }));

  const assignedCatIds = new Set(categories.map((c) => String(c._id)));
  const uncategorizedItems = items.filter((item) => !assignedCatIds.has(String(item.categoryId)));
  if (uncategorizedItems.length > 0) {
    menuData.push({ _id: 'uncategorized', name: 'Other Items', sortOrder: 999, items: uncategorizedItems });
  }

  const result = { canteenId, categories: menuData, totalItems: items.length };

  try {
    await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL.MENU);
  } catch (err) {
    logger.warn({ msg: 'Redis SET error for menu cache', err: err.message });
  }
  return result;
}

async function invalidateMenuCache(canteenId) {
  try {
    const redis = getRedisClient();
    await redis.del(REDIS_KEYS.canteenMenu(canteenId));
    logger.debug({ msg: 'Menu cache invalidated', canteenId });
  } catch (err) {
    logger.warn({ msg: 'Failed to invalidate menu cache', err: err.message });
  }
}

async function searchMenuItems({ query, isVeg, canteenId }) {
  const filter = { isActive: true };
  if (canteenId) filter.canteenId = canteenId;
  if (isVeg !== undefined) filter.isVeg = isVeg === 'true';
  if (query && query.trim().length >= 2) {
    filter.$or = [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } },
    ];
  }
  return MenuItem.find(filter)
    .populate('canteenId', 'name imageUrl acceptingOrders avgPrepTimeMinutes')
    .populate('categoryId', 'name')
    .limit(30);
}

async function createCategory(data) {
  const category = new MenuCategory(data);
  await category.save();
  await invalidateMenuCache(data.canteenId);
  return category;
}

async function updateCategory(id, data) {
  const category = await MenuCategory.findByIdAndUpdate(id, data, { new: true });
  if (!category) throw ApiError.notFound('Category');
  await invalidateMenuCache(category.canteenId);
  return category;
}

async function deleteCategory(id) {
  const category = await MenuCategory.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!category) throw ApiError.notFound('Category');
  await invalidateMenuCache(category.canteenId);
  return { message: 'Category deleted successfully' };
}

async function createMenuItem(data) {
  const item = new MenuItem(data);
  await item.save();
  await invalidateMenuCache(data.canteenId);
  return item;
}

async function updateMenuItem(id, data) {
  const item = await MenuItem.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!item) throw ApiError.notFound('Menu item');
  await invalidateMenuCache(item.canteenId);
  return item;
}

async function toggleItemAvailability(id, isAvailable) {
  const item = await MenuItem.findByIdAndUpdate(id, { isAvailable: Boolean(isAvailable) }, { new: true });
  if (!item) throw ApiError.notFound('Menu item');
  await invalidateMenuCache(item.canteenId);
  return item;
}

async function deleteMenuItem(id) {
  const item = await MenuItem.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!item) throw ApiError.notFound('Menu item');
  await invalidateMenuCache(item.canteenId);
  return { message: 'Menu item deleted successfully' };
}

module.exports = {
  getCanteenMenu, invalidateMenuCache, searchMenuItems,
  createCategory, updateCategory, deleteCategory,
  createMenuItem, updateMenuItem, toggleItemAvailability, deleteMenuItem,
};
