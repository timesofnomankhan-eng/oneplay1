const bcrypt = require('bcryptjs');
const User = require('./models/User');
const SiteSettings = require('./models/SiteSettings');

async function runSeed() {
  try {
    // 1. Seed Admin User
    const adminUsername = 'Noman';
    const adminPassword = '@Nomankhan1';

    let admin = await User.findOne({ username: adminUsername });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      admin = new User({
        username: adminUsername,
        firstName: 'Noman',
        lastName: 'Admin',
        password: hashedPassword,
        role: 'admin',
        balance: 10000000,
        idNumber: '97891001'
      });
      await admin.save();
      console.log('✅ Admin user created: Noman / @Nomankhan1 (ID: 97891001)');
    } else {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(adminPassword, salt);
      admin.role = 'admin';
      admin.idNumber = '97891001';
      await admin.save();
      console.log('✅ Admin user verified: Noman (ID: 97891001)');
    }

    // 2. Seed Default Site Settings
    const settings = await SiteSettings.getSingleton();
    settings.siteName = '1play';
    settings.siteTagline = 'Your Ultimate Aviator Crash Casino';
    await settings.save();
    console.log('✅ Default site settings verified for 1play');

  } catch (err) {
    console.error('Error running seed:', err);
  }
}

module.exports = { runSeed };
