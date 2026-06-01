import express from 'express';
import Bio from '../models/Bio.js';

const router = express.Router();

// GET /api/vcard/:slug - Generate and download vCard file (.vcf)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const bio = await Bio.findOne({ slug });

    if (!bio) {
      return res.status(404).send('Not Found');
    }

    // Clean text fields for vCard format safety
    const clean = (val) => (val || '').replace(/[\r\n]+/g, ' ').trim();

    const displayName = clean(bio.displayName);
    const phone = clean(bio.phone);
    const email = clean(bio.contactEmail || bio.email);
    const jobTitle = clean(bio.jobTitle);
    const note = clean(bio.bio || bio.headline);
    const origin = req.headers.referer || req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const bioUrl = `${origin}/slug/${bio.slug}`;

    let vCardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${displayName}`,
      `N:;${displayName};;;`,
    ];

    if (phone) {
      vCardLines.push(`TEL;TYPE=CELL:${phone}`);
    }

    if (email) {
      vCardLines.push(`EMAIL;TYPE=PREF,INTERNET:${email}`);
    }

    if (jobTitle) {
      vCardLines.push(`TITLE:${jobTitle}`);
    }

    if (note) {
      vCardLines.push(`NOTE:${note}`);
    }

    vCardLines.push(`URL:${bioUrl}`);

    if (bio.avatarUrl) {
      vCardLines.push(`PHOTO;VALUE=URI:${bio.avatarUrl}`);
    }

    vCardLines.push('END:VCARD');

    const vCardString = vCardLines.join('\r\n');

    // Set headers to trigger file download
    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${bio.slug}.vcf"`);
    res.send(vCardString);
  } catch (error) {
    console.error('Error generating vCard:', error);
    res.status(500).send('Internal Server Error');
  }
});

// GET /api/vcard/backup/:slug - Generate combined multi-contact vCard backup file for recovery
router.get('/backup/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const bio = await Bio.findOne({ slug });

    if (!bio) {
      return res.status(404).send('Not Found');
    }

    const clean = (val) => (val || '').replace(/[\r\n]+/g, ' ').trim();
    let vcfBlocks = [];

    // 1. Add Member's own primary contact card
    const myName = clean(bio.displayName);
    const myPhone = clean(bio.phone);
    const myEmail = clean(bio.contactEmail || bio.email);
    const myJob = clean(bio.jobTitle);
    const myNote = clean(bio.bio || bio.headline);
    const origin = req.headers.referer || req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const myBioUrl = `${origin}/slug/${bio.slug}`;

    let myCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${myName}`,
      `N:;${myName};;;`,
    ];
    if (myPhone) myCard.push(`TEL;TYPE=CELL:${myPhone}`);
    if (myEmail) myCard.push(`EMAIL;TYPE=PREF,INTERNET:${myEmail}`);
    if (myJob) myCard.push(`TITLE:${myJob}`);
    if (myNote) myCard.push(`NOTE:${myNote}`);
    myCard.push(`URL:${myBioUrl}`);
    if (bio.avatarUrl) myCard.push(`PHOTO;VALUE=URI:${bio.avatarUrl}`);
    myCard.push('END:VCARD');
    vcfBlocks.push(myCard.join('\r\n'));

    // 2. Add all backed up contacts
    const backedUp = bio.backedUpContacts || [];
    for (const c of backedUp) {
      const cName = clean(c.name);
      const cPhone = clean(c.phone);
      const cEmail = clean(c.email);
      if (!cName) continue;

      let cCard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${cName}`,
        `N:;${cName};;;`,
      ];
      if (cPhone) cCard.push(`TEL;TYPE=CELL:${cPhone}`);
      if (cEmail) cCard.push(`EMAIL;TYPE=INTERNET:${cEmail}`);
      cCard.push('NOTE:Sao lưu từ Hugo Wishpax Portal');
      cCard.push('END:VCARD');
      vcfBlocks.push(cCard.join('\r\n'));
    }

    const outputString = vcfBlocks.join('\r\n');

    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${bio.slug}_contacts_backup.vcf"`);
    res.send(outputString);
  } catch (error) {
    console.error('Error generating backup vCard:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
