import assert from 'node:assert/strict';
import { countMutualFriends, visibleFriendLocation } from '../routes/friendRoutes.js';

const counts = countMutualFriends(
  ['friend@hugo.test', 'shared@hugo.test'],
  ['candidate@hugo.test', 'stranger@hugo.test'],
  [
    { members: ['candidate@hugo.test', 'shared@hugo.test'] },
    { members: ['candidate@hugo.test', 'outsider@hugo.test'] },
    { members: ['stranger@hugo.test', 'outsider@hugo.test'] },
  ],
);

assert.equal(counts.get('candidate@hugo.test'), 1);
assert.equal(counts.get('stranger@hugo.test'), 0);
const location = { shareLocation: true, location: { coordinates: [106.70123, 10.77654] }, locationSource: 'ip', locationPrecisionKm: 10 };
assert.deepEqual(visibleFriendLocation(location, { isFriend: true, viewerShares: true }), {
  lat: 10.777,
  lng: 106.701,
  source: 'ip',
  precisionKm: 10,
  updatedAt: null,
});
assert.equal(visibleFriendLocation(location, { isFriend: false, viewerShares: true }), null);
assert.equal(visibleFriendLocation(location, { isFriend: true, viewerShares: false }), null);
console.log('Friend mutual-count check passed.');
