import express from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import Bio from '../models/Bio.js';
import Friendship from '../models/Friendship.js';
import SocialProfile from '../models/SocialProfile.js';
import { requireMember } from '../middleware/authMiddleware.js';
import { notifyMember } from '../utils/notifyMember.js';

const router = express.Router();
const actionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 40 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_FRIEND_ACTIONS' },
});

const findBio = (email) => Bio.findOne({ $or: [{ email }, { contactEmail: email }] });
const pairKey = (a, b) => [a, b].sort().join('|');
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizedEmail = (email) => String(email || '').toLowerCase();

export function countMutualFriends(actorFriends, candidates, relationships) {
  const actorSet = new Set(actorFriends.map(normalizedEmail));
  const candidateSet = new Set(candidates.map(normalizedEmail));
  const counts = new Map([...candidateSet].map((email) => [email, 0]));
  for (const { members = [] } of relationships) {
    const pair = members.map(normalizedEmail);
    if (pair.length !== 2) continue;
    for (let index = 0; index < 2; index += 1) {
      if (candidateSet.has(pair[index]) && actorSet.has(pair[1 - index])) {
        counts.set(pair[index], (counts.get(pair[index]) || 0) + 1);
      }
    }
  }
  return counts;
}

export function visibleFriendLocation(targetSettings, { isFriend, viewerShares }) {
  const [lng, lat] = targetSettings?.location?.coordinates || [];
  if (!isFriend || !viewerShares || !targetSettings?.shareLocation
    || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    lat: Number(lat.toFixed(3)),
    lng: Number(lng.toFixed(3)),
    source: targetSettings.locationSource || 'gps',
    precisionKm: targetSettings.locationPrecisionKm || 0.1,
    updatedAt: targetSettings.locationUpdatedAt || null,
  };
}

const settingsFor = (settings, includeOwnLocation = false) => {
  const [lng, lat] = settings?.location?.coordinates || [];
  return {
    discoverable: Boolean(settings?.discoverable),
    hasLocation: Number.isFinite(lat) && Number.isFinite(lng),
    shareLocation: Boolean(settings?.shareLocation),
    locationSource: settings?.locationSource || null,
    ...(includeOwnLocation && Number.isFinite(lat) && Number.isFinite(lng)
      ? { location: { lat, lng } }
      : {}),
  };
};

const cardFor = (bio, extra = {}) => ({
  displayName: bio.displayName,
  slug: bio.slug,
  headline: bio.headline || '',
  avatarUrl: bio.avatarUrl || '',
  ...extra,
});

async function currentMember(req, res) {
  const bio = await findBio(req.memberEmail).lean();
  if (!bio) res.status(404).json({ error: 'MEMBER_NOT_FOUND' });
  return bio;
}

async function cardsWithRelationships(actorEmail, bios, distances = new Map()) {
  const emails = bios.map((bio) => bio.email);
  const [relationships, mutualCounts] = await Promise.all([
    Friendship.find({
      members: actorEmail,
      $or: [{ requesterEmail: { $in: emails } }, { recipientEmail: { $in: emails } }],
    }).lean(),
    mutualFriendCounts(actorEmail, emails),
  ]);
  const byOther = new Map(relationships.map((item) => [
    item.members.find((email) => email !== actorEmail),
    item,
  ]));

  return bios.map((bio) => {
    const relationship = byOther.get(bio.email);
    const direction = relationship?.requesterEmail === actorEmail ? 'outgoing' : 'incoming';
    return cardFor(bio, {
      distanceKm: distances.get(bio.email) ?? null,
      mutualFriendsCount: mutualCounts.get(normalizedEmail(bio.email)) || 0,
      relationship: relationship
        ? { id: relationship._id, status: relationship.status, direction }
        : null,
    });
  });
}

async function mutualFriendCounts(actorEmail, candidateEmails) {
  if (!candidateEmails.length) return new Map();
  // ponytail: two indexed reads are enough at current scale; aggregate when discovery p95 becomes material.
  const actorRelationships = await Friendship.find({ members: actorEmail, status: 'accepted' })
    .select('members')
    .lean();
  const actorFriends = actorRelationships
    .map(({ members }) => members.find((email) => normalizedEmail(email) !== normalizedEmail(actorEmail)))
    .filter(Boolean);
  if (!actorFriends.length) return new Map();
  const candidateRelationships = await Friendship.find({
    members: { $in: candidateEmails },
    status: 'accepted',
  }).select('members').lean();
  return countMutualFriends(actorFriends, candidateEmails, candidateRelationships);
}

async function discoverableBios(emails) {
  if (!emails.length) return [];
  const bios = await Bio.find({ email: { $in: emails }, status: 'approved' })
    .select('email displayName slug headline avatarUrl')
    .lean();
  const byEmail = new Map(bios.map((bio) => [bio.email, bio]));
  return emails.map((email) => byEmail.get(email)).filter(Boolean);
}

// One snapshot keeps the three friend lists and privacy setting consistent.
router.get('/', requireMember, async (req, res) => {
  try {
    const actor = await currentMember(req, res);
    if (!actor) return;
    const email = actor.email.toLowerCase();
    const [relationships, settings] = await Promise.all([
      Friendship.find({ members: email, status: { $in: ['pending', 'accepted'] } })
        .sort({ updatedAt: -1 })
        .lean(),
      SocialProfile.findOne({ email }).lean(),
    ]);
    const otherEmails = relationships.map((item) => item.members.find((member) => member !== email));
    const [bios, friendLocations] = await Promise.all([
      discoverableBios(otherEmails),
      settings?.shareLocation
        ? SocialProfile.find({ email: { $in: otherEmails }, shareLocation: true })
          .select('email shareLocation location locationSource locationPrecisionKm locationUpdatedAt')
          .lean()
        : [],
    ]);
    const byEmail = new Map(bios.map((bio) => [bio.email, bio]));
    const locationByEmail = new Map(friendLocations.map((profile) => [profile.email, profile]));
    const mapItem = (item) => {
      const otherEmail = item.members.find((member) => member !== email);
      const bio = byEmail.get(otherEmail);
      if (!bio) return null;
      return cardFor(bio, {
        relationshipId: item._id,
        since: item.respondedAt || item.createdAt,
        sharedLocation: visibleFriendLocation(locationByEmail.get(otherEmail), {
          isFriend: item.status === 'accepted',
          viewerShares: Boolean(settings?.shareLocation),
        }),
      });
    };

    res.json({
      friends: relationships.filter((item) => item.status === 'accepted').map(mapItem).filter(Boolean),
      incoming: relationships.filter((item) => item.status === 'pending' && item.recipientEmail === email).map(mapItem).filter(Boolean),
      outgoing: relationships.filter((item) => item.status === 'pending' && item.requesterEmail === email).map(mapItem).filter(Boolean),
      settings: settingsFor(settings, true),
    });
  } catch (error) {
    console.error('GET /friends error:', error);
    res.status(500).json({ error: 'FRIENDS_LOAD_FAILED' });
  }
});

router.get('/discover', requireMember, async (req, res) => {
  try {
    const actor = await currentMember(req, res);
    if (!actor) return;
    const email = actor.email.toLowerCase();
    const query = String(req.query.q || '').trim().slice(0, 60);
    if (query && query.length < 2) return res.status(400).json({ error: 'SEARCH_TOO_SHORT' });

    let emails;
    if (query) {
      // ponytail: regex search is enough at current member scale; move to Atlas Search when discovery latency becomes material.
      const pattern = new RegExp(escapeRegex(query), 'i');
      const matches = await Bio.find({
        email: { $ne: email },
        status: 'approved',
        $or: [{ displayName: pattern }, { slug: pattern }, { headline: pattern }],
      }).select('email').limit(50).lean();
      const visible = await SocialProfile.find({
        email: { $in: matches.map((bio) => bio.email) },
        discoverable: true,
      }).select('email').lean();
      emails = visible.map((item) => item.email);
    } else {
      const visible = await SocialProfile.find({ email: { $ne: email }, discoverable: true })
        .sort({ updatedAt: -1 })
        .limit(20)
        .select('email')
        .lean();
      emails = visible.map((item) => item.email);
    }

    const bios = await discoverableBios(emails);
    res.json({ people: await cardsWithRelationships(email, bios) });
  } catch (error) {
    console.error('GET /friends/discover error:', error);
    res.status(500).json({ error: 'FRIEND_DISCOVERY_FAILED' });
  }
});

// GPS is rounded to roughly 100 m; IP fallback is rounded to city-level.
router.post('/discover/nearby', requireMember, actionLimiter, async (req, res) => {
  try {
    const actor = await currentMember(req, res);
    if (!actor) return;
    const email = actor.email.toLowerCase();
    const { lat, lng, share } = req.body || {};
    const source = req.body?.source === 'ip' ? 'ip' : 'gps';
    const locationPrecisionKm = source === 'ip' ? 10 : 0.1;
    if (share !== true || !Number.isFinite(lat) || !Number.isFinite(lng)
      || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'INVALID_LOCATION' });
    }
    const digits = source === 'ip' ? 2 : 3;
    const coordinates = [Number(lng.toFixed(digits)), Number(lat.toFixed(digits))];
    const settings = await SocialProfile.findOneAndUpdate(
      { email },
      { $set: {
        discoverable: true,
        location: { type: 'Point', coordinates },
        locationSource: source,
        locationPrecisionKm,
        locationUpdatedAt: new Date(),
      } },
      { upsert: true, new: true },
    ).lean();
    const nearby = await SocialProfile.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates },
          key: 'location',
          distanceField: 'distanceMeters',
          maxDistance: 100_000,
          spherical: true,
          query: { email: { $ne: email }, discoverable: true },
        },
      },
      { $limit: 30 },
      { $project: { email: 1, distanceMeters: 1 } },
    ]);
    const emails = nearby.map((item) => item.email);
    const distances = new Map(nearby.map((item) => [item.email, Math.max(0.1, Math.round(item.distanceMeters / 100) / 10)]));
    const bios = await discoverableBios(emails);
    res.json({
      people: await cardsWithRelationships(email, bios, distances),
      settings: settingsFor(settings, true),
    });
  } catch (error) {
    console.error('POST /friends/discover/nearby error:', error);
    res.status(500).json({ error: 'NEARBY_DISCOVERY_FAILED' });
  }
});

router.patch('/settings', requireMember, async (req, res) => {
  try {
    const actor = await currentMember(req, res);
    if (!actor) return;
    const changesDiscovery = typeof req.body?.discoverable === 'boolean';
    const changesSharing = typeof req.body?.shareLocation === 'boolean';
    if (!changesDiscovery && !changesSharing) {
      return res.status(400).json({ error: 'INVALID_DISCOVERY_SETTING' });
    }
    const email = actor.email.toLowerCase();
    const current = changesSharing && req.body.shareLocation
      ? await SocialProfile.findOne({ email }).lean()
      : null;
    if (changesSharing && req.body.shareLocation && current?.location?.coordinates?.length !== 2) {
      return res.status(409).json({ error: 'LOCATION_REQUIRED' });
    }
    const set = {};
    const unset = {};
    if (changesDiscovery) set.discoverable = req.body.discoverable;
    if (changesSharing) set.shareLocation = req.body.shareLocation;
    if (changesDiscovery && !req.body.discoverable) {
      set.locationUpdatedAt = null;
      set.shareLocation = false;
      unset.location = 1;
      unset.locationSource = 1;
      unset.locationPrecisionKm = 1;
    }
    const update = { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) };
    const settings = await SocialProfile.findOneAndUpdate({ email }, update, { upsert: true, new: true }).lean();
    res.json(settingsFor(settings, true));
  } catch (error) {
    console.error('PATCH /friends/settings error:', error);
    res.status(500).json({ error: 'FRIEND_SETTINGS_FAILED' });
  }
});

router.get('/users/:slug', requireMember, async (req, res) => {
  try {
    const actor = await currentMember(req, res);
    if (!actor) return;
    const target = await Bio.findOne({ slug: req.params.slug, status: 'approved' }).lean();
    if (!target) return res.status(404).json({ error: 'PROFILE_NOT_FOUND' });
    const actorEmail = actor.email.toLowerCase();
    const targetEmail = target.email.toLowerCase();
    const [relationship, settings, actorSettings] = await Promise.all([
      Friendship.findOne({ pairKey: pairKey(actorEmail, targetEmail) }).lean(),
      SocialProfile.findOne({ email: targetEmail }).lean(),
      SocialProfile.findOne({ email: actorEmail }).lean(),
    ]);
    const isSelf = actorEmail === targetEmail;
    const isFriend = relationship?.status === 'accepted';
    const hasPendingRequest = relationship?.status === 'pending';
    if (!isSelf && !isFriend && !hasPendingRequest && !settings?.discoverable) {
      return res.status(404).json({ error: 'PROFILE_NOT_FOUND' });
    }
    const rich = isSelf || isFriend;
    const [friendsCount, mutualCounts] = await Promise.all([
      Friendship.countDocuments({ members: targetEmail, status: 'accepted' }),
      mutualFriendCounts(actorEmail, [targetEmail]),
    ]);
    const social = {
      friendsCount,
      mutualFriendsCount: mutualCounts.get(targetEmail) || 0,
      sharedLocation: visibleFriendLocation(settings, {
        isFriend,
        viewerShares: Boolean(actorSettings?.shareLocation),
      }),
    };
    const profile = cardFor(target, rich ? {
      bio: target.bio || '',
      hobbies: target.hobbies || '',
      education: target.education || '',
      skills: target.skills || '',
      jobTitle: target.jobTitle || '',
      address: target.address || '',
      links: (target.links || [])
        .filter(({ url }) => /^https?:\/\//i.test(String(url || '')))
        .slice(0, 8)
        .map(({ label, url }) => ({ label, url })),
      ...social,
    } : social);
    res.json({
      profile,
      relationship: relationship ? {
        id: relationship._id,
        status: relationship.status,
        direction: relationship.requesterEmail === actorEmail ? 'outgoing' : 'incoming',
      } : null,
    });
  } catch (error) {
    console.error('GET /friends/users/:slug error:', error);
    res.status(500).json({ error: 'PROFILE_LOAD_FAILED' });
  }
});

router.post('/requests/:slug', requireMember, actionLimiter, async (req, res) => {
  try {
    const actor = await currentMember(req, res);
    if (!actor) return;
    const target = await Bio.findOne({ slug: req.params.slug, status: 'approved' }).lean();
    if (!target) return res.status(404).json({ error: 'MEMBER_NOT_FOUND' });
    const requesterEmail = actor.email.toLowerCase();
    const recipientEmail = target.email.toLowerCase();
    if (requesterEmail === recipientEmail) return res.status(400).json({ error: 'CANNOT_FRIEND_SELF' });
    const targetSettings = await SocialProfile.findOne({ email: recipientEmail, discoverable: true }).lean();
    if (!targetSettings) return res.status(404).json({ error: 'MEMBER_NOT_DISCOVERABLE' });

    const friendship = await Friendship.create({
      pairKey: pairKey(requesterEmail, recipientEmail),
      members: [requesterEmail, recipientEmail].sort(),
      requesterEmail,
      recipientEmail,
    });
    notifyMember({
      email: recipientEmail,
      key: 'event.friendRequest',
      params: { sender: actor.displayName },
      category: 'general',
      actionUrl: '/member/utilities/friends?view=requests',
    }).catch((error) => console.error('Friend request notification error:', error));
    res.status(201).json({ relationship: { id: friendship._id, status: friendship.status, direction: 'outgoing' } });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ error: 'FRIENDSHIP_ALREADY_EXISTS' });
    console.error('POST /friends/requests/:slug error:', error);
    res.status(500).json({ error: 'FRIEND_REQUEST_FAILED' });
  }
});

router.patch('/:id/accept', requireMember, actionLimiter, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'INVALID_FRIENDSHIP' });
    const actor = await currentMember(req, res);
    if (!actor) return;
    const email = actor.email.toLowerCase();
    const friendship = await Friendship.findOneAndUpdate(
      { _id: req.params.id, recipientEmail: email, status: 'pending' },
      { $set: { status: 'accepted', respondedAt: new Date() } },
      { new: true },
    );
    if (!friendship) return res.status(404).json({ error: 'FRIEND_REQUEST_NOT_FOUND' });
    notifyMember({
      email: friendship.requesterEmail,
      key: 'event.friendAccepted',
      params: { friend: actor.displayName },
      category: 'general',
      actionUrl: '/member/utilities/friends?view=friends',
    }).catch((error) => console.error('Friend accepted notification error:', error));
    res.json({ status: 'accepted' });
  } catch (error) {
    console.error('PATCH /friends/:id/accept error:', error);
    res.status(500).json({ error: 'FRIEND_ACCEPT_FAILED' });
  }
});

router.delete('/:id', requireMember, actionLimiter, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'INVALID_FRIENDSHIP' });
    const actor = await currentMember(req, res);
    if (!actor) return;
    const email = actor.email.toLowerCase();
    const friendship = await Friendship.findOne({ _id: req.params.id, members: email });
    if (!friendship) return res.status(404).json({ error: 'FRIENDSHIP_NOT_FOUND' });
    if (friendship.status === 'pending' && friendship.recipientEmail === email) {
      friendship.status = 'declined';
      friendship.respondedAt = new Date();
      await friendship.save();
    } else {
      await friendship.deleteOne();
    }
    res.status(204).end();
  } catch (error) {
    console.error('DELETE /friends/:id error:', error);
    res.status(500).json({ error: 'FRIEND_REMOVE_FAILED' });
  }
});

export default router;
