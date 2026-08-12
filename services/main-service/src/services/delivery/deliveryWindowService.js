'use strict';

const { addMinutes, setMinutes, setSeconds, addHours, format, isAfter, isBefore } = require('date-fns');

/**
 * Delivery Window Service
 * Generates 30-minute delivery time slots for checkout.
 */

/**
 * Generate available delivery windows for today
 * Windows are 30-minute slots starting from now + minBufferMinutes (15 min)
 * up to 10:00 PM (22:00)
 */
function getAvailableDeliveryWindows(minBufferMinutes = 15) {
  const now = new Date();
  const earliestAllowed = addMinutes(now, minBufferMinutes);

  // Generate 30-min windows for today between 8:00 AM and 10:30 PM
  const windows = [];
  const startOfDay = setSeconds(setMinutes(now, 0), 0);

  for (let hour = 8; hour <= 22; hour++) {
    for (let minute of [0, 30]) {
      const slotStart = setMinutes(addHours(startOfDay, hour - startOfDay.getHours()), minute);
      const slotEnd = addMinutes(slotStart, 30);

      // Only include future slots after earliestAllowed
      if (isAfter(slotStart, earliestAllowed)) {
        windows.push({
          id: format(slotStart, 'yyyyMMdd-HHmm'),
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          label: `${format(slotStart, 'h:mm a')} – ${format(slotEnd, 'h:mm a')}`,
          windowKey: format(slotStart, 'yyyyMMdd-HHmm'),
        });
      }
    }
  }

  return windows;
}

/**
 * Get windowKey string from a startTime Date
 */
function getWindowKey(startTime) {
  const date = new Date(startTime);
  return format(date, 'yyyyMMdd-HHmm');
}

module.exports = {
  getAvailableDeliveryWindows,
  getWindowKey,
};
