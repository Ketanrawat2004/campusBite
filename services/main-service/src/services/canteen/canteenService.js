'use strict';

const Canteen = require('../../models/Canteen');
const Hostel = require('../../models/Hostel');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');

/**
 * Canteen Service
 * Handles operations related to canteens and hostels.
 */

/**
 * List hostels for a college
 */
async function getHostels(query) {
  const { collegeId, search } = query;
  const filter = { isActive: true };

  if (collegeId) filter.collegeId = collegeId;
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const hostels = await Hostel.find(filter).sort({ name: 1 });
  return hostels;
}

/**
 * Get hostel by ID
 */
async function getHostelById(id) {
  const hostel = await Hostel.findById(id);
  if (!hostel) throw ApiError.notFound('Hostel');
  return hostel;
}

/**
 * List canteens
 */
async function getCanteens(query) {
  const { collegeId, isOpen, search } = query;
  const { page, limit, skip } = parsePagination(query);

  const filter = {};
  if (collegeId) filter.collegeId = collegeId;
  if (isOpen !== undefined) filter.acceptingOrders = isOpen === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  const [canteens, total] = await Promise.all([
    Canteen.find(filter).sort({ isCurrentlyOpen: -1, rating: -1 }).skip(skip).limit(limit),
    Canteen.countDocuments(filter),
  ]);

  return {
    canteens,
    meta: buildMeta(page, limit, total),
  };
}

/**
 * Get canteen by ID
 */
async function getCanteenById(id) {
  const canteen = await Canteen.findById(id);
  if (!canteen) throw ApiError.notFound('Canteen');
  return canteen;
}

/**
 * Create canteen (Admin)
 */
async function createCanteen(data) {
  const canteen = new Canteen(data);
  await canteen.save();
  return canteen;
}

/**
 * Update canteen details
 */
async function updateCanteen(id, data) {
  const canteen = await Canteen.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!canteen) throw ApiError.notFound('Canteen');
  return canteen;
}

/**
 * Toggle canteen order acceptance status
 */
async function toggleCanteenStatus(id, acceptingOrders) {
  const canteen = await Canteen.findByIdAndUpdate(
    id,
    { acceptingOrders: Boolean(acceptingOrders) },
    { new: true }
  );
  if (!canteen) throw ApiError.notFound('Canteen');
  return canteen;
}

module.exports = {
  getHostels,
  getHostelById,
  getCanteens,
  getCanteenById,
  createCanteen,
  updateCanteen,
  toggleCanteenStatus,
};
