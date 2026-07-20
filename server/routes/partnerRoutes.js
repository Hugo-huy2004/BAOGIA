import express from 'express';
import crypto from 'crypto';
import Partner from '../models/Partner.js';
import { requireAdmin, requireMember } from '../middleware/authMiddleware.js';

const router = express.Router();

const createAccessToken = () => crypto.randomBytes(32).toString('hex');

const ensurePartnerAccessToken = async (partner) => {
  if (partner.accessToken) return partner;

  partner.accessToken = createAccessToken();
  await partner.save();
  return partner;
};

// GET: Fetch all partners
router.get('/', requireMember, async (req, res) => {
  try {
    const partners = await Partner.find().sort({ createdAt: -1 });
    // Remove accessToken from public payload for security
    const sanitizedPartners = partners.map(p => {
      const pObj = p.toObject();
      delete pObj.accessToken;
      return pObj;
    });
    res.json(sanitizedPartners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Validate public access token for embedded partner bio editor
router.get('/:id/access', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(403).json({ error: 'Missing partner access token' });
    }

    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    const partnerWithToken = await ensurePartnerAccessToken(partner);
    if (partnerWithToken.accessToken !== token) {
      return res.status(403).json({ error: 'Invalid partner access token' });
    }

    res.json({
      _id: partnerWithToken._id,
      name: partnerWithToken.name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch one partner for admin usage
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    res.json(await ensurePartnerAccessToken(partner));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Add a new partner
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, iframeUrl } = req.body;
    if (!name || !iframeUrl) {
      return res.status(400).json({ error: 'Missing name or iframeUrl' });
    }

    const partner = await Partner.create({ name, iframeUrl });
    res.status(201).json(partner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Remove partner
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Partner.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    res.json({ message: 'Partner removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
