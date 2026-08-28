const express = require('express');
const router = express.Router();
const SiteSettings = require('../models/SiteSettings');
const adminAuth = require('../middleware/adminAuth');
const { uploadLogo, uploadFavicon, uploadQR } = require('../middleware/upload');

// GET /api/settings - Public settings for client
router.get('/', async (req, res) => {
  try {
    const settings = await SiteSettings.getSingleton();
    res.json(settings);
  } catch (err) {
    console.error('Settings error:', err);
    res.status(500).json({ message: 'Server error fetching settings' });
  }
});

// PUT /api/settings - Admin update general settings & themes
router.put('/', adminAuth, async (req, res) => {
  try {
    const settings = await SiteSettings.getSingleton();
    const {
      siteName,
      siteTagline,
      themeColors,
      depositMethods,
      minDeposit,
      maxDeposit,
      minWithdraw,
      maxWithdraw,
      maintenanceMode
    } = req.body;

    if (siteName !== undefined) settings.siteName = siteName;
    if (siteTagline !== undefined) settings.siteTagline = siteTagline;
    if (themeColors) {
      settings.themeColors = { ...settings.themeColors.toObject(), ...themeColors };
    }
    if (depositMethods) {
      settings.depositMethods = { ...settings.depositMethods.toObject(), ...depositMethods };
    }
    if (minDeposit !== undefined) settings.minDeposit = minDeposit;
    if (maxDeposit !== undefined) settings.maxDeposit = maxDeposit;
    if (minWithdraw !== undefined) settings.minWithdraw = minWithdraw;
    if (maxWithdraw !== undefined) settings.maxWithdraw = maxWithdraw;
    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;

    settings.updatedAt = new Date();
    await settings.save();

    res.json({ message: 'Settings updated successfully', settings });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ message: 'Server error updating settings' });
  }
});

// POST /api/settings/logo - Admin upload site logo
router.post('/logo', adminAuth, uploadLogo, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const settings = await SiteSettings.getSingleton();
    settings.siteLogo = `/uploads/${req.file.filename}`;
    await settings.save();
    res.json({ message: 'Logo uploaded successfully', logo: settings.siteLogo });
  } catch (err) {
    res.status(500).json({ message: 'Error uploading logo' });
  }
});

// POST /api/settings/favicon - Admin upload favicon
router.post('/favicon', adminAuth, uploadFavicon, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const settings = await SiteSettings.getSingleton();
    settings.favicon = `/uploads/${req.file.filename}`;
    await settings.save();
    res.json({ message: 'Favicon uploaded successfully', favicon: settings.favicon });
  } catch (err) {
    res.status(500).json({ message: 'Error uploading favicon' });
  }
});

// POST /api/settings/deposit-method/:method/qr - Admin upload method QR Code
router.post('/deposit-method/:method/qr', adminAuth, uploadQR, async (req, res) => {
  try {
    const { method } = req.params;
    if (!['easypaisa', 'jazzcash', 'bank'].includes(method)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const settings = await SiteSettings.getSingleton();
    const qrPath = `/uploads/${req.file.filename}`;

    if (!settings.depositMethods[method]) {
      settings.depositMethods[method] = {};
    }
    settings.depositMethods[method].qrCode = qrPath;
    await settings.save();

    res.json({ message: `${method} QR Code uploaded`, qrCode: qrPath, settings });
  } catch (err) {
    res.status(500).json({ message: 'Error uploading QR code' });
  }
});

module.exports = router;
