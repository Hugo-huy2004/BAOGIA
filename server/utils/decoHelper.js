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
      lamp: null,
      shelf: null,
      clock: null
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

export const updateTrashAndPetStatus = async (bio) => {
  if (!bio || !bio.decoRoom) return bio;

  let modified = false;
  const now = new Date();

  // 1. Trash Spawn System (1 pile every 1 hour, max 6 piles)
  const lastSpawn = bio.decoRoom.lastTrashSpawnedAt ? new Date(bio.decoRoom.lastTrashSpawnedAt) : now;
  const elapsedMs = now.getTime() - lastSpawn.getTime();
  const spawned = Math.floor(elapsedMs / (60 * 60 * 1000));

  const currentTrashCount = bio.decoRoom.trashCount ?? 6;

  if (spawned > 0 && currentTrashCount < 6) {
    const add = Math.min(6 - currentTrashCount, spawned);
    bio.decoRoom.trashCount = currentTrashCount + add;
    bio.decoRoom.lastTrashSpawnedAt = new Date(lastSpawn.getTime() + add * 60 * 60 * 1000);
    bio.markModified('decoRoom.trashCount');
    bio.markModified('decoRoom.lastTrashSpawnedAt');
    modified = true;
  } else if (currentTrashCount >= 6) {
    bio.decoRoom.lastTrashSpawnedAt = now;
    bio.markModified('decoRoom.lastTrashSpawnedAt');
    modified = true;
  }

  // 2. Pet Hunger System (requires feed within 24h, else dies)
  if (bio.decoRoom.items?.pet && (bio.decoRoom.petStatus || 'alive') === 'alive') {
    const fedAt = bio.decoRoom.petFedAt ? new Date(bio.decoRoom.petFedAt).getTime() : 0;
    if (now.getTime() - fedAt >= 24 * 60 * 60 * 1000) {
      bio.decoRoom.petStatus = 'dead';
      bio.markModified('decoRoom.petStatus');
      modified = true;
    }
  }

  if (modified) {
    await bio.save();
  }
  return bio;
};
