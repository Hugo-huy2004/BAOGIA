import express from 'express';
import Package from '../models/Package.js';
import Bio from '../models/Bio.js';

const router = express.Router();

const LOGO_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', 
  '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#06b6d4'
];

// Helper to select random logo color
const getRandomLogoColor = () => {
  const randomIndex = Math.floor(Math.random() * LOGO_COLORS.length);
  return LOGO_COLORS[randomIndex];
};

// ----------------------------------------------------
// PACKAGE TEMPLATE ENDPOINTS (CRUD)
// ----------------------------------------------------

// GET all packages
router.get('/', async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create package template (color is randomized from logo colors)
router.post('/', async (req, res) => {
  try {
    const { name, duration, durationUnit = 'months', benefits = [] } = req.body;
    if (!name || !duration) {
      return res.status(400).json({ error: 'Name and duration are required' });
    }

    const color = getRandomLogoColor();
    const created = await Package.create({
      name,
      duration: Number(duration),
      durationUnit,
      benefits,
      color
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// USER ASSIGNED PACKAGES ENDPOINTS
// IMPORTANT: /user routes MUST be declared BEFORE /:id
// to prevent Express matching "user" as a MongoDB ObjectId
// ----------------------------------------------------

// GET packages for specific user by email
router.get('/user', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email query param is required' });
    }

    const bio = await Bio.findOne({ email });
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found for this email' });
    }

    res.json({ packages: bio.packages || [], expiresAt: bio.expiresAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST assign a package template to a user's Bio and extend their expiration date
router.post('/user', async (req, res) => {
  try {
    const { email, packageId } = req.body;
    if (!email || !packageId) {
      return res.status(400).json({ error: 'Email and packageId are required' });
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ error: 'Package template not found' });
    }

    const bio = await Bio.findOne({ email });
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found for this email' });
    }

    // Add to user packages
    const newPkgInstance = {
      packageId: pkg._id.toString(),
      name: pkg.name,
      duration: pkg.duration,
      durationUnit: pkg.durationUnit,
      benefits: pkg.benefits,
      color: pkg.color,
      addedAt: new Date()
    };

    bio.packages.push(newPkgInstance);

    // Extend expiration date
    let expires = new Date(bio.expiresAt);
    if (isNaN(expires.getTime()) || expires.getTime() < Date.now()) {
      expires = new Date();
    }

    if (pkg.durationUnit === 'days') {
      expires.setDate(expires.getDate() + pkg.duration);
    } else if (pkg.durationUnit === 'years') {
      expires.setFullYear(expires.getFullYear() + pkg.duration);
    } else { // months
      expires.setMonth(expires.getMonth() + pkg.duration);
    }

    bio.expiresAt = expires;
    await bio.save();

    res.json({ 
      message: 'Package assigned and expiration extended successfully', 
      packages: bio.packages, 
      expiresAt: bio.expiresAt 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE remove an assigned package from a user's Bio and reduce their expiration date
router.delete('/user', async (req, res) => {
  try {
    const { email, packageInstanceId } = req.body;
    if (!email || !packageInstanceId) {
      return res.status(400).json({ error: 'Email and packageInstanceId are required in body' });
    }

    const bio = await Bio.findOne({ email });
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found for this email' });
    }

    const pkgInstance = bio.packages.id(packageInstanceId);
    if (!pkgInstance) {
      return res.status(404).json({ error: 'Package instance not found for this user' });
    }

    // Reduce expiration date
    let expires = new Date(bio.expiresAt);
    if (pkgInstance.durationUnit === 'days') {
      expires.setDate(expires.getDate() - pkgInstance.duration);
    } else if (pkgInstance.durationUnit === 'years') {
      expires.setFullYear(expires.getFullYear() - pkgInstance.duration);
    } else { // months
      expires.setMonth(expires.getMonth() - pkgInstance.duration);
    }

    bio.expiresAt = expires;
    bio.packages.pull(packageInstanceId);
    
    await bio.save();

    res.json({ 
      message: 'Package removed and expiration reduced successfully', 
      packages: bio.packages, 
      expiresAt: bio.expiresAt 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// PACKAGE TEMPLATE WILDCARD ENDPOINTS (must come AFTER /user)
// ----------------------------------------------------

// PUT update package template
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration, durationUnit, benefits } = req.body;

    const existing = await Package.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Package template not found' });
    }

    if (name) existing.name = name;
    if (duration !== undefined) existing.duration = Number(duration);
    if (durationUnit) existing.durationUnit = durationUnit;
    if (benefits) existing.benefits = benefits;

    await existing.save();
    res.json(existing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE package template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Package.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Package template not found' });
    }
    res.json({ message: 'Package template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



export default router;
