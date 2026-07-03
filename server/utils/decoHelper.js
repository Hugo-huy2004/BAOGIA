import Bio from '../models/Bio.js';

/**
 * Checks if a member's HugoHome subscription has expired past the 7-day grace period.
 * If yes, it wipes all placed items, custom layout positions, and disables the room display.
 * @param {object} bio - The bio mongoose document
 * @returns {Promise<object>} The updated bio document
 */
export const checkAndResetDecoRoom = async (bio) => {
  if (!bio || !bio.decoRoom || !bio.decoRoom.expiresAt) return bio;
  
  const now = new Date();
  const graceLimit = new Date(new Date(bio.decoRoom.expiresAt).getTime() + 7 * 24 * 60 * 60 * 1000);
  
  if (now > graceLimit) {
    // Grace period exceeded -> Wipe items and positions clean!
    bio.decoRoom.items = {
      desk: 'desk_basic',
      chair: 'chair_basic',
      computer: 'laptop',
      pet: null,
      poster: null,
      window: 'window_day',
      rug: null,
      plant: null,
      lamp: null
    };
    bio.decoRoom.positions = {};
    bio.decoRoom.enabled = false;
    bio.decoRoom.expiresAt = null;
    
    bio.markModified('decoRoom.items');
    bio.markModified('decoRoom.positions');
    bio.markModified('decoRoom.enabled');
    bio.markModified('decoRoom.expiresAt');
    await bio.save();
  }
  return bio;
};
