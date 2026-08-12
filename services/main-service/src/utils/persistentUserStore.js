'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const filePath = path.join(__dirname, '../../data/persistent_users.json');

/**
 * Reads all custom registered users from disk.
 */
function getPersistentUsers() {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]), 'utf8');
      return [];
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    logger.error({ msg: 'Failed to read persistent users file', err: err.message });
    return [];
  }
}

/**
 * Saves a registered user object to disk.
 */
function savePersistentUser(userDoc) {
  try {
    const users = getPersistentUsers();
    const cleanUser = typeof userDoc.toObject === 'function' ? userDoc.toObject() : userDoc;
    
    // Check if user already exists
    const idx = users.findIndex((u) => u.email === cleanUser.email);
    if (idx >= 0) {
      users[idx] = cleanUser;
    } else {
      users.push(cleanUser);
    }

    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf8');
    logger.info({ msg: 'User saved to persistent disk backup', email: cleanUser.email });
  } catch (err) {
    logger.error({ msg: 'Failed to save persistent user to disk', err: err.message });
  }
}

/**
 * Permanently deletes a user from disk backup.
 */
function deletePersistentUser(email) {
  try {
    const users = getPersistentUsers();
    const filtered = users.filter((u) => u.email !== email);
    fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf8');
    logger.info({ msg: 'User removed from persistent disk backup', email });
  } catch (err) {
    logger.error({ msg: 'Failed to delete persistent user from disk', err: err.message });
  }
}

/**
 * Restores custom registered users into MongoDB during seeding.
 */
async function restorePersistentUsers(UserModel) {
  try {
    const users = getPersistentUsers();
    if (users.length === 0) return;

    for (const u of users) {
      const exists = await UserModel.findOne({ email: u.email });
      if (!exists) {
        await UserModel.create(u);
        logger.info({ msg: 'Restored registered user from disk backup', email: u.email });
      }
    }
  } catch (err) {
    logger.error({ msg: 'Failed to restore persistent users', err: err.message });
  }
}

module.exports = { getPersistentUsers, savePersistentUser, deletePersistentUser, restorePersistentUsers };
