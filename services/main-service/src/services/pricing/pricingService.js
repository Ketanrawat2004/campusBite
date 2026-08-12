'use strict';

const MenuItem = require('../../models/MenuItem');
const Coupon = require('../../models/Coupon');
const DeliveryConfig = require('../../models/DeliveryConfig');
const ApiError = require('../../utils/ApiError');
const { FULFILLMENT_TYPE } = require('../../config/constants');

/**
 * Pricing Service
 * Recalculates order subtotal, delivery fees, discounts, and total in paise.
 */

/**
 * Calculate pricing breakdown for an order
 *
 * @param {object} params
 * @param {string} params.collegeId
 * @param {string} params.canteenId
 * @param {string} params.fulfillmentType - 'PICKUP' | 'DELIVERY'
 * @param {Array} params.items - [{ menuItemId, quantity, customizations }]
 * @param {string} [params.couponCode]
 * @param {string} [params.studentId]
 */
async function calculateOrderPricing({
  collegeId,
  canteenId,
  fulfillmentType,
  items,
  couponCode = null,
  studentId = null,
}) {
  if (!items || items.length === 0) {
    throw ApiError.badRequest('Cart is empty');
  }

  // 1. Fetch menu items from DB to verify availability and prices
  const itemIds = items.map((i) => i.menuItemId);
  const dbMenuItems = await MenuItem.find({
    _id: { $in: itemIds },
    canteenId,
    isActive: true,
  });

  const menuItemMap = new Map(dbMenuItems.map((item) => [String(item._id), item]));

  let subtotalInPaise = 0;
  const verifiedOrderItems = [];

  for (const item of items) {
    const dbItem = menuItemMap.get(String(item.menuItemId));
    if (!dbItem) {
      throw ApiError.notFound(`Menu item (${item.menuItemId})`);
    }
    if (!dbItem.isAvailable) {
      throw ApiError.conflict('ITEM_UNAVAILABLE', `"${dbItem.name}" is currently unavailable`);
    }

    // Calculate customization price
    let customizationPriceInPaise = 0;
    const verifiedCustomizations = [];

    if (item.customizations && item.customizations.length > 0) {
      for (const cust of item.customizations) {
        // Find matching customization group in dbItem
        const dbGroup = dbItem.customizations.find((g) => g.groupName === cust.groupName);
        if (dbGroup) {
          const dbOpt = dbGroup.options.find((o) => o.name === cust.selectedOption);
          if (dbOpt && dbOpt.isAvailable) {
            const addPrice = dbOpt.additionalPriceInPaise || 0;
            customizationPriceInPaise += addPrice;
            verifiedCustomizations.push({
              groupName: cust.groupName,
              selectedOption: cust.selectedOption,
              additionalPriceInPaise: addPrice,
            });
          }
        }
      }
    }

    const unitPriceInPaise = dbItem.priceInPaise + customizationPriceInPaise;
    const itemTotalInPaise = unitPriceInPaise * item.quantity;
    subtotalInPaise += itemTotalInPaise;

    verifiedOrderItems.push({
      menuItemId: dbItem._id,
      name: dbItem.name,
      imageUrl: dbItem.imageUrl,
      priceInPaise: dbItem.priceInPaise,
      quantity: item.quantity,
      customizations: verifiedCustomizations,
      itemTotalInPaise,
    });
  }

  // 2. Calculate Delivery Fee
  let deliveryFeeInPaise = 0;
  if (fulfillmentType === FULFILLMENT_TYPE.DELIVERY) {
    // Get delivery config for college
    const config = await DeliveryConfig.findOne({ collegeId });
    if (config && config.tiers && config.tiers.length > 0) {
      // Default initial delivery fee is the solo tier (1 order = ₹20)
      const soloTier = config.tiers.find((t) => t.label === 'SOLO') || config.tiers[0];
      deliveryFeeInPaise = soloTier.feeInPaise;
    } else {
      deliveryFeeInPaise = 2000; // ₹20 default fallback
    }
  }

  // 3. Calculate Discount if coupon provided
  let discountInPaise = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      collegeId,
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    });

    if (coupon) {
      if (subtotalInPaise >= (coupon.minOrderValueInPaise || 0)) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountInPaise = Math.round((subtotalInPaise * coupon.discountValue) / 100);
          if (coupon.maxDiscountInPaise && discountInPaise > coupon.maxDiscountInPaise) {
            discountInPaise = coupon.maxDiscountInPaise;
          }
        } else if (coupon.discountType === 'FLAT') {
          discountInPaise = coupon.discountValue;
        }

        // Cap discount to subtotal
        discountInPaise = Math.min(discountInPaise, subtotalInPaise);
        appliedCoupon = coupon;
      }
    }
  }

  const taxInPaise = 0; // Tax included in item prices initially
  const totalInPaise = Math.max(0, subtotalInPaise + deliveryFeeInPaise - discountInPaise + taxInPaise);

  return {
    verifiedOrderItems,
    pricingBreakdown: {
      subtotalInPaise,
      deliveryFeeInPaise,
      discountInPaise,
      taxInPaise,
      totalInPaise,
    },
    appliedCoupon,
  };
}

module.exports = {
  calculateOrderPricing,
};
